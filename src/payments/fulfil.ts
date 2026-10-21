import { formatMoney } from '@/domain/money';
import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';
import type { ChargeResult, PaymentHandle, PaymentRail } from './rail';

/** Approved purchase → one-time payment for exactly that amount → the shop asks to be paid. */
export async function fulfil(deps: { store: Store; rail: PaymentRail }, approvalId: string, now: Date): Promise<ChargeResult> {
  const approval = deps.store.read().approvals.find((a) => a.id === approvalId);
  if (!approval) throw new Error(`No purchase with id ${approvalId}`);
  if (approval.status !== 'approved') throw new Error(`Purchase ${approvalId} is ${approval.status}, not approved`);

  let handle: PaymentHandle;
  try {
    handle = await deps.rail.open(approval);
  } catch (err) {
    const message = `Couldn't set up the payment: ${err instanceof Error ? err.message : String(err)}`;
    deps.store.update((db) => { appendLog(db, now, 'error', approvalId, message); });
    return { approved: false, reasons: [message] };
  }

  deps.store.update((db) => {
    const a = db.approvals.find((x) => x.id === approvalId)!;
    a.payment = { ...handle, provider: deps.rail.name };
    appendLog(db, now, 'payment_opened', approvalId,
      `${handle.label}: set up for exactly ${formatMoney(a.request.total)} at ${a.request.merchant}.`);
  });

  return deps.rail.charge({ handle, amount: approval.request.total, merchant: approval.request.merchant });
}
