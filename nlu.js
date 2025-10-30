// nlu.js — rule-based NLU with optional LLM
// LLM import is deferred to avoid hard dependency in tests

function parseMessageRule(text) {
  const t = (text || "").toLowerCase().trim();

  // intents
  let intent = "info";
  if (/(^|\b)(book|reserve|slot|appointment)(\b|$)/.test(t)) intent = "make_booking";
  if (/(^|\b)(change|resched|move)(\b|$)/.test(t)) intent = "reschedule";
  if (/(^|\b)(cancel|call off)(\b|$)/.test(t)) intent = "cancel";
  if (/^(yes|y|confirm|ok|okay|yep)\b/.test(t)) intent = "confirm";

  // service / staff
  const service = /(haircut|color|colour|wash|style)/.exec(t)?.[0] || null;
  const staff   = /(aida|ben|cindy)/.exec(t)?.[0] || null;

  // date phrases
  let date = null;
  const weekday = /(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.exec(t)?.[0];
  if (weekday) date = weekday;
  else if (/\btomorrow\b/.test(t)) date = "tomorrow";
  else if (/\btoday\b/.test(t)) date = "today";
  else if (/next\s+(mon|tue|wed|thu|fri|sat|sun)/.test(t)) date = RegExp.$1 + "_next";

  // time: "3pm", "15:30", "3.30 pm"
  const timeMatch = /(\b\d{1,2}([:.]\d{2})?\s?(am|pm)\b|\b\d{1,2}[:.]\d{2}\b)/i.exec(t);
  const time = timeMatch ? timeMatch[0].replace(".", ":") : null;

  const missing = [];
  if (!service) missing.push("service");
  if (!date)    missing.push("date");
  if (!time)    missing.push("time");

  return { intent, entities: { service, date, time, staff, notes: null }, missing };
}

export async function parseMessage(text) {
  const enabled = (process.env.USE_LLM_NLU || "").trim();
  const allowLLM = enabled === "1" || enabled.toLowerCase() === "true" || (!!process.env.OPENAI_API_KEY && enabled !== "0");
  if (allowLLM) {
    try {
      const mod = await import("./llm.js");
      const llm = await mod.parseMessageLLM(text);
      if (llm) return llm;
    } catch {}
  }
  return parseMessageRule(text);
}
