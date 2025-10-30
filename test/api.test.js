import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// run the app in test mode (prevents wwebjs from starting)
process.env.NODE_ENV = 'test';
import server from '../index.js';

let srv;
beforeAll(() => { srv = server; });
afterAll(() => { srv && srv.close && srv.close(); });

describe('availability', () => {
  it('returns slots', async () => {
    const res = await request('http://127.0.0.1:3000')
      .get('/availability?date=2025-10-03&service_id=1&staff_id=1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
  });
});
