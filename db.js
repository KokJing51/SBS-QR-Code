// db.js — schema for pending/confirm, reminders, time off, logs
import Database from "better-sqlite3";

export const db = new Database("salon.db");
db.pragma("journal_mode = WAL");

// --- lightweight migrations for existing DBs ---
function hasColumn(table, col) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(r => r.name === col);
}
// --- lightweight migrations for existing DBs ---
if (!hasColumn("bookings", "hold_until")) {
  db.prepare(`ALTER TABLE bookings ADD COLUMN hold_until TEXT`).run();
}

if (!hasColumn("bookings", "created_at")) {
  // 1) add column without default (SQLite limitation)
  db.prepare(`ALTER TABLE bookings ADD COLUMN created_at TEXT`).run();
  // 2) backfill existing rows
  db.prepare(`UPDATE bookings SET created_at = datetime('now') WHERE created_at IS NULL`).run();
  // 3) ensure future inserts get a timestamp if not provided
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_bookings_created_at
    AFTER INSERT ON bookings
    WHEN NEW.created_at IS NULL
    BEGIN
      UPDATE bookings SET created_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

// Add reschedule_of column to link new booking to old during swap
if (!hasColumn("bookings", "reschedule_of")) {
  db.prepare(`ALTER TABLE bookings ADD COLUMN reschedule_of INTEGER REFERENCES bookings(id)`).run();
}

// customers table (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  phone_e164 TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Backfill new columns for existing DBs
if (!hasColumn('services','synonyms')) {
  db.prepare(`ALTER TABLE services ADD COLUMN synonyms TEXT`).run();
}
if (!hasColumn('staff','aliases')) {
  db.prepare(`ALTER TABLE staff ADD COLUMN aliases TEXT`).run();
}
if (!hasColumn('staff','skills')) {
  db.prepare(`ALTER TABLE staff ADD COLUMN skills TEXT`).run();
}

// Add customer_id to bookings if missing
if (!hasColumn("bookings", "customer_id")) {
  db.prepare(`ALTER TABLE bookings ADD COLUMN customer_id INTEGER REFERENCES customers(id)`).run();
}

// Backfill customers from existing bookings phones
db.exec(`
  INSERT OR IGNORE INTO customers(phone_e164)
  SELECT DISTINCT phone FROM bookings WHERE phone IS NOT NULL;
  UPDATE bookings
  SET customer_id = (
    SELECT id FROM customers c WHERE c.phone_e164 = bookings.phone
  )
  WHERE customer_id IS NULL AND phone IS NOT NULL;
`);

// ensure new tables exist (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS reminder_sent (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('T24','T2')),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (booking_id, kind)
);
CREATE TABLE IF NOT EXISTS time_off (
  id INTEGER PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  start_dt TEXT NOT NULL,
  end_dt TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---- migrations ----
db.exec(`
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  duration_min INTEGER NOT NULL,
  synonyms TEXT -- JSON array of strings
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  aliases TEXT, -- JSON array of strings
  skills  TEXT  -- JSON array of service IDs the staff can do; NULL or empty = all
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL,
  staff_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  start_dt TEXT NOT NULL,
  end_dt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
  hold_until TEXT, -- for 'pending' reservations; NULL when confirmed/cancelled
  customer_id INTEGER,
  reschedule_of INTEGER, -- if this booking was created to replace another booking
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (reschedule_of) REFERENCES bookings(id)
);

-- unique conflict only for confirmed (pending are allowed while holding)
CREATE UNIQUE INDEX IF NOT EXISTS u_staff_start_confirmed
  ON bookings (staff_id, start_dt) WHERE status='confirmed';
-- prevent overlapping holds on same start for pending as well
CREATE UNIQUE INDEX IF NOT EXISTS u_staff_start_pending
  ON bookings (staff_id, start_dt) WHERE status='pending';

CREATE TABLE IF NOT EXISTS message_log (
  id INTEGER PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  phone TEXT,
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- reminders tracker to avoid duplicates
CREATE TABLE IF NOT EXISTS reminder_sent (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('T24','T2')),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (booking_id, kind),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- optional time-off to block staff availability
CREATE TABLE IF NOT EXISTS time_off (
  id INTEGER PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  start_dt TEXT NOT NULL,
  end_dt TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);
CREATE TABLE IF NOT EXISTS session_ctx (
  phone TEXT PRIMARY KEY,
  service_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  date_local TEXT NOT NULL,           -- 'YYYY-MM-DD' (local)
  expires_at TEXT NOT NULL            -- datetime string
);

-- store suggested options for quick numeric selection (1/2/3)
CREATE TABLE IF NOT EXISTS session_opts (
  phone TEXT PRIMARY KEY,
  options_json TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- optional salon hours (overrides rules.js if set)
CREATE TABLE IF NOT EXISTS salon_hours (
  dow INTEGER PRIMARY KEY,           -- 0=Sun..6=Sat
  open_hour INTEGER NOT NULL,
  close_hour INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mopa_status (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Invite token registry for MOPA
CREATE TABLE IF NOT EXISTS invite_tokens (
  id TEXT PRIMARY KEY,           -- jti (uuid)
  email TEXT,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_exp ON invite_tokens(expires_at);
`);

// Trigger to auto-link booking to customer by phone if customer_id not provided
db.exec(`
CREATE TRIGGER IF NOT EXISTS trg_bookings_customer_link
AFTER INSERT ON bookings
WHEN NEW.customer_id IS NULL AND NEW.phone IS NOT NULL
BEGIN
  UPDATE bookings
  SET customer_id = (
    SELECT id FROM customers WHERE phone_e164 = NEW.phone
  )
  WHERE id = NEW.id;
END;
`);

// Manage tokens for bookings
db.exec(`
CREATE TABLE IF NOT EXISTS booking_tokens (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
`);

const svcCount = db.prepare("SELECT COUNT(*) AS c FROM services").get().c;
if (!svcCount) {
  db.prepare("INSERT INTO services (name, duration_min) VALUES (?,?)").run("Haircut", 30);
  db.prepare("INSERT INTO services (name, duration_min) VALUES (?,?)").run("Color",   60);
}

const stfCount = db.prepare("SELECT COUNT(*) AS c FROM staff").get().c;
if (!stfCount) {
  db.prepare("INSERT INTO staff (name, active) VALUES (?,1)").run("Aida");
  db.prepare("INSERT INTO staff (name, active) VALUES (?,1)").run("Ben");
}
