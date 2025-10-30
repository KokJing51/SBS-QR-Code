// time.js — robust date/time resolver for rules + context
import dayjs from "dayjs";
import "./tz-setup.js";

const weekdays = ["sun","mon","tue","wed","thu","fri","sat"];

export function resolveNext(dateWord, timeWord) {
  if (!dateWord) return null;

  // --- resolve the DATE ---
  let d;
  const dw = String(dateWord).trim().toLowerCase();

  // direct YYYY-MM-DD (used by session context)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dw)) {
    d = dayjs(dw);
  } else {
    const now = dayjs();

    if (dw === "today") {
      d = now;
    } else if (dw === "tomorrow") {
      d = now.add(1, "day");
    } else if (/^next\s+(mon|tue|wed|thu|fri|sat|sun)\b/.test(dw)) {
      const idx = weekdays.indexOf(RegExp.$1);
      d = now.add(1, "week").day(idx);
    } else {
      // plain weekday like "fri" / "friday"
      const base = weekdays.findIndex(w => dw.startsWith(w));
      if (base === -1) return null;

      // next occurrence of that weekday (including the coming one)
      d = now.add(1, "day");
      for (let i = 0; i < 7; i++) {
        if (d.day() === base) break;
        d = d.add(1, "day");
      }
    }
  }

  // Guard: invalid date
  if (!d || !d.isValid()) return null;

  // --- resolve the TIME ---
  let hh = 9, mm = 0; // default 09:00 if no time provided
  if (timeWord) {
    let s = String(timeWord).trim().toLowerCase().replace(/\s+/g, "");
    // allow 3pm, 3:30pm, 3.30pm, 15:30
    const m = s.match(/^(\d{1,2})(?::|\.?)(\d{2})?(am|pm)?$/);
    if (!m) return null;

    hh = parseInt(m[1], 10);
    mm = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3];

    if (ampm === "pm" && hh < 12) hh += 12;
    if (ampm === "am" && hh === 12) hh = 0;
  }

  return d.hour(hh).minute(mm).second(0).millisecond(0).toDate();
}
