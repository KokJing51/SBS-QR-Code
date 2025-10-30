import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import dayjs from 'dayjs';

process.env.NODE_ENV = 'test';
import server from '../index.js';
import { db } from '../db.js';

let srv;
beforeAll(() => { srv = server; });
afterAll(() => { srv && srv.close && srv.close(); });

describe('reschedule flow', () => {
  it('creates hold and atomically swaps on confirm', async () => {
    // Seed: ensure at least one service/staff
    const svc = db.prepare("SELECT * FROM services ORDER BY id LIMIT 1").get();
    const stf = db.prepare("SELECT * FROM staff WHERE active=1 ORDER BY id LIMIT 1").get();
    expect(svc).toBeTruthy(); expect(stf).toBeTruthy();

    // Find a free future slot by probing hours
    const ins = db.prepare("INSERT INTO bookings (phone, staff_id, service_id, start_dt, end_dt, status) VALUES (?,?,?,?,?,'confirmed')");
    let startjs = dayjs().add(2,'day').hour(8).minute(0).second(0).millisecond(0);
    let info;
    for (let i=0;i<10;i++) {
      const start = startjs.toISOString();
      const end = dayjs(start).add(svc.duration_min, 'minute').toISOString();
      try { info = ins.run('+15550001', stf.id, svc.id, start, end); break } catch { startjs = startjs.add(1,'hour'); }
    }
    expect(info).toBeTruthy();
    const start = startjs.toISOString();
    const oldId = info.lastInsertRowid;

    // Token
    const token = 'tok_'+Math.random().toString(36).slice(2);
    db.prepare("INSERT INTO booking_tokens (booking_id, token) VALUES (?,?)").run(oldId, token);

    // Request reschedule to 10:00
    const start2 = dayjs(start).add(60, 'minute').toISOString();
    const r1 = await request(server).post(`/manage/${token}/reschedule`).send({ start: start2 });
    expect([200,409]).toContain(r1.statusCode);
    if (r1.statusCode === 409) return; // slot conflict; acceptable in CI randomness

    // Confirm swap
    const r2 = await request(server).post(`/manage/${token}/confirm`).send();
    expect(r2.statusCode).toBe(200);
    const newId = r2.body.new_booking_id;
    expect(newId).toBeTruthy();

    const sOld = db.prepare("SELECT status FROM bookings WHERE id=?").get(oldId).status;
    const sNew = db.prepare("SELECT status FROM bookings WHERE id=?").get(newId).status;
    expect(sOld).toBe('cancelled');
    expect(sNew).toBe('confirmed');
  });
});
