import { z } from 'zod';
import { formatMoney } from '@/domain/money';
import { appendLog } from '@/log/log';
import { checkCharge } from '@/payments/paymentGate';
import type { PaymentRail } from '@/payments/rail';
import type { Store } from '@/store/store';
import { PayPalError, toPayPalAmount, type PayPalClient } from './client';

const Order = z.object({
  status: z.string(),
  purchase_units: z.array(z.object({
    payments: z.object({ authorizations: z.array(z.object({ id: z.string(), status: z.string() })).optional() }).optional(),
  })).default([]),
});
const Capture = z.object({ id: z.string(), status: z.string() });

const PENDING = 'PayPal is holding the payment for the shop to accept.';
const reason = (err: unknown) => (err instanceof PayPalError ? err.issue ?? err.message : err instanceof Error ? err.message : String(err));

/**
 * PayPal sandbox: each approved purchase becomes a hold for exactly its total on the buyer's saved PayPal.
 * Money moves only when the shop asks and the payment check agrees. The agent never sees any of it.
 */
export function createPayPalRail(deps: { store: Store; client: PayPalClient; vaultId: () => string | null; clock: () => Date }): PaymentRail {
  const { store, client, clock } = deps;
  const approvalFor = (holdId: string) => store.read().approvals.find((a) => a.payment?.id === holdId);
  const log = (type: 'paid' | 'error', approvalId: string | null, message: string) =>
    store.update((db) => { appendLog(db, clock(), type, approvalId, message); });

  return {
    name: 'paypal',

    async open(approval) {
      const vaultId = deps.vaultId();
      if (!vaultId) throw new Error('PayPal is not connected yet.');
      const { item, merchant, total } = approval.request;
      const order = Order.parse(await client.request('POST', '/v2/checkout/orders', {
        requestId: `${approval.id}-open`,
        body: {
          intent: 'AUTHORIZE',
          purchase_units: [{
            reference_id: approval.id,
            custom_id: approval.id,
            description: `${item} at ${merchant}`.slice(0, 127),
            amount: toPayPalAmount(total),
          }],
          payment_source: { paypal: { vault_id: vaultId } },
        },
      }));
      // Verified in the sandbox (BRIEF.md): the hold comes back in this response, so no /authorize call.
      const hold = order.purchase_units[0]?.payments?.authorizations?.[0];
      if (!hold || hold.status !== 'CREATED') throw new Error(`PayPal didn't hold the payment (order ${order.status}${hold ? `, hold ${hold.status}` : ''}).`);
      return { id: hold.id, label: `PayPal, held ${formatMoney(total)}` };
    },

    async charge({ handle, amount, merchant }) {
      const approvalId = approvalFor(handle.id)?.id ?? null;
      const check = checkCharge(store, { approvalId, amount, merchant }, clock());
      if (!check.approved) return check;
      // The check has marked the purchase used, so whatever happens below it can't be charged twice.
      try {
        const capture = Capture.parse(await client.request('POST', `/v2/payments/authorizations/${handle.id}/capture`, {
          requestId: `${approvalId}-capture`,
          body: { amount: toPayPalAmount(amount), final_capture: true, invoice_id: approvalId },
        }));
        if (capture.status !== 'COMPLETED') {
          log('error', approvalId, PENDING);
          return { approved: false, reasons: [PENDING] };
        }
        log('paid', approvalId, `PayPal took ${formatMoney(amount)} (capture ${capture.id}).`);
        return { approved: true, reasons: [], providerRef: capture.id };
      } catch (err) {
        // Only a 4xx is PayPal saying no. A timeout or 5xx may have gone through, so don't claim it didn't.
        const refused = err instanceof PayPalError && err.status >= 400 && err.status < 500;
        const message = refused
          ? `PayPal didn't take the payment: ${reason(err)}. Nothing was charged.`
          : `PayPal didn't confirm the payment: ${reason(err)}. Check your PayPal activity before buying it again.`;
        log('error', approvalId, message);
        return { approved: false, reasons: [message] };
      }
    },

    async cancel(holdId) {
      try {
        await client.request('POST', `/v2/payments/authorizations/${holdId}/void`, { requestId: `${holdId}-void` });
      } catch (err) {
        // The purchase is already revoked, so the payment check refuses any later charge even if this hold stays open.
        log('error', approvalFor(holdId)?.id ?? null, `Couldn't cancel the PayPal hold: ${reason(err)}.`);
      }
    },
  };
}
