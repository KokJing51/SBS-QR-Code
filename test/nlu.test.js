import { describe, it, expect } from 'vitest';
import { parseMessage } from '../nlu.js';

describe('parseMessage', () => {
  it('extracts service/date/time', async () => {
    const r = await parseMessage('Book haircut Fri 3pm with Aida');
    expect(r.intent).toBe('make_booking');
    expect(r.entities.service).toBe('haircut');
    expect(r.entities.date).toMatch(/fri/);
    expect(r.entities.time).toMatch(/3/);
    expect(r.missing).toEqual([]);
  });
  it('suggests time when missing', async () => {
    const r = await parseMessage('Book haircut Friday');
    expect(r.intent).toBe('make_booking');
    expect(r.missing).toContain('time');
  });
});
