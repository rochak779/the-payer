import { describe, expect, it } from 'vitest';
import type { AmountCapRule } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { checkHardLimits } from './hardLimits';

const hotelCap: AmountCapRule = {
  id: 'hotel-cap', source: 'Hotels up to £150 a night.', onBreach: 'ask',
  kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', unitLabel: 'night', category: 'hotel',
};
const totalCap: AmountCapRule = {
  id: 'total-cap', source: 'Never spend more than £400 on one purchase.', onBreach: 'block',
  kind: 'amount_cap', max: { minor: 40000, currency: 'GBP' }, per: 'purchase',
};
const gbp = (minor: number) => ({ minor, currency: 'GBP' as const });

describe('amount caps', () => {
  it('passes a purchase under the limit', () => {
    expect(checkHardLimits(makeRequest({ total: gbp(24000), units: 2 }), [hotelCap, totalCap])).toEqual([]);
  });

  it('treats a price exactly at the limit as within it', () => {
    expect(checkHardLimits(makeRequest({ total: gbp(30000), units: 2 }), [hotelCap])).toEqual([]);
    expect(checkHardLimits(makeRequest({ category: 'electronics', total: gbp(40000) }), [totalCap])).toEqual([]);
  });

  it("flags 1p over with the rule's own outcome and a readable reason", () => {
    const [ask] = checkHardLimits(makeRequest({ total: gbp(15001), units: 1 }), [hotelCap]);
    expect(ask).toMatchObject({ ruleId: 'hotel-cap', by: 'code', outcome: 'ask' });
    expect(ask.message).toBe('£150.01 per night is over your £150 limit.');
    const [block] = checkHardLimits(makeRequest({ category: 'electronics', total: gbp(40001) }), [totalCap]);
    expect(block.outcome).toBe('block');
  });

  it('works out the per-night price from the total', () => {
    const [reason] = checkHardLimits(makeRequest({ total: gbp(31000), units: 2 }), [hotelCap]);
    expect(reason.message).toBe('£155 per night is over your £150 limit.');
  });

  it('compares the whole total when the unit count is missing (conservative)', () => {
    expect(checkHardLimits(makeRequest({ total: gbp(24000), units: undefined }), [hotelCap])).toHaveLength(1);
  });

  it('only applies a category-scoped cap to that category', () => {
    expect(checkHardLimits(makeRequest({ category: 'flight', total: gbp(90000), units: undefined }), [hotelCap])).toEqual([]);
  });

  it('asks when the currency differs, even for a block rule', () => {
    const [reason] = checkHardLimits(makeRequest({ category: 'electronics', total: { minor: 10000, currency: 'EUR' } }), [totalCap]);
    expect(reason.outcome).toBe('ask');
    expect(reason.message).toContain("can't compare");
  });
});
