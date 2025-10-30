// llm.js — optional OpenAI integration (JSON NLU)
import OpenAI from "openai";

let client = null;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new OpenAI({ apiKey });
  return client;
}

// Normalizes LLM output into our app schema
function normalizeResult(obj) {
  const intents = ["make_booking", "confirm", "cancel", "reschedule", "info"];
  const intent = intents.includes(obj?.intent) ? obj.intent : "info";
  const entities = {
    service: obj?.entities?.service ?? null,
    date: obj?.entities?.date ?? null,
    time: obj?.entities?.time ?? null,
    staff: obj?.entities?.staff ?? null,
    notes: obj?.entities?.notes ?? null,
  };
  const missing = Array.isArray(obj?.missing) ? obj.missing.filter(Boolean) : [];
  return { intent, entities, missing };
}

export async function parseMessageLLM(text) {
  const cli = getClient();
  if (!cli) return null; // not configured

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const sys = `You are a salon booking NLU.
Extract intent and entities from user text for a hair salon.
Return STRICT JSON only with keys: intent, entities, missing.
Allowed intents: make_booking, confirm, cancel, reschedule, info.
entities: { service, date, time, staff, notes } (all nullable strings).
missing: array of strings from ["service","date","time"].
Guidelines:
- service examples: Haircut, Color, Wash, Style (be tolerant of synonyms but output canonical names: Haircut|Color|Wash|Style)
- staff examples: Aida, Ben, Cindy (nullable)
- date supports words like today, tomorrow, weekdays (mon..sun), or literal YYYY-MM-DD; output original cue (e.g., "fri", "tomorrow", or "2025-10-03").
- time supports formats like 3pm, 15:30, 3:30 pm; output as provided (normalized punctuation allowed like 3:30pm).
- confirm intent for yes/confirm; cancel for cancel; reschedule for change.
- If info is insufficient to book, include which fields are missing.
Output JSON only, no extra text.`;

  const user = String(text || "");

  try {
    const resp = await cli.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    });

    const content = resp.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return normalizeResult(parsed);
  } catch (err) {
    // On any error, fall back to caller's rule-based NLU
    if (process.env.NODE_ENV !== "test") {
      console.error("LLM NLU error:", err?.message || err);
    }
    return null;
  }
}

