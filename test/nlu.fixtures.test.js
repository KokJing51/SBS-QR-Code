import { describe, it, expect } from 'vitest';
import { parseMessage } from '../nlu.js';
import fs from 'fs';

const lines = fs.readFileSync('nlu_fixtures/examples.jsonl','utf-8').trim().split(/\r?\n/).filter(Boolean);
const fixtures = lines.map(l => JSON.parse(l));

describe('NLU fixtures (rule-only)', () => {
  it('parses intents and basic entities', async () => {
    for (const f of fixtures) {
      const r = await parseMessage(f.text);
      expect(r.intent).toBeTruthy();
      if (f.intent === 'make_booking') {
        expect(r.missing).toBeTruthy();
        expect(r.entities.service || r.missing.includes('service')).toBeTruthy();
        expect(r.entities.date || r.missing.includes('date')).toBeTruthy();
      }
    }
  });
});

