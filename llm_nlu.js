// llm_nlu.js — The "Router"
import OpenAI from 'openai';
import 'dotenv/config';

// *** NEW: Import modules to read the file ***
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// *** NEW: Read the router_prompt.txt file ***
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptPath = path.join(__dirname, 'router_prompt.txt');
let ROUTER_SYSTEM_PROMPT = '';
try {
  ROUTER_SYSTEM_PROMPT = fs.readFileSync(promptPath, 'utf8');
} catch (e) {
  console.error("CRITICAL ERROR: 'router_prompt.txt' not found.", e);
  process.exit(1); // Exit if the prompt is missing
}

// Initialize the OpenAI client
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const oa = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch {
    const m = String(s).match(/\{[\s\S]*\}$/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

export async function extractNLU(history = []) {
  if (!oa) {
    console.error("OpenAI client not configured.");
    return { intent: 'unknown', entities: {}, user_question: null };
  }

  const messages = [
    // *** UPDATED: Uses the variable read from the file ***
    { role: 'system', content: ROUTER_SYSTEM_PROMPT },
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
      return {
        intent: obj.intent || 'unknown',
        entities: obj.entities || {},
        user_question: obj.user_question || null
      };
    }
  } catch (e) {
    console.error("LLM NLU (Router) Error:", e);
  }

  return { intent: 'unknown', entities: {}, user_question: null };
}