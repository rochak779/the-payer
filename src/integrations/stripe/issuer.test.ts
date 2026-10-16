import { describe, expect, it } from 'vitest';
import { describeStripeDecline } from './issuer';

describe('describeStripeDecline', () => {
  it('explains each decline source in plain English', () => {
    expect(describeStripeDecline('webhook_declined')).toBe('Declined by our payment check (see log).');
    expect(describeStripeDecline('spending_controls')).toBe("Declined by the card's own spending limit at Stripe.");
    expect(describeStripeDecline('webhook_timeout')).toContain("didn't answer in time");
    expect(describeStripeDecline(undefined)).toBe('Declined by Stripe (no reason given).');
  });

  it('says the balance is too low, not empty, on insufficient funds', () => {
    // Seen live on 16 Oct 2026: £115 left, a £260 charge was declined as insufficient_funds.
    expect(describeStripeDecline('insufficient_funds')).toBe('The sandbox Issuing balance is too low for this charge. Top it up in the Stripe dashboard.');
  });

  it('recognises the reason the real sandbox gives for a card-limit decline', () => {
    // Seen live on 16 Oct 2026: a charge over the card's spending limit comes back as authorization_controls.
    expect(describeStripeDecline('authorization_controls')).toBe("Declined by the card's own spending limit at Stripe.");
  });
});
