import { newId } from '@/domain/ids';
import { OUTCOME_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import type { Approval, Decision, PurchaseRequest } from '@/domain/types';
import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';

/** How long an approved purchase can be charged. */
export const APPROVAL_TTL_MINUTES = 30;

const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

export function recordDecision(store: Store, req: PurchaseRequest, decision: Decision, now: Date): Approval {
  const approved = decision.outcome === 'approve';
  const approval: Approval = {
    id: newId('apv'),
    request: req,
    decision,
    status: approved ? 'approved' : decision.outcome === 'ask' ? 'pending' : 'blocked',
    approvedBy: approved ? 'rules' : null,
    createdAt: now.toISOString(),
    decidedAt: decision.outcome === 'ask' ? null : now.toISOString(),
    expiresAt: approved ? addMinutes(now, APPROVAL_TTL_MINUTES).toISOString() : null,
    card: null,
  };
  store.update((db) => {
    db.approvals.push(approval);
    appendLog(db, now, 'decision', approval.id,
      `${OUTCOME_LABEL[decision.outcome]}: ${req.item} at ${req.merchant} for ${formatMoney(req.total)}. ${decision.summary}`);
  });
  return approval;
}

export function userDecides(store: Store, approvalId: string, choice: 'approve' | 'decline', now: Date): Approval {
  return store.update((db) => {
    const a = db.approvals.find((x) => x.id === approvalId);
    if (!a) throw new Error(`No purchase with id ${approvalId}`);
    if (a.status !== 'pending') throw new Error(`This purchase is already ${a.status}`);
    a.decidedAt = now.toISOString();
    if (choice === 'approve') {
      a.status = 'approved';
      a.approvedBy = 'user';
      a.expiresAt = addMinutes(now, APPROVAL_TTL_MINUTES).toISOString();
      appendLog(db, now, 'user_approved', a.id, `You approved ${formatMoney(a.request.total)} at ${a.request.merchant}.`);
    } else {
      a.status = 'declined';
      appendLog(db, now, 'user_declined', a.id, `You declined ${formatMoney(a.request.total)} at ${a.request.merchant}.`);
    }
    return a;
  });
}
