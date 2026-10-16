import { formatMoney } from '@/domain/money';
import { appendLog } from '@/log/log';
import type { CardIssuer } from '@/payments/cardIssuer';
import type { Store } from '@/store/store';
import { requireEnv, stripeClient } from './client';

export function describeStripeDecline(reason: string | undefined): string {
  switch (reason) {
    case 'webhook_declined':
      return 'Declined by our payment check (see log).';
    case 'spending_controls':
    case 'authorization_controls': // what the sandbox actually returns for a card-limit decline
      return "Declined by the card's own spending limit at Stripe.";
    case 'card_canceled':
    case 'card_inactive':
      return 'The card is cancelled.';
    case 'webhook_timeout':
    case 'webhook_error':
      return "Our payment check didn't answer in time, so Stripe's fallback setting decided.";
    case 'insufficient_funds':
      return 'The sandbox Issuing balance is empty. Top it up in the Stripe dashboard.';
    default:
      return `Declined by Stripe (${reason ?? 'no reason given'}).`;
  }
}

/** Real sandbox virtual cards: one per approved purchase, capped at its amount, tagged with the approval id. */
export function createStripeIssuer(store: Store, clock: () => Date = () => new Date()): CardIssuer {
  return {
    name: 'stripe',
    async issueCard(approval) {
      const card = await stripeClient().issuing.cards.create({
        cardholder: requireEnv('STRIPE_CARDHOLDER_ID'),
        type: 'virtual',
        status: 'active',
        currency: approval.request.total.currency.toLowerCase(),
        spending_controls: { spending_limits: [{ amount: approval.request.total.minor, interval: 'all_time' }] },
        metadata: { approval_id: approval.id },
      });
      return { id: card.id, last4: card.last4 };
    },
    async simulateCharge({ card, amount, merchant }) {
      const auth = await stripeClient().testHelpers.issuing.authorizations.create({
        card: card.id,
        amount: amount.minor,
        currency: amount.currency.toLowerCase(),
        merchant_data: { name: merchant },
      });
      if (auth.approved) return { approved: true, reasons: [] };
      const reason = auth.request_history.at(-1)?.reason;
      const message = describeStripeDecline(reason);
      // Our webhook logs its own declines; log the ones Stripe made before asking us.
      if (reason !== 'webhook_declined') {
        const approvalId = store.read().approvals.find((a) => a.card?.id === card.id)?.id ?? null;
        store.update((db) => { appendLog(db, clock(), 'charge_declined', approvalId, `Charge of ${formatMoney(amount)} at ${merchant} declined. ${message}`); });
      }
      return { approved: false, reasons: [message] };
    },
    async cancelCard(cardId) {
      await stripeClient().issuing.cards.update(cardId, { status: 'canceled' });
    },
  };
}
