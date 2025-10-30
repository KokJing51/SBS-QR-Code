// index.js — server + availability + bookings + reminders + admin
import 'dotenv/config';
import "./tz-setup.js";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dayjs from "dayjs";
import "./tz-setup.js";
import { db } from "./db.js";
import { generateSlots } from "./availability.js";
import { handleInboundMessage } from "./handler.js";
import { startWweb, getWwebClient } from "./wweb.js";
import { salonHours } from "./rules.js";
import crypto from "crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public", { index: false }));
app.get("/", (_req, res) => res.redirect("/index.html"));
app.get("/admin/dashboard", (_req, res) => res.redirect("/analytics.html"));

// mock/webhook (tester)
app.post("/wa/webhook", async (req, res) => {
  const { from, text } = req.body || {};
  if (!from || !text) return res.status(400).json({ error: "from + text required" });
  try {
    const reply = await handleInboundMessage({ from, text });
    return res.json({ reply });
  } catch (e) {
    console.error("webhook error:", e);
    return res.status(500).json({ error: "internal error" });
  }
});

// availability
const qGetSvcById   = db.prepare("SELECT * FROM services WHERE id=?");
const qGetStaffById = db.prepare("SELECT * FROM staff WHERE id=?");
const qDayBookings  = db.prepare(`
  SELECT start_dt, end_dt, status FROM bookings
  WHERE staff_id=? AND date(start_dt)=date(?) ORDER BY start_dt
`);
const qDayOff = db.prepare(`
  SELECT start_dt, end_dt, reason FROM time_off
  WHERE staff_id=? AND date(start_dt)<=date(?) AND date(end_dt)>=date(?) ORDER BY start_dt
`);

app.get("/debug/availability", (req, res) => {
  const { date, service_id, staff_id } = req.query;
  if (!date || !service_id || !staff_id) return res.status(400).json({ error: "date, service_id, staff_id required" });

  const svc = qGetSvcById.get(Number(service_id));
  const stf = qGetStaffById.get(Number(staff_id));
  if (!svc || !stf) return res.status(404).json({ error: "service or staff not found" });

  const d = dayjs(date).startOf("day");
  const rule = salonHours[d.day()] || null;
  const slots = generateSlots({ dateISO: d.toISOString(), serviceDurationMin: svc.duration_min, staffId: stf.id });
  const bookings = qDayBookings.all(stf.id, d.toISOString());
  const off = qDayOff.all(stf.id, d.toISOString(), d.toISOString());

  res.json({
    date: d.format("YYYY-MM-DD"),
    weekday: d.format("ddd"),
    hours_rule: rule,        
    service_min: svc.duration_min,
    staff: stf.name,
    slots_count: slots.length,
    first_5_slots: slots.slice(0,5),
    bookings,
    time_off: off
  });
});
app.get("/availability", (req, res) => {
  const { date, service_id, staff_id } = req.query;
  if (!date || !service_id || !staff_id) {
    return res.status(400).json({ error: "date, service_id, staff_id required" });
  }
  const svc = qGetSvcById.get(Number(service_id));
  const stf = qGetStaffById.get(Number(staff_id));
  if (!svc || !stf) return res.status(404).json({ error: "service or staff not found" });

  const dateISO = dayjs(date).format("YYYY-MM-DD");
  const slots = generateSlots({ dateISO, serviceDurationMin: svc.duration_min, staffId: stf.id });
  res.json({ date, service: svc.name, staff: stf.name, slots });
});

// simple POST /bookings (direct confirm for slots.html demo)
const qClash    = db.prepare(
  "SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND (status='confirmed' OR (status='pending' AND hold_until > datetime('now'))) LIMIT 1"
);
const qInsertBk = db.prepare(`
  INSERT INTO bookings (phone, staff_id, service_id, start_dt, end_dt, status)
  VALUES (?, ?, ?, ?, ?, 'confirmed')
`);
app.post("/bookings", (req, res) => {
  const { phone, service_id, staff_id, start } = req.body || {};
  if (!phone || !service_id || !staff_id || !start) {
    return res.status(400).json({ error: "phone, service_id, staff_id, start required" });
  }
  const svc = qGetSvcById.get(Number(service_id));
  const stf = qGetStaffById.get(Number(staff_id));
  if (!svc || !stf) return res.status(404).json({ error: "service or staff not found" });

  const startISO = dayjs(start).toISOString();
  const endISO   = dayjs(startISO).add(svc.duration_min, "minute").toISOString();
  const clash = qClash.get(stf.id, startISO);
  if (clash) return res.status(409).json({ error: "Slot already taken" });

  qInsertBk.run(phone, stf.id, svc.id, startISO, endISO);
  res.json({ ok: true, message: `Booked ${svc.name} with ${stf.name} at ${dayjs(startISO).format("ddd D MMM, h:mm A")}` });
});

// debug logs (optional)
const qLogs = db.prepare(`SELECT direction, phone, body, created_at FROM message_log ORDER BY id DESC LIMIT 200`);
app.get("/debug/logs", (_req, res) => res.json(qLogs.all()));

const qMetrics = {
  totals: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status='confirmed') AS confirmed,
      (SELECT COUNT(*) FROM bookings WHERE status='cancelled') AS cancelled
  `),
  byHour: db.prepare(`
    SELECT strftime('%H', start_dt) AS hour, COUNT(*) AS c
    FROM bookings WHERE status='confirmed'
    GROUP BY hour ORDER BY hour
  `),
  serviceMix: db.prepare(`
    SELECT s.name AS service, COUNT(*) AS c
    FROM bookings b JOIN services s ON s.id=b.service_id
    WHERE b.status='confirmed'
    GROUP BY s.name ORDER BY c DESC
  `),
  funnel: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM message_log WHERE direction='in') AS inbound,
      (SELECT COUNT(*) FROM bookings WHERE status='pending') AS pending,
      (SELECT COUNT(*) FROM bookings WHERE status='confirmed') AS confirmed,
      (SELECT COUNT(*) FROM bookings WHERE status='cancelled') AS cancelled
  `)
};
const qHeatmap = db.prepare(`
  SELECT CAST(strftime('%w', start_dt) AS INT) AS dow, strftime('%H', start_dt) AS hour, COUNT(*) AS c
  FROM bookings WHERE status IN ('pending','confirmed')
  GROUP BY dow, hour ORDER BY dow, hour
`);
const qBookedMinToday = db.prepare(`
  SELECT COALESCE(SUM((julianday(end_dt)-julianday(start_dt))*24*60), 0) AS mins
  FROM bookings WHERE staff_id=? AND status='confirmed' AND date(start_dt)=date('now')
`);
const qTimeOffToday = db.prepare(`
  SELECT start_dt, end_dt FROM time_off WHERE staff_id=? AND date(start_dt)<=date('now') AND date(end_dt)>=date('now')
`);
const qActiveStaff = db.prepare(`SELECT id, name FROM staff WHERE active=1 ORDER BY id`);
const minutesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return Math.max(0, e - s);
};
app.get("/metrics", (_req,res) => {
  // base metrics
  const totals = qMetrics.totals.get();
  const byHour = qMetrics.byHour.all();
  const serviceMix = qMetrics.serviceMix.all();
  const funnel = qMetrics.funnel.get();

  // median chat->confirm
  const rows = db.prepare(`
    SELECT b.created_at AS confirm_at, m.first_in AS first_in
    FROM bookings b
    JOIN (SELECT phone, MIN(created_at) AS first_in FROM message_log WHERE direction='in' GROUP BY phone) m
      ON m.phone=b.phone
    WHERE b.status='confirmed'
  `).all();
  const deltas = rows
    .map(r => (dayjs(r.confirm_at).diff(dayjs(r.first_in), 'minute')))
    .filter(x => Number.isFinite(x) && x >= 0)
    .sort((a,b) => a-b);
  const med = deltas.length ? deltas[Math.floor(deltas.length/2)] : null;

  // demand heatmap
  const heatmap = qHeatmap.all();

  // utilisation today
  const dow = dayjs().day();
  const rule = salonHours[dow];
  const util = [];
  if (rule) {
    const [hStart, hEnd] = rule; // hours
    const baseStart = hStart*60; const baseEnd = hEnd*60; // minutes from midnight
    for (const st of qActiveStaff.all()) {
      let avail = baseEnd - baseStart;
      const off = qTimeOffToday.all(st.id).map(r => [dayjs(r.start_dt), dayjs(r.end_dt)]);
      for (const [os, oe] of off) {
        const oStart = os.hour()*60 + os.minute();
        const oEnd   = oe.hour()*60 + oe.minute();
        avail -= minutesOverlap(baseStart, baseEnd, oStart, oEnd);
      }
      const booked = Math.round(qBookedMinToday.get(st.id).mins);
      const pct = avail > 0 ? Math.round((booked/avail)*100) : 0;
      util.push({ staff_id: st.id, staff: st.name, booked_min: booked, available_min: Math.max(avail,0), utilisation_pct: pct });
    }
  }

  // failures taxonomy via message patterns + holds
  const logs = db.prepare("SELECT body FROM message_log WHERE created_at >= datetime('now','-30 days')").all().map(r=>r.body||'');
  const countMatch = (re) => logs.filter(x => re.test(x)).length;
  const cancelledHolds = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status='cancelled' AND hold_until IS NOT NULL").get().c;
  const cancelledOther = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status='cancelled' AND hold_until IS NULL").get().c;
  const failures = {
    nlu_missing: countMatch(/I still need/i),
    time_unavailable: countMatch(/That time's taken|unavailable/i),
    staff_unavailable: countMatch(/No qualified staff/i),
    user_abandoned: cancelledHolds,
    other: cancelledOther
  };

  // staff-by-day utilisation (last 7 days)
  const start7 = dayjs().subtract(6,'day').startOf('day');
  const staffByDay = [];
  const qBookedDayStaff = db.prepare("SELECT COALESCE(SUM((julianday(end_dt)-julianday(start_dt))*24*60),0) AS mins FROM bookings WHERE status='confirmed' AND staff_id=? AND date(start_dt)=?");
  const qOff = db.prepare("SELECT start_dt,end_dt FROM time_off WHERE staff_id=? AND date(start_dt)<=? AND date(end_dt)>=?");
  const qHours = db.prepare("SELECT open_hour, close_hour FROM salon_hours WHERE dow=?");
  const act = qActiveStaff.all();
  for (let d=0; d<7; d++) {
    const cur = start7.add(d,'day');
    const dow = cur.day();
    let [open,close] = salonHours[dow] || [null,null];
    const h = qHours.get(dow); if (h) { open=h.open_hour; close=h.close_hour; }
    const baseStart = (open!=null && close!=null) ? open*60 : null;
    const baseEnd   = (open!=null && close!=null) ? close*60 : null;
    for (const st of act) {
      let avail = 0;
      if (baseStart!=null && baseEnd!=null) {
        avail = baseEnd - baseStart;
        const offs = qOff.all(st.id, cur.format('YYYY-MM-DD'), cur.format('YYYY-MM-DD')).map(r=>[dayjs(r.start_dt), dayjs(r.end_dt)]);
        for (const [os,oe] of offs) {
          const oStart = os.hour()*60 + os.minute(); const oEnd = oe.hour()*60 + oe.minute();
          avail -= Math.max(0, Math.min(baseEnd,oEnd) - Math.max(baseStart,oStart));
        }
      }
      const booked = Math.round(qBookedDayStaff.get(st.id, cur.format('YYYY-MM-DD')).mins);
      const util = avail>0 ? booked/avail : 0;
      staffByDay.push({ date: cur.format('YYYY-MM-DD'), staff_id: st.id, staff_name: st.name, booked_minutes: booked, available_minutes: Math.max(avail,0), utilization: Number(isFinite(util)?util.toFixed(3):0) });
    }
  }

  res.json({ totals, byHour, serviceMix, funnel, medianChatToConfirmMin: med, heatmap, utilisationToday: util, failures, staff_util_by_day: staffByDay });
});

// Daily calendar metrics (monthly view)
app.get("/metrics/daily", (req, res) => {
  const start = (req.query.start || '').trim();
  const end = (req.query.end || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ error: 'start/end YYYY-MM-DD required' });
  }
  const startD = dayjs(start).startOf('day');
  const endD = dayjs(end).startOf('day');
  if (!startD.isValid() || !endD.isValid() || endD.isBefore(startD)) return res.status(400).json({ error: 'invalid range' });
  const active = db.prepare("SELECT COUNT(*) AS c FROM staff WHERE active=1").get().c;
  const daily_calendar = [];
  const qBookedDay = db.prepare("SELECT COALESCE(SUM((julianday(end_dt)-julianday(start_dt))*24*60),0) AS mins, COUNT(*) AS c FROM bookings WHERE status='confirmed' AND date(start_dt)=?");
  const qSalonHour = db.prepare("SELECT open_hour, close_hour FROM salon_hours WHERE dow=?");
  let cur = startD;
  while (!cur.isAfter(endD)) {
    const dow = cur.day();
    let open = null, close = null;
    const row = qSalonHour.get(dow);
    if (row) { open = row.open_hour; close = row.close_hour; }
    else if (salonHours[dow]) { open = salonHours[dow][0]; close = salonHours[dow][1]; }
    const capacity_minutes = (open!=null && close!=null) ? Math.max(0, (close - open) * 60 * active) : 0;
    const dayStr = cur.format('YYYY-MM-DD');
    const bd = qBookedDay.get(dayStr);
    const booked_minutes = Math.round(bd.mins);
    const is_closed = capacity_minutes === 0;
    const utilization = capacity_minutes>0 ? booked_minutes / capacity_minutes : 0;
    daily_calendar.push({ date: dayStr, bookings_count: bd.c, booked_minutes, capacity_minutes, utilization: Number(utilization.toFixed(3)), is_closed });
    cur = cur.add(1,'day');
  }
  res.json({ daily_calendar });
});

// --- MOPA v1 ---
// Minimal JWT HS256 helpers (no external deps)
function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function signJWT(payload, secret, expSec) {
  const iat = Math.floor(Date.now()/1000);
  const exp = iat + expSec;
  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = { ...payload, iat, exp };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(claims));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${data}.${sig}`;
}
function verifyJWT(token, secret) {
  const [h,p,sig] = String(token||'').split('.');
  if (!h||!p||!sig) throw new Error('bad_token');
  const data = `${h}.${p}`;
  const expect = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  if (expect !== sig) throw new Error('bad_sig');
  const claims = JSON.parse(Buffer.from(p,'base64').toString());
  if (claims.exp && Math.floor(Date.now()/1000) > claims.exp) throw new Error('expired');
  return claims;
}

// Admin: generate invite link
app.post('/admin/mopa/invite', basicAuth, (req,res) => {
  const { email, business_name } = req.body || {};
  if (!email || !business_name) return res.status(400).json({ error: 'email and business_name required' });
  const jti = crypto.randomUUID();
  const ttlDays = parseInt(process.env.MOPA_INVITE_TTL_DAYS || '7', 10);
  const token = signJWT({ jti, email, business_name }, process.env.MOPA_INVITE_SECRET || 'dev', ttlDays*24*3600);
  const now = dayjs();
  const exp = now.add(ttlDays,'day').toISOString();
  db.prepare(`INSERT INTO invite_tokens(id,email,issued_at,expires_at,payload_json) VALUES (?,?,?,?,?)`)
    .run(jti, email, now.toISOString(), exp, JSON.stringify({ email, business_name }));
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT||3000}`;
  return res.json({ invite_link: `${base}/mopa/form?token=${token}`, jti, expires_at: exp });
});
app.get('/mopa', (req, res) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>MOPA</title>
  <style>body{font-family:system-ui,Arial;margin:20px;max-width:800px}</style></head><body>
  <h2>Onboard Your Salon</h2>
  <p>Paste your invite token link below to open the form.</p>
  <input id="tok" style="width:420px" placeholder="https://.../mopa/form?token=..." /> <button onclick="go()">Open</button>
  <ul><li>Have ready: logo URL, services (name/duration/price/synonyms), staff (names/aliases/skills), hours.</li></ul>
  <script>function go(){var t=document.getElementById('tok').value.trim(); if(!t) return; if(t.includes('/mopa/form')) location.href=t; else location.href='/mopa/form?token='+encodeURIComponent(t);}</script>
  </body></html>`;
  res.set('Content-Type','text/html; charset=utf-8').send(html);
});

function requireInviteToken(req, res, next) {
  try {
    const token = String(req.query.token||req.body?.token||'');
    const claims = verifyJWT(token, process.env.MOPA_INVITE_SECRET || 'dev');
    const row = db.prepare('SELECT * FROM invite_tokens WHERE id=?').get(claims.jti);
    if (!row) return res.status(403).send('Invalid invite');
    if (row.used_at) return res.status(410).send('Invite already used');
    if (dayjs(row.expires_at).isBefore(dayjs())) return res.status(410).send('Invite expired');
    req.invite = { claims, row, token };
    return next();
  } catch (e) {
    return res.status(403).send('Invalid or expired invite');
  }
}

app.get('/mopa/form', requireInviteToken, (req, res) => {
  const { email, business_name } = req.invite.claims;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>MOPA Form</title>
  <style>body{font-family:system-ui,Arial;margin:20px;max-width:900px} textarea{width:100%;height:240px}</style></head><body>
  <h2>Salon Onboarding</h2>
  <form method="POST" action="/mopa/submit?token=${encodeURIComponent(req.invite.token)}">
  <div><label>Business Name <input name="business_name" value="${business_name||''}"/></label></div>
  <div><label>Email <input name="email" value="${email||''}"/></label></div>
  <p>Paste JSON payload for services, staff, and hours (see example below).</p>
  <textarea name="json">{
  "services": [{"name":"Haircut","duration_min":30,"synonyms":["trim","cut"]}],
  "staff": [{"name":"Aida","aliases":["Aisha"],"skills":[1]}],
  "salon_hours": {"1":[9,18],"2":[9,18],"3":[9,18],"4":[9,18],"5":[9,18],"6":[9,14]}
}</textarea>
  <div><button type="submit">Publish</button></div>
  </form></body></html>`;
  res.set('Content-Type','text/html; charset=utf-8').send(html);
});

const qUpsertService = db.prepare(`INSERT INTO services(name,duration_min,synonyms) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET duration_min=excluded.duration_min, synonyms=excluded.synonyms`);
const qUpsertStaff   = db.prepare(`INSERT INTO staff(name,active,aliases,skills) VALUES (?,1,?,?) ON CONFLICT(name) DO UPDATE SET active=1, aliases=excluded.aliases, skills=excluded.skills`);
const qUpsertHour    = db.prepare(`INSERT INTO salon_hours(dow,open_hour,close_hour) VALUES (?,?,?) ON CONFLICT(dow) DO UPDATE SET open_hour=excluded.open_hour, close_hour=excluded.close_hour`);
const qInsertMopa    = db.prepare(`INSERT INTO mopa_status(status) VALUES ('Published')`);
const qMarkInviteUsed= db.prepare(`UPDATE invite_tokens SET used_at=datetime('now') WHERE id=? AND used_at IS NULL`);

// simple in-memory rate-limit per IP
const rl = new Map();
function rateLimitOk(ip, maxPerMin=10){
  const now = Date.now(); const windowMs = 60*1000;
  const arr = (rl.get(ip) || []).filter(ts => now - ts < windowMs);
  if (arr.length >= maxPerMin) return false;
  arr.push(now); rl.set(ip, arr); return true;
}

app.post('/mopa/submit', express.urlencoded({ extended: true }), (req, res) => {
  if (!rateLimitOk(req.ip)) return res.status(429).send('Too Many Requests');
  const token = req.query.token || '';
  try { requireInviteToken({ query: { token } }, { status: ()=>({ send: ()=>{} }) }, ()=>{}); } catch { return res.status(403).send('Invalid invite'); }
  const raw = req.body?.json || '{}';
  let payload = {};
  try { payload = JSON.parse(raw); } catch { return res.status(400).send('Bad JSON'); }
  const { services = [], staff = [], salon_hours = {} } = payload;
  try {
    const tx = db.transaction(() => {
      for (const s of services) {
        if (!s.name || !s.duration_min) continue;
        qUpsertService.run(String(s.name), Number(s.duration_min), JSON.stringify(s.synonyms||[]));
      }
      for (const st of staff) {
        if (!st.name) continue;
        qUpsertStaff.run(String(st.name), JSON.stringify(st.aliases||[]), JSON.stringify(st.skills||[]));
      }
      for (const k of Object.keys(salon_hours)) {
        const dow = parseInt(k,10); const val = salon_hours[k];
        if (Array.isArray(val) && val.length===2) qUpsertHour.run(dow, Number(val[0]), Number(val[1]));
      }
    });
    tx();
  } catch (e) {
    console.error('MOPA submit error', e);
    return res.status(500).send('internal');
  }
  const row = qInsertMopa.run();
  try { const claims = verifyJWT(token, process.env.MOPA_INVITE_SECRET || 'dev'); qMarkInviteUsed.run(claims.jti); } catch {}
  res.redirect(`/mopa/status/${row.lastInsertRowid}`);
});

app.get('/mopa/status/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM mopa_status WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(row);
});

// simple directory listing for services and staff (for microsite)
const qAllServices = db.prepare("SELECT id, name, duration_min FROM services ORDER BY id");
const qAllStaff    = db.prepare("SELECT id, name, active FROM staff WHERE active=1 ORDER BY id");
app.get("/api/services", (_req, res) => res.json(qAllServices.all()));
app.get("/api/staff",    (_req, res) => res.json(qAllStaff.all()));

// Mount SPAs (Marketplace at /site, Merchant Portal at /portal)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = (p) => path.join(__dirname, "public", p);
app.get(/^\/site(?:\/.*)?$/, (_req, res) => {
  res.sendFile(pub(path.join("site", "index.html")));
});

app.get(/^\/portal(?:\/.*)?$/, (_req, res) => {
  res.sendFile(pub(path.join("portal", "index.html")));
});

// ---- Manage links & Reschedule ----
const qGetByToken = db.prepare(`
  SELECT b.*,
         s.name AS service_name,
         st.name AS staff_name
  FROM booking_tokens t
  JOIN bookings b ON b.id=t.booking_id
  JOIN services s ON s.id=b.service_id
  JOIN staff st ON st.id=b.staff_id
  WHERE t.token=? AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))
`);
const qTokenByBooking = db.prepare("SELECT * FROM booking_tokens WHERE booking_id=?");
const qInsertToken = db.prepare("INSERT INTO booking_tokens (booking_id, token, expires_at) VALUES (?,?,?)");
const qUpsertToken = (bookingId) => {
  const existing = qTokenByBooking.get(bookingId);
  if (existing) return existing.token;
  const token = crypto.randomBytes(16).toString("hex");
  const ttlDays = parseInt(process.env.MANAGE_TOKEN_TTL_DAYS || "0", 10);
  const exp = ttlDays > 0 ? dayjs().add(ttlDays, "day").toISOString() : null;
  qInsertToken.run(bookingId, token, exp);
  return token;
};

const qPendingForOld = db.prepare(`
  SELECT * FROM bookings WHERE reschedule_of=? AND status='pending' AND hold_until > datetime('now') ORDER BY id DESC LIMIT 1
`);
const qClashActiveAny = db.prepare(
  "SELECT 1 FROM bookings WHERE staff_id=? AND start_dt=? AND (status='confirmed' OR (status='pending' AND hold_until > datetime('now'))) LIMIT 1"
);
const qInsertPendingSwap = db.prepare(`
  INSERT INTO bookings (phone, staff_id, service_id, start_dt, end_dt, status, hold_until, reschedule_of)
  VALUES (?,?,?,?,?, 'pending', ?, ?)
`);
const qConfirmById = db.prepare("UPDATE bookings SET status='confirmed', hold_until=NULL WHERE id=? AND status='pending'");
const qCancelById2 = db.prepare("UPDATE bookings SET status='cancelled', hold_until=NULL WHERE id=? AND status!='cancelled'");
const qGetStaff = db.prepare("SELECT * FROM staff WHERE id=?");
const qGetService = db.prepare("SELECT * FROM services WHERE id=?");

app.get("/api/manage/:token", (req, res) => {
  const row = qGetByToken.get(req.params.token);
  if (!row) return res.status(404).json({ error: "invalid_or_expired_token" });
  const pending = qPendingForOld.get(row.id);
  return res.json({
    booking: {
      id: row.id,
      phone: row.phone,
      service_id: row.service_id,
      service: row.service_name,
      staff_id: row.staff_id,
      staff: row.staff_name,
      start_dt: row.start_dt,
      end_dt: row.end_dt,
      status: row.status
    },
    pending_reschedule: pending || null
  });
});

app.get("/manage/:token", (req, res) => {
  const token = req.params.token;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Manage Booking</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <style>body{font-family:system-ui,Arial;margin:20px;max-width:720px} .card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0}</style>
  </head><body>
    <h2>Manage Booking</h2>
    <div id="details" class="card">Loading…</div>
    <div class="card">
      <h3>Reschedule</h3>
      <p>Enter new start time (ISO e.g. 2025-10-03T15:00):</p>
      <input id="start" style="width:260px" placeholder="YYYY-MM-DDTHH:mm"/>
      <button id="resBtn">Hold New Slot</button>
      <div id="resMsg"></div>
    </div>
    <div class="card">
      <h3>Cancel</h3>
      <button id="cancelBtn">Cancel Booking</button>
      <div id="cancelMsg"></div>
    </div>
    <script>
    const token = ${JSON.stringify(token)};
    async function load(){
      const r = await fetch('/api/manage/'+token); if(!r.ok){document.getElementById('details').innerText='Invalid link';return}
      const d = await r.json();
      const when = new Date(d.booking.start_dt);
      document.getElementById('details').innerHTML = '<b>'+d.booking.service+'</b> with <b>'+d.booking.staff+'</b><br/>' + when.toLocaleString() + ' ('+d.booking.status+')';
    }
    async function res(){
      const start = document.getElementById('start').value.trim();
      const r = await fetch('/manage/'+token+'/reschedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start})});
      const d = await r.json();
      document.getElementById('resMsg').innerText = d.error?('Error: '+d.error):(d.message||'Held. Please confirm in WhatsApp or via link.');
    }
    async function cancel(){
      const r = await fetch('/manage/'+token+'/cancel',{method:'POST'});
      const d = await r.json();
      document.getElementById('cancelMsg').innerText = d.error?('Error: '+d.error):'Cancelled';
      load();
    }
    document.getElementById('resBtn').onclick = res;
    document.getElementById('cancelBtn').onclick = cancel;
    load();
    </script>
  </body></html>`;
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.send(html);
});

app.post("/manage/:token/reschedule", (req, res) => {
  const row = qGetByToken.get(req.params.token);
  if (!row) return res.status(404).json({ error: "invalid_or_expired_token" });
  if (row.status !== 'confirmed') return res.status(400).json({ error: 'booking_not_confirmed' });
  const start = (req.body?.start || '').trim();
  if (!start) return res.status(400).json({ error: 'start_required' });

  const startISO = dayjs(start).toISOString();
  const svc = qGetService.get(row.service_id);
  const staffId = Number(req.body?.staff_id || row.staff_id);
  const endISO = dayjs(startISO).add(svc.duration_min, 'minute').toISOString();
  const holdISO = dayjs().add(5, 'minute').toISOString();

  try {
    const tx = db.transaction(() => {
      if (qClashActiveAny.get(staffId, startISO)) throw new Error('slot_taken');
      qInsertPendingSwap.run(row.phone, staffId, row.service_id, startISO, endISO, holdISO, row.id);
    });
    tx();
  } catch (e) {
    if (String(e.message).includes('UNIQUE') || e.message === 'slot_taken') {
      return res.status(409).json({ error: 'slot_taken' });
    }
    console.error('reschedule hold error', e);
    return res.status(500).json({ error: 'internal' });
  }
  return res.json({ ok: true, message: 'New slot on hold. Please confirm.' });
});

app.post("/manage/:token/confirm", (req, res) => {
  const row = qGetByToken.get(req.params.token);
  if (!row) return res.status(404).json({ error: "invalid_or_expired_token" });
  const pend = qPendingForOld.get(row.id);
  if (!pend) return res.status(404).json({ error: 'no_pending_reschedule' });
  try {
    const tx = db.transaction(() => {
      const fresh = db.prepare("SELECT status FROM bookings WHERE id=?").get(row.id);
      if (!fresh || fresh.status !== 'confirmed') throw new Error('old_not_confirmed');
      qConfirmById.run(pend.id);
      qCancelById2.run(row.id);
    });
    tx();
  } catch (e) {
    return res.status(409).json({ error: 'swap_failed' });
  }
  return res.json({ ok: true, new_booking_id: pend.id });
});

app.post("/manage/:token/cancel", (req, res) => {
  const row = qGetByToken.get(req.params.token);
  if (!row) return res.status(404).json({ error: "invalid_or_expired_token" });
  qCancelById2.run(row.id);
  return res.json({ ok: true });
});

// Secure booking details + ICS
const qTokenFor = db.prepare("SELECT * FROM booking_tokens WHERE token=?");
const qBookingById = db.prepare(`
  SELECT b.*, s.name AS service_name, st.name AS staff_name
  FROM bookings b JOIN services s ON s.id=b.service_id JOIN staff st ON st.id=b.staff_id
  WHERE b.id=?
`);
app.get("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  const token = (req.query.token || '').trim();
  const t = qTokenFor.get(token);
  if (!t || t.booking_id !== id) return res.status(403).json({ error: 'forbidden' });
  const b = qBookingById.get(id);
  if (!b) return res.status(404).json({ error: 'not_found' });
  res.json(b);
});

app.get("/bookings/:id/ics", (req, res) => {
  const id = Number(req.params.id);
  const token = (req.query.token || '').trim();
  const t = qTokenFor.get(token);
  if (!t || t.booking_id !== id) return res.status(403).send("Forbidden");
  const b = qBookingById.get(id);
  if (!b) return res.status(404).send("Not found");
  const tz = process.env.TZ || 'Asia/Kuala_Lumpur';
  const dtStart = dayjs(b.start_dt);
  const dtEnd = dayjs(b.end_dt);
  const uid = `booking-${b.id}@salon-bot`;
  const summary = `${b.service_name} with ${b.staff_name}`;
  const dtFmt = (d) => d.format('YYYYMMDDTHHmmss');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salon Bot//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtFmt(dayjs())}Z`,
    `DTSTART;TZID=${tz}:${dtFmt(dtStart)}`,
    `DTEND;TZID=${tz}:${dtFmt(dtEnd)}`,
    `SUMMARY:${summary}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=booking-${b.id}.ics`);
  res.send(ics);
});

// ---- Reminders scheduler (T-24 & T-2) ----
const qDueT24 = db.prepare(`
  SELECT b.id, b.phone, b.start_dt
  FROM bookings b
  LEFT JOIN reminder_sent r ON r.booking_id=b.id AND r.kind='T24'
  WHERE b.status='confirmed'
    AND r.id IS NULL
    AND b.start_dt BETWEEN datetime('now', '+23 hours', '+50 minutes') AND datetime('now', '+24 hours', '+10 minutes')
`);
const qDueT2 = db.prepare(`
  SELECT b.id, b.phone, b.start_dt
  FROM bookings b
  LEFT JOIN reminder_sent r ON r.booking_id=b.id AND r.kind='T2'
  WHERE b.status='confirmed'
    AND r.id IS NULL
    AND b.start_dt BETWEEN datetime('now', '+1 hours', '+50 minutes') AND datetime('now', '+2 hours', '+10 minutes')
`);
const qMarkRem = db.prepare(`INSERT OR IGNORE INTO reminder_sent (booking_id, kind) VALUES (?,?)`);

setInterval(async () => {
  const client = getWwebClient();
  if (!client) return;

  const t24 = qDueT24.all();
  for (const r of t24) {
    const when = dayjs(r.start_dt).format("ddd D MMM, h:mm A");
    try {
      await client.sendMessage(`${r.phone}@c.us`, `Reminder ⏰ Your appointment is tomorrow at ${when}. Reply 'Reschedule' or 'Cancel' if needed.`);
      qMarkRem.run(r.id, 'T24');
    } catch (e) { console.error("T24 send failed", r.id, e); }
  }
  const t2 = qDueT2.all();
  for (const r of t2) {
    const when = dayjs(r.start_dt).format("ddd D MMM, h:mm A");
    try {
      await client.sendMessage(`${r.phone}@c.us`, `Reminder ⏰ Your appointment is in ~2 hours at ${when}. See you soon!`);
      qMarkRem.run(r.id, 'T2');
    } catch (e) { console.error("T2 send failed", r.id, e); }
  }
}, 60 * 1000);

// ---- Mini Admin (basic auth) ----
function basicAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, b64] = header.split(" ");
  if (!b64) return res.status(401).set("WWW-Authenticate","Basic realm=\"admin\"").end("auth required");
  const [u,p] = Buffer.from(b64, "base64").toString().split(":");
  if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) return next();
  return res.status(401).set("WWW-Authenticate","Basic realm=\"admin\"").end("bad creds");
}

// API for admin page
const qToday = db.prepare(`
  SELECT b.id, s.name AS service, st.name AS staff, b.phone, b.start_dt, b.end_dt, b.status
  FROM bookings b
  JOIN services s ON s.id=b.service_id
  JOIN staff st ON st.id=b.staff_id
  WHERE date(b.start_dt)=date('now')
  ORDER BY b.start_dt
`);
const qCancel = db.prepare(`UPDATE bookings SET status='cancelled', hold_until=NULL WHERE id=?`);
const qAddOff = db.prepare(`INSERT INTO time_off (staff_id, start_dt, end_dt, reason) VALUES (?,?,?,?)`);
const qRange = db.prepare(`
  SELECT b.id, s.name AS service, st.name AS staff, b.phone, b.start_dt, b.end_dt, b.status
  FROM bookings b
  JOIN services s ON s.id=b.service_id
  JOIN staff st ON st.id=b.staff_id
  WHERE date(b.start_dt) BETWEEN date(?) AND date(?)
  ORDER BY b.start_dt
`);

app.get("/api/admin/range", basicAuth, (req, res) => {
  const start = (req.query.start || "").trim();
  const end   = (req.query.end   || "").trim();
  if (!start || !end) {
    return res.status(400).json({ error: "start and end (YYYY-MM-DD) are required" });
  }
  res.json(qRange.all(start, end));
});


app.get("/api/admin/today", basicAuth, (_req, res) => {
  res.json(qToday.all());
});
app.post("/api/admin/cancel", basicAuth, (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  qCancel.run(Number(id));
  res.json({ ok: true });
});
app.post("/api/admin/timeoff", basicAuth, (req, res) => {
  const { staff_id, start, end, reason } = req.body || {};
  if (!staff_id || !start || !end) return res.status(400).json({ error: "staff_id, start, end required" });
  qAddOff.run(Number(staff_id), dayjs(start).toISOString(), dayjs(end).toISOString(), reason || null);
  res.json({ ok: true });
});

// ---- start ----
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Beta listening on http://localhost:${PORT}`));
if (process.env.NODE_ENV !== "test") {
  startWweb();
}

export default server;
