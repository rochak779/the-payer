import { describe, expect, it } from 'vitest';
import type { Rule } from '@/domain/types';
import { sameRules } from './parseEval';

const cap: Rule = { id: 'x', source: 's', onBreach: 'ask', kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', unitLabel: 'night', category: 'hotel' };
const judge: Rule = { id: 'y', source: 's', onBreach: 'block', kind: 'judgement', text: 'Nothing non-refundable.' };

describe('sameRules', () => {
  it('matches on meaning, not ids, wording or order', () => {
    expect(sameRules([judge, cap], [
      { kind: 'amount_cap', onBreach: 'ask', max: { minor: 15000, currency: 'GBP' }, per: 'unit', category: 'hotel' },
      { kind: 'judgement', onBreach: 'block' },
    ])).toBe(true);
  });

  it('fails on a wrong limit, a wrong onBreach or a missing rule', () => {
    expect(sameRules([cap], [{ kind: 'amount_cap', onBreach: 'ask', max: { minor: 10000, currency: 'GBP' }, per: 'unit', category: 'hotel' }])).toBe(false);
    expect(sameRules([judge], [{ kind: 'judgement', onBreach: 'ask' }])).toBe(false);
    expect(sameRules([cap], [])).toBe(false);
  });

  it('ignores merchant name case and order', () => {
    const m: Rule = { id: 'm', source: 's', onBreach: 'block', kind: 'merchant', mode: 'block', merchants: ['eBay', 'Amazon'] };
    expect(sameRules([m], [{ kind: 'merchant', onBreach: 'block', mode: 'block', merchants: ['amazon', 'ebay'] }])).toBe(true);
  });
});
