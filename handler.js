// handler.js — "Code Decides the Goal, LLM Decides the Words"

import dayjs from "dayjs";
import "./tz-setup.js";
import { db } from "./db.js";
import { generateSlots } from "./availability.js"; 
import { resolveNext } from "./time.js"; // Added missing import
import crypto from "crypto";
import { matchServiceWithScore, matchStaffWithScore } from "./match.js";
import { extractNLU } from "./llm_nlu.js"; // Our "Router"
import { searchKb } from './kb.js'; // For the FAQ specialist
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- OpenAI Client & Model ---
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const oa = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// --- Load All Prompt Templates ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadPrompt = (fileName) => {
  try {
    return fs.readFileSync(path.join(__dirname, fileName), 'utf8');
  } catch (e) {
    console.error(`CRITICAL ERROR: '${fileName}' not found.`, e);
    process.exit(1);
  }
};
const FAQ_PROMPT_TEMPLATE = loadPrompt('faq_prompt.txt');
const BOOKING_REPLY_TEMPLATE = loadPrompt('booking_reply_prompt.txt');
const CONFIRM_REPLY_TEMPLATE = loadPrompt('confirm_reply_prompt.txt');
const CANCEL_REPLY_TEMPLATE = loadPrompt('cancel_reply_prompt.txt');
const SMALLTALK_REPLY_TEMPLATE = loadPrompt('smalltalk_reply_prompt.txt');

// --- Constants ---
const HOLD_MINUTES = parseInt(process.env.HOLD_MINUTES || "2", 10);
const STATE_EXPIRE_MINUTES = 15; // Conversation state will be forgotten after 15 mins
const BOT_NAME = "Linda"; // Or get from env

// --- Database Queries ---
const qFirstMsgAt = db.prepare(`SELECT MIN(created_at) AS first_at FROM message_log WHERE phone=? AND direction='in'`);
const qFindService = db.prepare("SELECT * FROM services WHERE LOWER(name)=LOWER(?)");
const qFindStaff = db.prepare("SELECT * FROM staff WHERE LOWER(name)=LOWER(?)");
const qClashConfirmed = db.prepare("SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND status='confirmed' LIMIT 1");
const qClashActive = db.prepare("SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND (status='confirmed' OR (status='pending' AND hold_until > datetime('now'))) LIMIT 1");
const qInsertPending = db.prepare(`INSERT INTO bookings (phone, staff_id, service_id, start_dt, end_dt, status, hold_until, reschedule_of) VALUES (?, ?, ?, ?, ?, 'pending', ?, NULL)`);
const qConfirm = db.prepare(`UPDATE bookings SET status='confirmed', hold_until=NULL WHERE id=? AND status='pending'`);
const qGetById = db.prepare(`SELECT * FROM bookings WHERE id=?`);
const qLatestPendingFor = db.prepare(`SELECT * FROM bookings WHERE phone=? AND status='pending' AND hold_until > datetime('now') ORDER BY id DESC LIMIT 1`);
const qLatestConfirmedFor = db.prepare(`SELECT * FROM bookings WHERE phone=? AND status='confirmed' ORDER BY id DESC LIMIT 1`);
const qCancelById = db.prepare(`UPDATE bookings SET status='cancelled', hold_until=NULL WHERE id=?`);
const qExpirePendings = db.prepare(`UPDATE bookings SET status='cancelled', hold_until=NULL WHERE status='pending' AND hold_until <= datetime('now')`);
const qLog = db.prepare(`INSERT INTO message_log(direction, phone, body) VALUES (?,?,?)`);
const qTokenByBooking = db.prepare(`SELECT token FROM booking_tokens WHERE booking_id=?`);
const qInsertToken = db.prepare(`INSERT OR IGNORE INTO booking_tokens (booking_id, token, expires_at) VALUES (?,?,?)`);
const qUpsertCustomer = db.prepare(`INSERT INTO customers (phone_e164, name) VALUES (?, ?) ON CONFLICT(phone_e164) DO UPDATE SET name=COALESCE(excluded.name, customers.name)`);
const qGetCustomerName = db.prepare("SELECT name FROM customers WHERE phone_e164 = ?");
const qSvcByIdFull = db.prepare("SELECT * FROM services WHERE id=?");
const qStfByIdFull = db.prepare("SELECT * FROM staff WHERE id=?");
const qListServices = db.prepare(`SELECT name, duration_min, price FROM services ORDER BY id`);
const qListStaff = db.prepare(`SELECT name FROM staff WHERE active=1 ORDER BY id`);
const qRecentLogs = db.prepare(`SELECT direction, body FROM message_log WHERE phone=? ORDER BY id DESC LIMIT 7`);

// *** NEW QUERIES FOR STATE MANAGEMENT ***
const qGetBookingState = db.prepare("SELECT * FROM booking_state WHERE phone = ? AND expires_at > datetime('now')");
const qSaveBookingState = db.prepare(`
  INSERT INTO booking_state (phone, service, staff, date, time, name, expires_at)
  VALUES (@phone, @service, @staff, @date, @time, @name, @expires_at)
  ON CONFLICT(phone) DO UPDATE SET
    service = excluded.service,
    staff = excluded.staff,
    date = excluded.date,
    time = excluded.time,
    name = excluded.name,
    expires_at = excluded.expires_at
`);
const qClearBookingState = db.prepare("DELETE FROM booking_state WHERE phone = ?");


// --- Helper Functions (buildMenu, buildFacts) ---
function buildMenu() {
  const services = qListServices.all();
  const staff = qListStaff.all();
  const svcLines = services.map(s => `• ${s.name} (${s.duration_min} min)`).join("\n");
  const staffNames = staff.map(s => s.name).join(", ") || "our team";
  return svcLines + `\n\nTeam: ${staffNames}`;
}

function buildFacts() {
  try {
    const services = qListServices.all();
    const staff = qListStaff.all();
    
    const svcLines = services.map(s => {
      const priceFmt = s.price ? `RM${s.price.toFixed(2)}` : 'N/A';
      return `- ${s.name} (${s.duration_min} min, ${priceFmt})`;
    }).join("\n");
    
    const staffNames = staff.map(s => s.name).join(", ") || "our team";
    
    return [
      'Services and Prices:',
      svcLines,
      'Staff:',
      `- ${staffNames}`
    ].join('\n');
  } catch(e) { 
    console.error("Error in buildFacts:", e); 
    return ''; 
  }
}


// --- "SPECIALIST" FUNCTIONS ---

/**
 * NEW "REPLY SPECIALIST" (The "Mouth")
 */
async function generateLlmReply(template, context) {
  if (!oa) return "Sorry, I'm having trouble thinking of a reply.";
  let prompt;
  
  // 1. Build the prompt
  switch (template) {
    case 'faq':
      prompt = FAQ_PROMPT_TEMPLATE
        .replace('{{facts}}', context.facts || '(none)')
        .replace('{{kb}}', context.kb || '(none)')
        .replace('{{question}}', context.question);
      break;
    
    case 'booking':
      prompt = BOOKING_REPLY_TEMPLATE
        .replace('{{BOT_NAME}}', BOT_NAME)
        .replace('{{faq_answer}}', context.faq_answer || 'null')
        .replace('{{state_json}}', JSON.stringify(context.state, null, 2))
        .replace('{{goal}}', context.goal);
      break;
      
    case 'confirm':
      const { booking } = context;
      const svc = qSvcByIdFull.get(booking.service_id);
      const stf = qStfByIdFull.get(booking.staff_id);
      
      prompt = CONFIRM_REPLY_TEMPLATE
        .replace('{{BOT_NAME}}', BOT_NAME)
        .replace('{{service_name}}', svc.name)
        .replace('{{staff_name}}', stf.name)
        .replace('{{booking_when}}', dayjs(booking.start_dt).format("ddd D MMM, h:mm A"))
        .replace('{{manage_link}}', context.manage_link);
      break;

    case 'cancel':
      prompt = CANCEL_REPLY_TEMPLATE
        .replace('{{BOT_NAME}}', BOT_NAME)
        .replace('{{result}}', context.result)
        .replace('{{booking_details}}', JSON.stringify(context.booking, null, 2));
      break;
      
    case 'smalltalk':
      prompt = SMALLTALK_REPLY_TEMPLATE
        .replace('{{BOT_NAME}}', BOT_NAME)
        .replace('{{user_message}}', context.user_message);
      break;
      
    default:
      return "Sorry, I'm not sure what to say.";
  }

  // 2. Call the LLM
  try {
    const r = await oa.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: prompt }],
    });
    return r.choices[0]?.message?.content?.trim() || "Oh, I'm stuck for words";
  } catch (e) {
    console.error(`LLM (Reply Specialist '${template}') Error:`, e);
    return "Sorry, I had a problem generating a reply";
  }
}


/**
 * SPECIALIST 1: handleFAQ
 */
async function handleFAQ(question) {
  const facts = buildFacts();
  const kb = (searchKb?.(question, 2) || [])
    .map((h,i)=>`(${i+1}) ${h.title}: ${h.body}`).join('\n');
  
  return generateLlmReply('faq', {
    question,
    facts: facts || '(none)',
    kb: kb || '(none)'
  });
}

/**
 * SPECIALIST 2: handleBookingFlow (NOW STATEFUL)
 */
async function handleBookingFlow(phone, entities, faq_answer) {
  // 1. Get all known entities (from DB state + new NLU entities)
  const savedState = qGetBookingState.get(phone) || {};
  // Merge: new entities from NLU overwrite old state
  let state = {
    service: entities.service || savedState.service || null,
    staff: entities.staff || savedState.staff || null,
    date: entities.date || savedState.date || null,
    time: entities.time || savedState.time || null,
    name: entities.name || savedState.name || qGetCustomerName.get(phone)?.name || null,
  };

  // 2. --- RIGID STATE MACHINE (To find the "Goal") ---
  
  if (!state.service) {
    const menu = buildMenu();
    return `Sure, which service are you looking for?\n\n${menu}`;
  }
  if (!state.staff) {
    return generateLlmReply('booking', { goal: "GET_STAFF", state, faq_answer });
  }
  if (!state.date || !state.time) {
    return generateLlmReply('booking', { goal: "GET_DATE_TIME", state, faq_answer });
  }
  if (!state.name) {
    return generateLlmReply('booking', { goal: "GET_NAME", state, faq_answer });
  }
  
  // 3. --- ALL INFO PRESENT: ATTEMPT HOLD ---
  const { service, staff, date, time, name } = state;

  const svc = qFindService.get(service);
  let stf = staff ? qFindStaff.get(staff) : null;
  
  if (!stf) {
    //
    // *** THIS IS THE FIX ***
    // Changed `matchServiceWithScore` to `matchStaffWithScore`
    const ms = matchStaffWithScore(staff || "any", svc?.id);
    //
    stf = ms.staff || null;
  }
  
  if (!svc || !stf) {
    // If lookup fails, clear the bad state and ask again.
    state.service = null; 
    state.staff = null;
    return generateLlmReply('booking', { goal: "GET_SERVICE_AGAIN", state, faq_answer: "I couldn't find that service or staff" });
  }

  const start_dt = resolveNext(date, time);
  if (!start_dt) {
    state.date = null; // Clear bad date/time
    state.time = null;
    return generateLlmReply('booking', { goal: "GET_DATE_TIME_AGAIN", state, faq_answer: "I couldn't read that date/time" });
  }

  const startISO = dayjs(start_dt).toISOString();
  const endISO = dayjs(startISO).add(svc.duration_min, "minute").toISOString();
  const holdUntilISO = dayjs().add(HOLD_MINUTES, "minute").toISOString();
  
  try {
    const clash = qClashActive.get(stf.id, startISO);
    if (clash) throw new Error("Slot taken");
    
    db.transaction(() => {
      qInsertPending.run(phone, stf.id, svc.id, startISO, endISO, holdUntilISO);
      qUpsertCustomer.run(phone, name); // Save name
    })();

  } catch (e) {
    return generateLlmReply('booking', { goal: "SLOT_TAKEN", state, faq_answer });
  }

  // 4. --- SUCCESS: CLEAR STATE AND RETURN ---
  qClearBookingState.run(phone); // Clear state, booking is now a 'hold'
  
  const holdMsg = `Holding ⏳ *${svc.name}* with *${stf.name}*, ${dayjs(startISO).format("ddd D MMM, h:mm A")}–${dayjs(endISO).format("h:mm A")}.\nReply *Confirm* within ${HOLD_MINUTES} min to secure it.`;
  return holdMsg;
}

/**
 * SPECIALIST 3: handleConfirm
 */
async function handleConfirm(phone) {
  const pend = qLatestPendingFor.get(phone);
  if (!pend) {
    return "I don't see a pending booking to confirm.";
  }
  const clash = qClashConfirmed.get(pend.staff_id, pend.start_dt);
  if (clash) {
    qCancelById.run(pend.id);
    return "Oh no that slot was just taken. Can we Try another time?";
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
      return "I couldn't reschedule. Please try a different time.";
    }
  } else { 
    qConfirm.run(pend.id); 
  }
  
  let tok = qTokenByBooking.get(pend.id)?.token;
  if (!tok) {
    tok = crypto.randomBytes(16).toString('hex');
    const ttlDays = parseInt(process.env.MANAGE_TOKEN_TTL_DAYS || "0", 10);
    const exp = ttlDays > 0 ? dayjs().add(ttlDays, "day").toISOString() : null;
    qInsertToken.run(pend.id, tok, exp);
  }
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT||3000}`;
  const mlink = `${base}/manage/${tok}`;
  
  qClearBookingState.run(phone); // ** Clear state on confirm **

  // PASS TO LLM FOR REPLY
  return generateLlmReply('confirm', {
    booking: pend,
    manage_link: mlink
  });
}

/**
 * SPECIALIST 4: handleCancel
 */
async function handleCancel(phone) {
  const latest = qLatestConfirmedFor.get(phone);
  if (!latest) {
    return generateLlmReply('cancel', { result: "NOT_FOUND", booking: null });
  }
  
  qCancelById.run(latest.id);
  qClearBookingState.run(phone); // ** Clear state on cancel **

  return generateLlmReply('cancel', { result: "SUCCESS", booking: latest });
}

/**
 * SPECIALIST 5: handleSmalltalk
 */
async function handleSmalltalk(history) {
    const lastMsg = history.at(-1)?.content || '';
    return generateLlmReply('smalltalk', {
      user_message: lastMsg
    });
}

// --- "EXECUTOR" (The Main Handler) ---

export async function handleInboundMessage({ from, text }) {
  qExpirePendings.run(); 

  // --- New Customer Welcome ---
  const firstSeen = qFirstMsgAt.get(from)?.first_at;
  if (!firstSeen) {
    qLog.run('in', from, text || '');
    try { qUpsertCustomer.run(from, null); } catch {}
    const menu = buildMenu();
    const welcome = [
      "Hi! Welcome to FEIN booking.",
      "I see that this is our first time chatting. So here's a quick look at our main services:",
      "", menu, "",
      "You can ask me to book something (like 'I would like to book a Haircut tomorrow at 3pm with Ben'), or just ask any questions you have!"
    ].join('\n');
    qLog.run('out', from, welcome);
    return welcome;
  }
  
  // --- Returning Customer Logic ---
  qLog.run('in', from, text || '');
  const historyRows = qRecentLogs.all(from).reverse();
  const history = historyRows.map(r => ({
    role: r.direction === 'in' ? 'user' : 'assistant',
    content: r.body
  }));

  // === STEP 1: Call the "Router" ===
  const nlu = await extractNLU(history);

  // === STEP 2: Call the "Specialists" ===
  let faqResponse = null;
  let mainResponse = null;

  if (nlu.user_question) {
    faqResponse = await handleFAQ(nlu.user_question);
  }

  // ** Create a variable to hold the final state to be saved **
  let finalStateToSave = null;

  switch (nlu.intent) {
    case 'booking':
      if (nlu.entities.name) {
          try { qUpsertCustomer.run(from, nlu.entities.name); } catch(e) { console.error("Error upserting customer name:", e); }
      }
      mainResponse = await handleBookingFlow(from, nlu.entities, faqResponse);
      break;
    
    case 'confirm':
      mainResponse = await handleConfirm(from);
      break;

    case 'cancel':
      mainResponse = await handleCancel(from);
      break;
      
    case 'smalltalk':
      mainResponse = await handleSmalltalk(history); 
      break;

    case 'faq':
      mainResponse = faqResponse; 
      faqResponse = null; 
      break;
      
    default:
      if (!faqResponse) { 
        mainResponse = "Sorry, I didn't quite catch that. I can help you book, reschedule, or cancel an appointment.";
      }
  }

  // === STEP 3: Save State and Combine Reply ===
  
  // If we were in a booking flow, we must save the state *before* returning.
  // We check if the response is a 'hold' message, which means we should NOT save state.
  const isHoldMessage = mainResponse && mainResponse.startsWith('Holding ⏳');
  
  if (nlu.intent === 'booking' && !isHoldMessage) {
    // We are still in the booking flow. Load, merge, and save state.
    const savedState = qGetBookingState.get(from) || {};
    const newState = {
      service: nlu.entities.service || savedState.service || null,
      staff: nlu.entities.staff || savedState.staff || null,
      date: nlu.entities.date || savedState.date || null,
      time: nlu.entities.time || savedState.time || null,
      name: nlu.entities.name || savedState.name || qGetCustomerName.get(from)?.name || null,
    };
    
    qSaveBookingState.run({
      ...newState,
      phone: from,
      expires_at: dayjs().add(STATE_EXPIRE_MINUTES, 'minute').toISOString()
    });
  }
  
  let finalReply;

  if (nlu.intent === 'booking' && faqResponse) {
    finalReply = mainResponse;
  } else {
    finalReply = [faqResponse, mainResponse].filter(Boolean).join('\n');
  }
  
  if (!finalReply) {
    finalReply = "Sorry, I'm not sure how to help you with that.";
  }
  
  qLog.run('out', from, finalReply);
  return finalReply;
}