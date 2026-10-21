import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Rule } from '@/domain/types';
import { patternParser } from './patternParser';

describe('patternParser', () => {
  it("reads the brief's example", async () => {
    const rules = await patternParser.parse('Hotels up to £150/night. Nothing non-refundable. Ask me about gifts.');
    expect(rules).toMatchObject([
      { kind: 'amount_cap', onBreach: 'ask', max: { minor: 15000, currency: 'GBP' }, per: 'unit', unitLabel: 'night', category: 'hotel', source: 'Hotels up to £150/night.' },
      { kind: 'judgement', onBreach: 'block', text: 'Nothing non-refundable.' },
      { kind: 'judgement', onBreach: 'ask', text: 'Ask me about gifts.' },
    ]);
  });

  it('reads never/no phrasing as block', async () => {
    const rules = await patternParser.parse("Never spend more than £400 on one purchase.\nNo gift cards.\nNever book with Ryanair.\nDon't use Amazon or eBay.");
    expect(rules).toMatchObject([
      { kind: 'amount_cap', onBreach: 'block', max: { minor: 40000 }, per: 'purchase' },
      { kind: 'category', onBreach: 'block', mode: 'block', categories: ['gift_card'] },
      { kind: 'merchant', onBreach: 'block', mode: 'block', merchants: ['Ryanair'] },
      { kind: 'merchant', onBreach: 'block', mode: 'block', merchants: ['Amazon', 'eBay'] },
    ]);
  });

  it('reads dollar and euro limits in their own currency', async () => {
    const rules = await patternParser.parse('Up to $80 on any one item.\nUp to €50 on restaurants.');
    expect(rules).toMatchObject([
      { kind: 'amount_cap', onBreach: 'ask', max: { minor: 8000, currency: 'USD' }, per: 'purchase' },
      { kind: 'amount_cap', onBreach: 'ask', max: { minor: 5000, currency: 'EUR' }, category: 'restaurant' },
    ]);
  });

  it('handles curly apostrophes', async () => {
    const [rule] = await patternParser.parse('Don’t use Ryanair.');
    expect(rule).toMatchObject({ kind: 'merchant', onBreach: 'block', merchants: ['Ryanair'] });
  });

  it('produces valid rules with unique ids', async () => {
    const rules = await patternParser.parse('Hotels up to £150 a night. Only hotels rated 8/10 or better. Max £50 on restaurants.');
    expect(z.array(Rule).parse(rules)).toHaveLength(3);
    expect(new Set(rules.map((r) => r.id)).size).toBe(3);
    expect(rules[1]).toMatchObject({ kind: 'judgement', onBreach: 'ask' });
    expect(rules[2]).toMatchObject({ kind: 'amount_cap', category: 'restaurant', max: { minor: 5000 } });
  });
});
