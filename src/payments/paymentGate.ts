import { merchantMatches } from '@/checker/merchant';
import { formatMoney } from '@/domain/money';
import type { Money } from '@/domain/types';
import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';

export type ChargeAttempt = { approvalId: string | null; amount: Money; merchant: string };
export type GateResult = { approved: boolean; reasons: string[] };

/**
 * Payment-time check. Code only: no AI, no network, so it answers inside Stripe's real-time window.
 * Collects every failed check so the log explains the whole decline. Approving marks the purchase used (single use).
 */
export function checkCharge(store: Store, attempt: ChargeAttempt, now: Date): GateResult {
  return store.update((db) => {
    const reasons: string[] = [];
    const a = attempt.approvalId ? db.approvals.find((x) => x.id === attempt.approvalId) : undefined;
    if (!db.settings.agentEnabled) reasons.push('The agent is turned off.');
    if (!a) {
      reasons.push('No approved purchase matches this card.');
    } else {
      if (a.status === 'used') reasons.push('This one-time card has already been used.');
      else if (a.status !== 'approved') reasons.push(`This purchase is ${a.status}, not approved.`);
      if (a.expiresAt && now > new Date(a.expiresAt)) reasons.push('The approval has expired.');
      if (attempt.amount.currency !== a.request.total.currency) {
        reasons.push(`Charged in ${attempt.amount.currency} but approved in ${a.request.total.currency}.`);
      } else if (attempt.amount.minor > a.request.total.minor) {
        reasons.push(`${formatMoney(attempt.amount)} is more than the approved ${formatMoney(a.request.total)}.`);
      }
      if (!merchantMatches(attempt.merchant, a.request.merchant)) {
        reasons.push(`"${attempt.merchant}" isn't the approved merchant "${a.request.merchant}".`);
      }
    }
    const approved = reasons.length === 0;
    if (approved && a) a.status = 'used';
    const what = `Charge of ${formatMoney(attempt.amount)} at ${attempt.merchant}`;
    appendLog(db, now, approved ? 'charge_approved' : 'charge_declined', a?.id ?? null,
      approved ? `${what} approved.` : `${what} declined. ${reasons.join(' ')}`);
    return { approved, reasons };
  });
}
