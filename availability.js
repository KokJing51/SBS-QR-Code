import dayjs from "dayjs";
import "./tz-setup.js";
import { salonHours, defaultBufferMin as RAW_BUFFER } from "./rules.js";
import { db } from "./db.js";

// Harden buffer (avoid NaN)
const BUFFER = Number.isFinite(RAW_BUFFER) ? RAW_BUFFER : 0;

// Use local date strings in SQL to avoid UTC shifting
const qBusyForDay = db.prepare(`
  SELECT start_dt, end_dt
  FROM bookings
  WHERE staff_id = ?
    AND date(start_dt) = ?
    AND (
      status = 'confirmed' OR (status = 'pending' AND hold_until > datetime('now'))
    )
  ORDER BY start_dt
`);

const qTimeOffForDay = db.prepare(`
  SELECT start_dt, end_dt
  FROM time_off
  WHERE staff_id = ?
    AND date(start_dt) <= ?
    AND date(end_dt)   >= ?
  ORDER BY start_dt
`);

/**
 * generateSlots({ dateISO, serviceDurationMin, staffId })
 * dateISO may be 'YYYY-MM-DD' or any parseable string;
 * we'll normalize it to local day start.
 */
const qSalonHour = db.prepare("SELECT open_hour, close_hour FROM salon_hours WHERE dow=?");

export function generateSlots({ dateISO, serviceDurationMin, staffId }) {
  // normalize input to LOCAL day
  const d = dayjs(dateISO).startOf("day"); // local time
  const dayKey = d.day(); // 0..6 local weekday

  let rule = salonHours[dayKey];
  const row = qSalonHour.get(dayKey);
  if (row && Number.isFinite(row.open_hour) && Number.isFinite(row.close_hour)) {
    rule = [row.open_hour, row.close_hour];
  }
  if (!rule) return []; // closed

  const [startHour, endHour] = rule;
  let cursor   = d.hour(startHour).minute(0).second(0).millisecond(0);
  const endDay = d.hour(endHour).minute(0).second(0).millisecond(0);

  // fetch busy blocks using LOCAL date string
  const localDate = d.format("YYYY-MM-DD");
  const busyBookings = qBusyForDay
    .all(staffId, localDate)
    .map(r => [dayjs(r.start_dt), dayjs(r.end_dt)]);
  const busyOff = qTimeOffForDay
    .all(staffId, localDate, localDate)
    .map(r => [dayjs(r.start_dt), dayjs(r.end_dt)]);
  const busy = [...busyBookings, ...busyOff];

  const slots = [];
  const stepMin = (serviceDurationMin || 0) + BUFFER;

  // guard against invalid step
  const step = Number.isFinite(stepMin) && stepMin > 0 ? stepMin : (serviceDurationMin || 30);

  while (!cursor.add(serviceDurationMin, "minute").isAfter(endDay)) {
    const slotStart = cursor;
    const slotEnd   = cursor.add(serviceDurationMin, "minute");

    const overlaps = busy.some(([bStart, bEnd]) =>
      slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart)
    );

    if (!overlaps) {
      slots.push({
        start: slotStart.toISOString(), // keep UTC for storage/transit
        end:   slotEnd.toISOString(),
        label: `${slotStart.format("h:mm A")}–${slotEnd.format("h:mm A")}`
      });
    }
    cursor = cursor.add(step, "minute");
  }

  return slots;
}
