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
const qUpsertCustomer   = db.prepare(`
  INSERT INTO customers (phone_e164, name) VALUES (?, ?)
  ON CONFLICT(phone_e164) DO UPDATE SET name=COALESCE(excluded.name, customers.name)
`);

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

// ---------- helpers ----------
function buildMenu() {
  const services = qListServices.all();
  const staff = qListStaff.all();

  const svcLines = services
    .map(s => `• ${s.name} (${s.duration_min} min)`)
    .join("\n");

  const staffNames = staff.map(s => s.name).join(", ") || "our team";

  // Always end with a natural follow-up sentence.
  return (
    "Here’s what we can do:\n" +
    svcLines +
    `\n\nTeam: ${staffNames}` +
    "\n\nTell me your service, date, and time — and optionally a staff preference.\n" +
    "Example: *Haircut, Fri 3:00 PM, Aida*"
  );
}

// ---------- Main handler ----------
export async function handleInboundMessage({ from, text }) {
  // expire stale holds each interaction
  qExpirePendings.run();

  // greet first-time users (check BEFORE logging this message)
  const firstSeen = qFirstMsgAt.get(from)?.first_at;
  if (!firstSeen) {
    const hello = "Hi! How can I help you with your salon appointment today?";
    qLog.run('out', from, hello);
  }

  // log inbound
  qLog.run('in', from, text || '');
  try { qUpsertCustomer.run(from, null); } catch {}

  // LLM NLU (intent + entities + follow_up/smalltalk)
  const nlu = await extractNLU(text || "");
  const entities = nlu?.entities || {};

  // If LLM suggests a clarifying question for booking-like intents
  if (nlu.follow_up && ['make_booking','reschedule','change_service'].includes(nlu.intent)) {
    const ask = String(nlu.follow_up).slice(0, 200);
    qLog.run('out', from, ask);
    return ask;
  }

  // Smalltalk shortcut
  if (nlu.intent === 'smalltalk' && nlu.smalltalk_reply) {
    const out = String(nlu.smalltalk_reply).slice(0, 300);
    qLog.run('out', from, out);
    return out;
  }

  // Numeric selection 1/2/3 for suggested alternatives
  const sel = (text||'').trim();
  if (/^[1-3]$/.test(sel)) {
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
  const ctx = qGetCtx.get(from);
  if (ctx && entities.time && (!entities.service || !entities.date)) {
    const svcRow = qSvcByIdFull.get(ctx.service_id);
    const stfRow = qStfByIdFull.get(ctx.staff_id);

    if (!svcRow || !stfRow) {
      qClearCtx.run(from);
      const reply = "Hmm, I lost the previous selection. Please say the service and date again (e.g., 'Book Haircut Fri').";
      qLog.run('out', from, reply);
      return reply;
    }

    const start_dt = resolveNext(ctx.date_local, entities.time); // supports 'YYYY-MM-DD'
    if (!start_dt) {
      const reply = "I couldn't read that time. Try '10:00 AM' or '15:30'.";
      qLog.run('out', from, reply);
      return reply;
    }

    const startISO = dayjs(start_dt).toISOString();
    const endISO   = dayjs(startISO).add(svcRow.duration_min, "minute").toISOString();

    const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();
    const tx = db.transaction((args) => {
      const [phone, staffId, serviceId, sISO, eISO, holdISO] = args;
      const clash = qClashActive.get(staffId, sISO);
      if (clash) {
        const err = new Error("Slot taken");
        err.code = "SLOT_TAKEN";
        throw err;
      }
      qInsertPending.run(phone, staffId, serviceId, sISO, eISO, holdISO);
    });
    try {
      tx([from, stfRow.id, svcRow.id, startISO, endISO, holdUntilISO]);
    } catch (e) {
      // Suggest alternatives 1/2/3
      const options = [];
      const dateLocal = dayjs(startISO).format('YYYY-MM-DD');
      const primaryStaff = stfRow.id;
      const push = (slots, staffName, sid) => {
        for (const s of slots) {
          options.push({ label: `${dayjs(s.start).format('ddd h:mm A')}–${dayjs(s.end).format('h:mm A')} (${staffName})`, staff_id: sid, start_dt: s.start, end_dt: s.end, service_id: svcRow.id });
          if (options.length >= 3) break;
        }
      };
      push(generateSlots({ dateISO: dateLocal, serviceDurationMin: svcRow.duration_min, staffId: primaryStaff }), stfRow.name, primaryStaff);
      if (options.length < 3) {
        const staffPool = db.prepare("SELECT id, name FROM staff WHERE active=1").all();
        for (const cand of staffPool) {
          if (cand.id === primaryStaff) continue;
          push(generateSlots({ dateISO: dateLocal, serviceDurationMin: svcRow.duration_min, staffId: cand.id }), cand.name, cand.id);
          if (options.length >= 3) break;
        }
      }
      if (options.length < 3) {
        const plus1 = dayjs(dateLocal).add(1,'day').format('YYYY-MM-DD');
        push(generateSlots({ dateISO: plus1, serviceDurationMin: svcRow.duration_min, staffId: primaryStaff }), stfRow.name, primaryStaff);
      }
      if (options.length < 3) {
        const plus1 = dayjs(dateLocal).add(1,'day').format('YYYY-MM-DD');
        const staffPool = db.prepare("SELECT id, name FROM staff WHERE active=1").all();
        for (const cand of staffPool) {
          if (cand.id === primaryStaff) continue;
          push(generateSlots({ dateISO: plus1, serviceDurationMin: svcRow.duration_min, staffId: cand.id }), cand.name, cand.id);
          if (options.length >= 3) break;
        }
      }
      if (options.length) {
        const until = dayjs().add(10,'minute').toISOString();
        qSetOpts.run(from, JSON.stringify(options.slice(0,3)), until);
        const lines = options.slice(0,3).map((o,i)=>`${i+1}) ${o.label}`);
        const reply = `That time's taken. Options:\n• ${lines.join('\n• ')}\nReply with '1/2/3' to pick.`;
        qLog.run('out', from, reply);
        return reply;
      }
      const reply = "That slot was just taken. Try another time?";
      qLog.run('out', from, reply);
      return reply;
    }

    qClearCtx.run(from);

    const reply =
      `Holding ⏳ *${svcRow.name}* with *${stfRow.name}*, ` +
      `${dayjs(startISO).format("ddd D MMM, h:mm A")}–${dayjs(endISO).format("h:mm A")}.\n` +
      `Reply *Confirm* within ${HOLD_MINUTES} min to secure it.`;
    qLog.run('out', from, reply);
    return reply;
  }

  // --- CONFIRM latest pending ---
  if (nlu.intent === "confirm") {
    const pend = qLatestPendingFor.get(from);
    if (!pend) {
      const reply = "I don't see a pending booking to confirm. Try 'Book Haircut Fri 3pm with Aida'.";
      qLog.run('out', from, reply);
      return reply;
    }
    const clash = qClashConfirmed.get(pend.staff_id, pend.start_dt);
    if (clash) {
      qCancelById.run(pend.id);
      const reply = "That slot was just taken. Try another time?";
      qLog.run('out', from, reply);
      return reply;
    }
    // If this is a reschedule/change swap, atomically confirm new + cancel old
    if (pend.reschedule_of) {
      try {
        const tx = db.transaction(() => {
          const old = qGetById.get(pend.reschedule_of);
          if (!old) throw new Error('old_missing');
          qConfirm.run(pend.id);
          if (old.status === 'confirmed') qCancelById.run(old.id);
        });
        tx();
      } catch (e) {
        const reply = "Reschedule failed. Please try another time.";
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
    const latest = qLatestConfirmedFor.get(from);
    if (!latest) {
      const reply = "I can't find a confirmed booking to cancel.";
      qLog.run('out', from, reply);
      return reply;
    }
    qCancelById.run(latest.id);
    const reply = "Cancelled ✅ Your slot is free again.";
    qLog.run('out', from, reply);
    qClearCtx.run(from);
    return reply;
  }

  // --- MAKE BOOKING ---
  if (nlu.intent === "make_booking") {
    // Compute missing locally (robust even if LLM doesn't supply nlu.missing)
    const need = [];
    if (!entities.service) need.push("service");
    if (!entities.date)    need.push("date");
    if (!entities.time)    need.push("time");

    // If *anything* is missing -> send human menu + follow-up
    if (need.length) {
      const menu = buildMenu();
      const follow = "Which service, date, and time would you like, and do you have a preferred staff member?";
      const out = `${menu}\n\n${follow}`;
      qLog.run('out', from, out);
      return out;
    }

    // We have full info -> create PENDING hold
    const svc = qFindService.get(entities.service);
    // pick staff: if specified, try that; else match any pool for service
    let stf = entities.staff ? qFindStaff.get(entities.staff) : null;
    if (!stf) {
      const ms = matchStaffWithScore(entities.staff || "any", svc?.id);
      stf = ms.staff || null;
    }
    if (!svc || !stf) {
      const reply = "Service or staff not found. Try 'Haircut with Aida'.";
      qLog.run('out', from, reply);
      return reply;
    }

    const start_dt = resolveNext(entities.date, entities.time);
    if (!start_dt) {
      const reply = "I couldn't resolve that date/time—try 'Fri 3pm'.";
      qLog.run('out', from, reply);
      return reply;
    }

    const startISO = dayjs(start_dt).toISOString();
    const endISO   = dayjs(startISO).add(svc.duration_min, "minute").toISOString();

    const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();

    // Try preferred staff then 'any' pool
    const anyPool = matchStaffWithScore(entities.staff || "any", svc.id).pool?.map(p => p.id) || [];
    const order = stf?.id ? [stf.id, ...anyPool.filter(id => id !== stf.id)] : anyPool;
    let held = false;
    for (const sid of order) {
      try {
        const tx = db.transaction((args) => {
          const [phone, staffId2, serviceId, sISO, eISO, holdISO] = args;
          const clash = qClashActive.get(staffId2, sISO);
          if (clash) throw new Error('SLOT_TAKEN');
          qInsertPending.run(phone, staffId2, serviceId, sISO, eISO, holdISO);
        });
        tx([from, sid, svc.id, startISO, endISO, holdUntilISO]);
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
  }

  // --- CHANGE SERVICE (e.g., "change to colouring") ---
  if (nlu.intent === "change_service") {
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
        const tx = db.transaction(() => {
          if (qClashActive.get(sid, startISO)) throw new Error('busy');
          qInsertPending.run(from, sid, newSvc.id, startISO, endISO, holdUntilISO);
          db.prepare('UPDATE bookings SET reschedule_of=? WHERE id=last_insert_rowid()').run(latest.id);
        });
        tx();
        held = sid; break;
      } catch {}
    }

    if (!held) {
      // Offer alternatives same-day
      const dateLocal = dayjs(startISO).format('YYYY-MM-DD');
      const options = [];
      const push = (slots, staffName, sid) => {
        for (const s of slots) {
          options.push({ label: `${dayjs(s.start).format('ddd h:mm A')}–${dayjs(s.end).format('h:mm A')} (${staffName})`, staff_id: sid, start_dt: s.start, end_dt: s.end, service_id: newSvc.id });
          if (options.length >= 3) break;
        }
      };
      const primaryStaff = latest.staff_id;
      const stfRow = qStfByIdFull.get(primaryStaff);
      push(generateSlots({ dateISO: dateLocal, serviceDurationMin: newSvc.duration_min, staffId: primaryStaff }), stfRow?.name || 'Staff', primaryStaff);
      if (options.length < 3) {
        const staffPool = db.prepare("SELECT id, name FROM staff WHERE active=1").all();
        for (const cand of staffPool) {
          if (cand.id === primaryStaff) continue;
          push(generateSlots({ dateISO: dateLocal, serviceDurationMin: newSvc.duration_min, staffId: cand.id }), cand.name, cand.id);
          if (options.length >= 3) break;
        }
      }
      if (options.length) {
        const until = dayjs().add(10,'minute').toISOString();
        qSetOpts.run(from, JSON.stringify(options.slice(0,3)), until);
        const lines = options.slice(0,3).map((o,i)=>`${i+1}) ${o.label}`);
        const reply = `That time is busy for ${newSvc.name}. Options:\n• ${lines.join('\n• ')}\nReply 1/2/3 to pick.`;
        qLog.run('out', from, reply);
        return reply;
      }
      const reply = `I couldn’t find a same-day time for ${newSvc.name}. Try another time?`;
      qLog.run('out', from, reply);
      return reply;
    }

    const heldStaff = qStfByIdFull.get(held);
    const reply = `Holding — *${newSvc.name}* with *${heldStaff.name}* at ${dayjs(startISO).format('ddd D MMM, h:mm A')}.\nReply *Confirm* to change your booking.`;
    qLog.run('out', from, reply);
    return reply;
  }

  // --- DEFAULT help ---
  const reply = "Hi! I can help you book, reschedule, or cancel. Try: 'Book Haircut Fri 3pm with Aida'.";
  qLog.run('out', from, reply);
  return reply;
}
