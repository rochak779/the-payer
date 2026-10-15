import { describe, expect, it } from 'vitest';
import { PurchaseRequest, Rule } from './types';

const validRequest = {
  item: 'Hotel Lisboa Plaza, 2 nights',
  merchant: 'Hotel Lisboa Plaza',
  category: 'hotel',
  total: { minor: 24000, currency: 'GBP' },
  units: 2,
  unitLabel: 'night',
  refundPolicy: 'Free cancellation until 48 hours before check-in.',
  url: 'https://example.com/hotel',
  purchaseDate: '2026-11-01',
  agentNote: '',
  listingText: '',
};

describe('PurchaseRequest', () => {
  it('accepts a valid request', () => {
    expect(PurchaseRequest.parse(validRequest).merchant).toBe('Hotel Lisboa Plaza');
  });

  it('rejects negative or fractional pence and unknown currencies', () => {
    expect(PurchaseRequest.safeParse({ ...validRequest, total: { minor: -1, currency: 'GBP' } }).success).toBe(false);
    expect(PurchaseRequest.safeParse({ ...validRequest, total: { minor: 10.5, currency: 'GBP' } }).success).toBe(false);
    expect(PurchaseRequest.safeParse({ ...validRequest, total: { minor: 100, currency: 'JPY' } }).success).toBe(false);
  });

  it('only accepts http(s) links, so a listing link can never run script', () => {
    expect(PurchaseRequest.safeParse({ ...validRequest, url: 'javascript:alert(1)' }).success).toBe(false);
  });
});

describe('Rule', () => {
  it('parses a judgement rule and refuses an approve-on-breach rule', () => {
    const rule = { id: 'r1', source: 'Nothing non-refundable.', onBreach: 'block', kind: 'judgement', text: 'Nothing non-refundable.' };
    expect(Rule.parse(rule).kind).toBe('judgement');
    expect(Rule.safeParse({ ...rule, onBreach: 'approve' }).success).toBe(false);
  });
});
