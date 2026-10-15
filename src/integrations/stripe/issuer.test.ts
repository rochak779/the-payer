import { describe, expect, it } from 'vitest';
import { describeStripeDecline } from './issuer';

describe('describeStripeDecline', () => {
  it('explains each decline source in plain English', () => {
    expect(describeStripeDecline('webhook_declined')).toBe('Declined by our payment check (see log).');
    expect(describeStripeDecline('spending_controls')).toBe("Declined by the card's own spending limit at Stripe.");
    expect(describeStripeDecline('webhook_timeout')).toContain("didn't answer in time");
    expect(describeStripeDecline(undefined)).toBe('Declined by Stripe (no reason given).');
  });
});
