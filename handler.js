// handler.js — unified logic: logging + suggestions + pending/confirm + time-only context

import dayjs from "dayjs";
import "./tz-setup.js";
// import { parseMessage } from "./nlu.js"; // using LLM NLU instead
import { resolveNext } from "./time.js";
import { db } from "./db.js";
import { generateSlots } from "./availability.js";
import crypto from "crypto";
import { matchServiceWithScore, matchStaffWithScore } from "./match.js";
import { extractNLU } from "./llm_nlu.js";

const HOLD_MINUTES = parseInt(process.env.HOLD_MINUTES || "2", 10);

// first inbound helper (for greeting)
const qFirstMsgAt = db.prepare(`
  SELECT MIN(created_at) AS first_at FROM message_log WHERE phone=? AND direction='in'
`);

// ---------- Prepared statements ----------
const qFindService      = db.prepare("SELECT * FROM services WHERE LOWER(name)=LOWER(?)");
const qFindStaff        = db.prepare("SELECT * FROM staff WHERE LOWER(name)=LOWER(?)");

const qClashConfirmed   = db.prepare("SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND status='confirmed' LIMIT 1");
const qClashActive      = db.prepare(
  "SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND (status='confirmed' OR (status='pending' AND hold_until > datetime('now'))) LIMIT 1"
);

const qInsertPending    = db.prepare(`
  INSERT INTO bookings (phone, staff_id, service_id, start_dt, end_dt, status, hold_until, reschedule_of)
  VALUES (?, ?, ?, ?, ?, 'pending', ?, NULL)
`);
const qConfirm          = db.prepare(`UPDATE bookings SET status='confirmed', hold_until=NULL WHERE id=? AND status='pending'`);
const qGetById          = db.prepare(`SELECT * FROM bookings WHERE id=?`);

const qLatestPendingFor   = db.prepare(`
  SELECT * FROM bookings
  WHERE phone=? AND status='pending' AND hold_until > datetime('now')
  ORDER BY id DESC LIMIT 1
`);
const qLatestConfirmedFor = db.prepare(`
  SELECT * FROM bookings
  WHERE phone=? AND status='confirmed'
  ORDER BY id DESC LIMIT 1
`);
const qCancelById       = db.prepare(`UPDATE bookings SET status='cancelled', hold_until=NULL WHERE id=?`);
const qExpirePendings   = db.prepare(`UPDATE bookings SET status='cancelled', hold_until=NULL WHERE status='pending' AND hold_until <= datetime('now')`);

const qLog              = db.prepare(`INSERT INTO message_log(direction, phone, body) VALUES (?,?,?)`);
const qTokenByBooking   = db.prepare(`SELECT token FROM booking_tokens WHERE booking_id=?`);
const qInsertToken      = db.prepare(`INSERT OR IGNORE INTO booking_tokens (booking_id, token, expires_at) VALUES (?,?,?)`);

// *** UPDATED: Upsert customer and get name ***
const qUpsertCustomer   = db.prepare(`
  INSERT INTO customers (phone_e164, name) VALUES (?, ?)
  ON CONFLICT(phone_e164) DO UPDATE SET name=COALESCE(excluded.name, customers.name)
`);
const qGetCustomerName  = db.prepare("SELECT name FROM customers WHERE phone_e164 = ?");

const qSvcByIdFull      = db.prepare("SELECT * FROM services WHERE id=?");
const qStfByIdFull      = db.prepare("SELECT * FROM staff WHERE id=?");

// NEW: lists for menu
const qListServices = db.prepare(`SELECT name, duration_min FROM services ORDER BY id`);
const qListStaff    = db.prepare(`SELECT name FROM staff WHERE active=1 ORDER BY id`);

// Session context (so a reply like "10:00 AM" works after suggestions)
const qSetCtx = db.prepare(`
  INSERT INTO session_ctx (phone, service_id, staff_id, date_local, expires_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(phone) DO UPDATE SET
    service_id=excluded.service_id,
    staff_id=excluded.staff_id,
    date_local=excluded.date_local,
    expires_at=excluded.expires_at
`);
const qGetCtx   = db.prepare(`SELECT * FROM session_ctx WHERE phone=? AND expires_at > datetime('now')`);
const qClearCtx = db.prepare(`DELETE FROM session_ctx WHERE phone=?`);
const qSetOpts = db.prepare(`
  INSERT INTO session_opts (phone, options_json, expires_at)
  VALUES (?, ?, ?)
  ON CONFLICT(phone) DO UPDATE SET options_json=excluded.options_json, expires_at=excluded.expires_at
`);
const qGetOpts = db.prepare(`SELECT * FROM session_opts WHERE phone=? AND expires_at > datetime('now')`);
const qClearOpts = db.prepare(`DELETE FROM session_opts WHERE phone=?`);

// *** NEW ***: Query for message history
const qRecentLogs = db.prepare(`
  SELECT direction, body FROM message_log
  WHERE phone=? ORDER BY id DESC LIMIT 7
`);

// ---------- helpers ----------
function buildMenu() {
  const services = qListServices.all();
  const staff = qListStaff.all();

  const svcLines = services
    .map(s => `• ${s.name} (${s.duration_min} min)`)
    .join("\n");

  const staffNames = staff.map(s => s.name).join(", ") || "our team";

  // This will just return the raw menu data
  return (
    svcLines +
    `\n\nTeam: ${staffNames}`
  );
}

// ---------- Main handler ----------
export async function handleInboundMessage({ from, text }) {
  // expire stale holds each interaction
  qExpirePendings.run();

  // *** === NEW CUSTOMER GREETING LOGIC === ***
  // Check if this is a new customer BEFORE logging their first message
  const firstSeen = qFirstMsgAt.get(from)?.first_at;
  
  if (!firstSeen) {
    // This is a NEW USER.
    // Log their first inbound message
    qLog.run('in', from, text || '');
    try { qUpsertCustomer.run(from, null); } catch {}

    // Now, build and send our special, multi-line welcome message.
    const menu = buildMenu();
    const welcome = [
      "Hi! Welcome to FEIN booking.",
      "I see that this is our first time chatting. So here's a quick look at our main services:",
      "", // new line
      menu, // This contains services and staff
      "", // new line
      "You can ask me to book something (like 'I would like to book a Haircut tomorrow at 3pm with Ben'), or just ask any questions you have!"
    ].join('\n');
    
    qLog.run('out', from, welcome);
    return welcome; // <-- IMPORTANT: We return here and stop processing.
  }
  // *** === END NEW CUSTOMER LOGIC === ***

  // log inbound (for returning customers)
  qLog.run('in', from, text || '');
  try { qUpsertCustomer.run(from, null); } catch {}

  // Fetch history and pass to LLM
  const historyRows = qRecentLogs.all(from).reverse(); 
  const history = historyRows.map(r => ({
    role: r.direction === 'in' ? 'user' : 'assistant',
    content: r.body
  }));
  
  // LLM NLU (pass the full history)
  const nlu = await extractNLU(history);
  const entities = nlu?.entities || {};

  // *** NEW ***: Save the name to the customer table AS SOON as we get it
  if (entities.name) {
    try { qUpsertCustomer.run(from, entities.name); } catch(e) { console.error("Error upserting customer name:", e); }
  }

  // If LLM suggests a clarifying question (but NOT for a new booking)
  if (nlu.follow_up && ['reschedule','change_service'].includes(nlu.intent)) {
    const ask = String(nlu.follow_up).slice(0, 200);
    qLog.run('out', from, ask);
    return ask;
  }

  // Smalltalk shortcut (for "hi", "thanks", etc.)
  if (nlu.intent === 'smalltalk' && nlu.smalltalk_reply) {
    const out = String(nlu.smalltalk_reply).slice(0, 300);
    qLog.run('out', from, out);
    return out;
  }

  // Numeric selection 1/2/3 for suggested alternatives
  const sel = (text||'').trim();
  if (/^[1-3]$/.test(sel)) {
    // ... (this logic is fine, no changes needed)
    const opt = qGetOpts.get(from);
    if (opt) {
      try {
        const list = JSON.parse(opt.options_json || '[]');
        const idx = parseInt(sel,10) - 1;
        const chosen = list[idx];
        if (chosen) {
          const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();
          const tx = db.transaction(() => {
            const clash = qClashActive.get(chosen.staff_id, chosen.start_dt);
            if (clash) throw new Error('SLOT_TAKEN');
            qInsertPending.run(from, chosen.staff_id, chosen.service_id, chosen.start_dt, chosen.end_dt, holdUntilISO);
          });
          tx();
          qClearOpts.run(from);
          const svcRow = qSvcByIdFull.get(chosen.service_id);
          const stfRow = qStfByIdFull.get(chosen.staff_id);
          const reply = `Holding — *${svcRow.name}* with *${stfRow.name}*, ${dayjs(chosen.start_dt).format('ddd D MMM, h:mm A')}–${dayjs(chosen.end_dt).format('h:mm A')}.\nReply *Confirm* within ${HOLD_MINUTES} min to secure it.`;
          qLog.run('out', from, reply);
          return reply;
        }
      } catch {}
    }
  }

  // --- TIME-ONLY REPLY USING CONTEXT ---
  // This is now a fallback, as the LLM should handle most context
  const ctx = qGetCtx.get(from);
  if (ctx && entities.time && (!entities.service || !entities.date)) {
    // ... (this logic is fine, no changes needed)
    const svcRow = qSvcByIdFull.get(ctx.service_id);
    const stfRow = qStfByIdFull.get(ctx.staff_id);

    if (!svcRow || !stfRow) {
      qClearCtx.run(from);
      const reply = "Oh no, I lost the previous selection. Can you please say the service and date again (like 'Book a Haircut on Friday').";
      qLog.run('out', from, reply);
      return reply;
    }
    const start_dt = resolveNext(ctx.date_local, entities.time);
    if (!start_dt) {
      const reply = "I couldn't read that time. Can you try it in this way? ('10:00 AM' or '10:00')";
      qLog.run('out', from, reply);
      return reply;
    }
    const startISO = dayjs(start_dt).toISOString();
    const endISO   = dayjs(startISO).add(svcRow.duration_min, "minute").toISOString();
    const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();
    try {
      db.transaction(() => {
        const clash = qClashActive.get(stfRow.id, startISO);
        if (clash) throw new Error("Slot taken");
        qInsertPending.run(from, stfRow.id, svcRow.id, startISO, endISO, holdUntilISO);
      })();
    } catch (e) {
      const reply = "That slot was just taken by another customer :( Try another time?";
      qLog.run('out', from, reply);
      return reply;
    }
    qClearCtx.run(from);
    const reply =
      `Holding *${svcRow.name}* with *${stfRow.name}*, ` +
      `${dayjs(startISO).format("ddd D MMM, h:mm A")}–${dayjs(endISO).format("h:mm A")}.\n` +
      `Reply *Confirm* within ${HOLD_MINUTES} min to secure it.`;
    qLog.run('out', from, reply);
    return reply;
  }

  // --- CONFIRM latest pending ---
  if (nlu.intent === "confirm") {
    // ... (this logic is fine, no changes needed)
    const pend = qLatestPendingFor.get(from);
    if (!pend) {
      const reply = "I don't see a pending booking to confirm. Can you try 'Please book Haircut on Friday at 3pm with Aida'.";
      qLog.run('out', from, reply);
      return reply;
    }
    const clash = qClashConfirmed.get(pend.staff_id, pend.start_dt);
    if (clash) {
      qCancelById.run(pend.id);
      const reply = "Oh no that slot was just taken. Can we Try another time?";
      qLog.run('out', from, reply);
      return reply;
    }
    if (pend.reschedule_of) {
      try {
        db.transaction(() => {
          const old = qGetById.get(pend.reschedule_of);
          if (!old) throw new Error('old_missing');
          qConfirm.run(pend.id);
          if (old.status === 'confirmed') qCancelById.run(old.id);
        })();
      } catch (e) {
        const reply = "I couldn't reschedule. Please try a different time.";
        qLog.run('out', from, reply);
        return reply;
      }
    } else {
      qConfirm.run(pend.id);
    }
    const svcRow = qSvcByIdFull.get(pend.service_id);
    const stfRow = qStfByIdFull.get(pend.staff_id);
    const when = `${dayjs(pend.start_dt).format("ddd D MMM, h:mm A")}–${dayjs(pend.end_dt).format("h:mm A")}`;
    const reply = `Confirmed ✅ ${svcRow?.name || "Service"} with ${stfRow?.name || "Staff"}, ${when}.`;
    let tok = qTokenByBooking.get(pend.id)?.token;
    if (!tok) {
      tok = crypto.randomBytes(16).toString('hex');
      const ttlDays = parseInt(process.env.MANAGE_TOKEN_TTL_DAYS || "0", 10);
      const exp = ttlDays > 0 ? dayjs().add(ttlDays, "day").toISOString() : null;
      qInsertToken.run(pend.id, tok, exp);
    }
    const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT||3000}`;
    const mlink = `${base}/manage/${tok}`;
    const reply2 = `${reply} Manage: ${mlink}`;
    qLog.run('out', from, reply2);
    qClearCtx.run(from);
    return reply2;
  }

  // --- CANCEL latest confirmed ---
  if (nlu.intent === "cancel") {
    // ... (this logic is fine, no changes needed)
    const latest = qLatestConfirmedFor.get(from);
    if (!latest) {
      const reply = "Oh no I can't find a confirmed booking to cancel can you please check if you got the right booking details?.";
      qLog.run('out', from, reply);
      return reply;
    }
    qCancelById.run(latest.id);
    const reply = "Cancelled, Your slot is now free again.";
    qLog.run('out', from, reply);
    qClearCtx.run(from);
    return reply;
  }

  // --- MAKE BOOKING ---
  if (nlu.intent === "make_booking") {
    
    // 1. Get all known entities from the LLM
    const { service, date, time, staff: staffName } = entities;
    
    // 2. Check if we know the customer's name (either from this message or DB)
    const customerName = qGetCustomerName.get(from)?.name;

    // 3. Check if we have EVERYTHING needed for a hold
    if (service && date && time && customerName) {
      // ---- ALL INFO IS PRESENT: CREATE HOLD ----
      
      const svc = qFindService.get(service);
      let stf = staffName ? qFindStaff.get(staffName) : null;
      if (!stf) {
        const ms = matchStaffWithScore(staffName || "any", svc?.id);
        stf = ms.staff || null;
      }
      if (!svc || !stf) {
        const reply = "I couldn't find that service or staff. Let's try again. What service would you like?";
        qLog.run('out', from, reply);
        return reply;
      }

      const start_dt = resolveNext(date, time);
      if (!start_dt) {
        const reply = "I couldn't resolve that date/time—try 'Fri 3pm'.";
        qLog.run('out', from, reply);
        return reply;
      }

      const startISO = dayjs(start_dt).toISOString();
      const endISO   = dayjs(startISO).add(svc.duration_min, "minute").toISOString();
      const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();

      const anyPool = matchStaffWithScore(staffName || "any", svc.id).pool?.map(p => p.id) || [];
      const order = stf?.id ? [stf.id, ...anyPool.filter(id => id !== stf.id)] : anyPool;
      let held = false;
      for (const sid of order) {
        try {
          db.transaction((args) => {
            const [phone, staffId2, serviceId, sISO, eISO, holdISO] = args;
            const clash = qClashActive.get(staffId2, sISO);
            if (clash) throw new Error('SLOT_TAKEN');
            qInsertPending.run(phone, staffId2, serviceId, sISO, eISO, holdISO);
          })([from, sid, svc.id, startISO, endISO, holdUntilISO]);
          held = true;
          stf = qStfByIdFull.get(sid);
          break;
        } catch {}
      }
      if (!held) {
        const reply = "That slot was just taken. Try another time?";
        qLog.run('out', from, reply);
        return reply;
      }

      const reply =
        `Holding ⏳ *${svc.name}* with *${stf.name}*, ` +
        `${dayjs(startISO).format("ddd D MMM, h:mm A")}–${dayjs(endISO).format("h:mm A")}.\n` +
        `Reply *Confirm* within ${HOLD_MINUTES} min to secure it, or it will be released.`;
      qLog.run('out', from, reply);
      return reply;

    } else {
      // ---- INFO IS MISSING: SEND LLM'S QUESTION ----
      
      // The LLM's `follow_up` is now the single source of truth for "what's next?"
      // It will either be "What time?" or "What's your name?" etc.
      if (nlu.follow_up) {
        const ask = String(nlu.follow_up).slice(0, 300);
        qLog.run('out', from, ask);
        return ask;
      } else {
        // Fallback: If the LLM failed, just send the menu.
        // This handles the first "I wanna make a booking" message.
        const menu = buildMenu();
        const out = [
          "Sure, I can help with that!",
          "Here's what we offer:",
          "",
          menu
        ].join('\n');
        qLog.run('out', from, out);
        return out;
      }
    }
  }

  // --- CHANGE SERVICE (e.g., "change to colouring") ---
  if (nlu.intent === "change_service") {
    // ... (this logic is fine, no changes needed)
    const latest = qLatestConfirmedFor.get(from);
    if (!latest) {
      const reply = "I can't find a confirmed booking to change.";
      qLog.run('out', from, reply);
      return reply;
    }
    const newSvcName = (entities?.new_service || entities?.service || "").trim();
    if (!newSvcName) {
      const reply = "Which service would you like instead?";
      qLog.run('out', from, reply);
      return reply;
    }
    const newSvc = qFindService.get(newSvcName);
    if (!newSvc) {
      const reply = `I couldn't find "${newSvcName}". Try a service name from the menu.`;
      qLog.run('out', from, reply);
      return reply;
    }
    const startISO = dayjs(latest.start_dt).toISOString();
    const endISO   = dayjs(startISO).add(newSvc.duration_min, "minute").toISOString();
    const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();
    const staffOrder = [latest.staff_id, ...db.prepare('SELECT id FROM staff WHERE active=1').all().map(r=>r.id).filter(id=>id!==latest.staff_id)];
    let held = null;
    for (const sid of staffOrder) {
      try {
        db.transaction(() => {
          if (qClashActive.get(sid, startISO)) throw new Error('busy');
          qInsertPending.run(from, sid, newSvc.id, startISO, endISO, holdUntilISO);
          db.prepare('UPDATE bookings SET reschedule_of=? WHERE id=last_insert_rowid()').run(latest.id);
        })();
        held = sid; break;
      } catch {}
    }
    if (!held) {
      const reply = `I couldn’t find a same-day time for ${newSvc.name}. Try another time?`;
      qLog.run('out', from, reply);
      return reply;
    }
    const heldStaff = qStfByIdFull.get(held);
    const reply = `Holding — *${newSvc.name}* with *${heldStaff.name}* at ${dayjs(startISO).format('ddd D MMM, h:mm A')}.\nReply *Confirm* to change your booking.`;
    qLog.run('out', from, reply);
    return reply;
  }

  // --- *** UPDATED: DEFAULT help (The "revolting" message) *** ---
  const reply = "Sorry, I didn't quite catch that. I can help you book, reschedule, or cancel an appointment.";
  qLog.run('out', from, reply);
  return reply;
}