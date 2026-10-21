import type { Store } from '@/store/store';
import { checkCharge } from './paymentGate';
import type { PaymentRail } from './rail';

/** Offline stand-in for a real payment provider: charges go straight to the payment check. */
export function createFakeRail(store: Store, clock: () => Date = () => new Date()): PaymentRail {
  return {
    name: 'fake',
    async open(approval) {
      return { id: `pay_fake_${approval.id}`, label: 'Offline test payment' };
    },
    async charge({ handle, amount, merchant }) {
      const approval = store.read().approvals.find((a) => a.payment?.id === handle.id);
      return checkCharge(store, { approvalId: approval?.id ?? null, amount, merchant }, clock());
    },
    async cancel() {
      // Nothing to cancel offline: the payment check already refuses revoked purchases.
    },
  };
}
