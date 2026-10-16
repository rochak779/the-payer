import { describe, expect, it } from 'vitest';
import { toPurchaseRequest } from './shopper';

const input = {
  item: 'Hotel Lisboa Plaza, 2 nights', merchant: 'Hotel Lisboa Plaza', category: 'hotel' as const,
  total_amount: 240.5, currency: 'GBP' as const, units: 2, unit_label: 'night',
  refund_policy: 'Free cancellation until 48 hours before check-in.', url: 'https://example.com/h',
  why: 'Cheapest refundable option.', listing_text: 'x'.repeat(5000),
};

describe('toPurchaseRequest', () => {
  it('converts the tool input into a purchase request in pence', () => {
    const req = toPurchaseRequest(input, '2026-11-10');
    expect(req).toMatchObject({ total: { minor: 24050, currency: 'GBP' }, units: 2, unitLabel: 'night', purchaseDate: '2026-11-10', agentNote: 'Cheapest refundable option.' });
    expect(req.listingText).toHaveLength(4000);
  });

  it('rejects a non-http link from the agent', () => {
    expect(() => toPurchaseRequest({ ...input, url: 'javascript:alert(1)' }, '2026-11-10')).toThrow();
  });
});
