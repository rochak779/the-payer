import { randomInt } from 'node:crypto';
import type { Store } from '@/store/store';
import type { CardIssuer } from './cardIssuer';
import { checkCharge } from './paymentGate';

/** Offline stand-in for Stripe Issuing: charges go straight to the payment check. */
export function createFakeIssuer(store: Store, clock: () => Date = () => new Date()): CardIssuer {
  return {
    name: 'fake',
    async issueCard(approval) {
      return { id: `card_fake_${approval.id}`, last4: String(randomInt(1000, 10000)) };
    },
    async simulateCharge({ card, amount, merchant }) {
      const approval = store.read().approvals.find((a) => a.card?.id === card.id);
      return checkCharge(store, { approvalId: approval?.id ?? null, amount, merchant }, clock());
    },
    async cancelCard() {
      // Nothing to cancel offline: the payment check already refuses revoked purchases.
    },
  };
}
