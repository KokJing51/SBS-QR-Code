// llm_nlu.js — robust LLM-based NLU (ESM)
import OpenAI from 'openai';
import 'dotenv/config';
import { searchKb } from './kb.js';         // optional RAG (RAG lookup)
import { db } from './db.js';

// Build “facts” for better grounding (live services, staff, hours)
function buildFacts() {
  try {
    const services = db.prepare("SELECT name, duration_min FROM services ORDER BY id").all();
    const staff    = db.prepare("SELECT name FROM staff WHERE active=1 ORDER BY id").all();
    const hours    = db.prepare("SELECT dow, open_hour, close_hour FROM salon_hours ORDER BY dow").all();
    return [
      'Services:',
      ...services.map(s => `- ${s.name} (${s.duration_min} min)`),
      'Staff:',
      ...staff.map(s => `- ${s.name}`),
      'Hours (0=Sun..6=Sat):',
      ...hours.map(h => `- ${h.dow}: ${h.open_hour ?? 'closed'}–${h.close_hour ?? 'closed'}`)
    ].join('\n');
  } catch { return ''; }
}

const SYSTEM = `
You are the Salon Booking Assistant.

Extract intent and entities for salon appointments. STRICT RULES:
- Do NOT confirm a booking yourself. The app handles holds/confirm.
- Keep inside salon hours and staff skills (use provided "Facts").
- If details are missing, propose ONE short clarifying question in "follow_up".
- If user is chatting (smalltalk), put intent="smalltalk" and provide a short friendly reply in "smalltalk_reply".
- If user asks about policies/FAQ, use "faq" and summarise from Context if available.

Output strictly JSON with keys: intent, entities, confidence, follow_up?, smalltalk_reply?.
entities keys (strings unless noted):
  service, date (YYYY-MM-DD or natural), time (HH:mm or natural), staff, new_service,
  name, phone, lang, notes
`;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const oa = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch { 
    // naive repair: grab {...} block if exists
    const m = String(s).match(/\{[\s\S]*\}$/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

export async function extractNLU(userText) {
  // Fallback if no key: minimal regexy guess
  if (!oa) {
    const t = userText.toLowerCase();
    const intent =
      /resched/.test(t) ? 'reschedule' :
      /cancel/.test(t)   ? 'cancel'     :
      /confirm/.test(t)  ? 'confirm'    :
      /book|appoint/.test(t) ? 'make_booking' :
      'unknown';
    return { intent, entities: {}, confidence: 0.4 };
  }

  const facts = buildFacts();
  const kb = (searchKb?.(userText, 2) || [])
    .map((h,i)=>`(${i+1}) ${h.title}: ${h.body}`).join('\n');

  const input =
`Facts:
${facts || '(none)'}
---
Context:
${kb || '(none)'}
---
User: ${userText}
Required JSON schema:
{
  "intent": "make_booking|confirm|cancel|reschedule|change_service|smalltalk|faq|unknown",
  "entities": {
    "service": "...",
    "date": "...",
    "time": "...",
    "staff": "...",
    "new_service": "...",
    "name": "...",
    "phone": "...",
    "lang": "...",
    "notes": "..."
  },
  "confidence": 0..1,
  "follow_up": "..." (optional),
  "smalltalk_reply": "..." (optional)
}
Return ONLY JSON.`;

  const r = await oa.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: SYSTEM.trim() },
      { role: 'user', content: input }
    ],
  });

  const txt = r.output_text?.trim() || '';
  const obj = safeParseJSON(txt);
  if (obj && typeof obj.intent === 'string' && obj.entities) return obj;
  return { intent: 'unknown', entities: {}, confidence: 0.0 };
}
// inside extractNLU() where you call the KB:
let kbHits = [];
try {
  kbHits = searchKb(text, 3);
} catch { /* ignore KB errors */ }
