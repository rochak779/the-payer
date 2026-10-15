import { formatMoney } from '@/domain/money';
import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';
import type { CardIssuer, ChargeResult, IssuedCard } from './cardIssuer';

/** Approved purchase → one-time card → the merchant charges it. */
export async function fulfil(deps: { store: Store; issuer: CardIssuer }, approvalId: string, now: Date): Promise<ChargeResult> {
  const approval = deps.store.read().approvals.find((a) => a.id === approvalId);
  if (!approval) throw new Error(`No purchase with id ${approvalId}`);
  if (approval.status !== 'approved') throw new Error(`Purchase ${approvalId} is ${approval.status}, not approved`);

  let card: IssuedCard;
  try {
    card = await deps.issuer.issueCard(approval);
  } catch (err) {
    const message = `Couldn't create a card: ${err instanceof Error ? err.message : String(err)}`;
    deps.store.update((db) => { appendLog(db, now, 'error', approvalId, message); });
    return { approved: false, reasons: [message] };
  }

  deps.store.update((db) => {
    const a = db.approvals.find((x) => x.id === approvalId)!;
    a.card = { ...card, provider: deps.issuer.name };
    appendLog(db, now, 'card_issued', approvalId,
      `One-time card •••• ${card.last4} created for up to ${formatMoney(a.request.total)} at ${a.request.merchant}.`);
  });

  return deps.issuer.simulateCharge({ card, amount: approval.request.total, merchant: approval.request.merchant });
}
