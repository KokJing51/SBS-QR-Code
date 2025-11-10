// llm_nlu.js — robust LLM-based NLU (ESM)
import OpenAI from 'openai';
import 'dotenv/config';
import { searchKb } from './kb.js';
import { db } from './db.js';

// *** NEW: Import modules to read the file ***
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// *** NEW: Read the system prompt from system_prompt.txt ***
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptPath = path.join(__dirname, 'system_prompt.txt');
let SYSTEM = '';
try {
  SYSTEM = fs.readFileSync(promptPath, 'utf8');
} catch (e) {
  console.error("CRITICAL ERROR: 'system_prompt.txt' not found.", e);
  process.exit(1); // Exit if the prompt is missing
}

// Build “facts” for better grounding (live services, staff, hours)
function buildFacts() {
  try {
    const services = db.prepare("SELECT name, duration_min FROM services ORDER BY id").all();
    const staff    = db.prepare("SELECT name FROM staff WHERE active=1 ORDER BY id").all();
    
    const svcLines = services.map(s => `- ${s.name} (${s.duration_min} min)`).join("\n");
    const staffNames = staff.map(s => s.name).join(", ") || "our team";
    
    return [
      'Services:',
      svcLines,
      'Staff:',
      `- ${staffNames}`
    ].join('\n');
  } catch { return ''; }
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const oa = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch { 
    const m = String(s).match(/\{[\s\S]*\}$/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

// Function signature is unchanged
export async function extractNLU(history = []) {
  // Fallback if no key
  if (!oa) {
    const userText = history.at(-1)?.content || '';
    const t = userText.toLowerCase();
    const intent =
      /resched/.test(t) ? 'reschedule' :
      /cancel/.test(t)   ? 'cancel'     :
      /confirm/.test(t)  ? 'confirm'    :
      /book|appoint/.test(t) ? 'make_booking' :
      'unknown';
    return { intent: "make_booking", entities: { service: "Haircut" }, confidence: 0.4 }; // Mock for fallback
  }

  const userText = history.at(-1)?.content || '';
  const facts = buildFacts();
  const kb = (searchKb?.(userText, 2) || [])
    .map((h,i)=>`(${i+1}) ${h.title}: ${h.body}`).join('\n');

  // Dynamic system prompt
  const dynamicSystem = `
${SYSTEM.trim()}

---
Facts (Current Salon Info):
${facts || '(none)'}
---
Context (FAQ search results for last user message):
${kb || '(none)'}
---
Required JSON schema:
{
  "intent": "make_booking|confirm|cancel|reschedule|smalltalk|faq|faq_services|unknown",
  "entities": {
    "service": "...",
    "date": "...",
    "time": "...",
    "staff": "...",
    "name": "...",
    "phone": "..."
  },
  "confidence": 0..1,
  "follow_up": "..." (optional),
  "smalltalk_reply": "..." (optional)
}
Return ONLY JSON.
`;

  const messages = [
    { role: 'system', content: dynamicSystem },
    ...history.slice(-6) // Send the last 6 messages
  ];
  
  try {
    const r = await oa.chat.completions.create({
      model: MODEL,
      messages: messages,
      response_format: { type: "json_object" }, 
    });

    const txt = r.choices[0]?.message?.content?.trim() || '';
    const obj = safeParseJSON(txt);
    if (obj && typeof obj.intent === 'string' && obj.entities) {
      return obj;
    }
  } catch (e) {
    console.error("LLM NLU Error:", e);
  }
  
  return { intent: 'unknown', entities: {}, confidence: 0.0 };
}