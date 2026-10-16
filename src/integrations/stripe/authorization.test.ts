import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import { toChargeAttempt } from './authorization';
import { stripeClient } from './client';

const auth = (over: Record<string, unknown> = {}) => ({
  amount: 0,
  currency: 'gbp',
  pending_request: { amount: 24000, currency: 'gbp' },
  card: { metadata: { approval_id: 'apv_123' } },
  merchant_data: { name: 'Hotel Lisboa Plaza' },
  ...over,
}) as unknown as Stripe.Issuing.Authorization;

describe('toChargeAttempt', () => {
  it('reads the pending amount, currency, merchant and approval id', () => {
    expect(toChargeAttempt(auth())).toEqual({ approvalId: 'apv_123', amount: { minor: 24000, currency: 'GBP' }, merchant: 'Hotel Lisboa Plaza' });
  });

  it('copes with a card that has no approval id', () => {
    expect(toChargeAttempt(auth({ card: { metadata: {} } }))?.approvalId).toBeNull();
  });

  it('returns null for a currency we do not support', () => {
    expect(toChargeAttempt(auth({ pending_request: { amount: 100, currency: 'jpy' } }))).toBeNull();
  });
});

describe('stripeClient', () => {
  it('refuses anything but a sandbox key', () => {
    const before = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_live_nope';
    expect(() => stripeClient()).toThrow('sandbox');
    if (before === undefined) delete process.env.STRIPE_SECRET_KEY; // assigning undefined would store the string "undefined"
    else process.env.STRIPE_SECRET_KEY = before;
  });
});
