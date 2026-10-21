import { describe, expect, it } from 'vitest';
import { FALLBACK, SCENARIOS, scenarioFor } from '@/agent/fixtures';
import { emptyDb } from '@/store/store';
import { SUGGESTED_TASKS, seedDemo } from './demoContent';

describe('demo content', () => {
  it('parses the demo rules into the four expected rules', async () => {
    const db = emptyDb(); await seedDemo(db);
    expect(db.rules.map((r) => [r.kind, r.onBreach])).toEqual([
      ['amount_cap', 'ask'], ['judgement', 'block'], ['judgement', 'ask'], ['category', 'block'],
    ]);
    expect(db.rules[0]).toMatchObject({ max: { minor: 8000, currency: 'USD' }, per: 'purchase' });
    expect(db.settings.agentEnabled).toBe(true);
  });

  it('suggests the wordings that gave stable, unbranded live picks in Session 10, plus the headphones', () => {
    expect(SUGGESTED_TASKS).toEqual([
      'Buy a plain white ceramic coffee mug, under $15',
      "Buy a wooden building blocks set for my nephew's birthday, about $40",
      'Buy wireless headphones under $80',
    ]);
  });

  it('the three suggested tasks reach the mug, gift and headphones scenarios', () => {
    expect(SUGGESTED_TASKS.map((t) => scenarioFor(t).pick.merchant)).toEqual(['Hearth & Kiln', 'Brick & Bolt Toys', 'Second Spin Audio']);
  });

  it('no fixture names a real brand', () => {
    const text = JSON.stringify([...SCENARIOS, FALLBACK]);
    for (const brand of ['LEGO', 'Bose', 'Waterstones']) expect(text).not.toContain(brand);
  });
});
