import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';
import type { PaymentRail } from './rail';

/** The user's off switch: revokes every open purchase and cancels its payment. */
export async function setAgentEnabled(deps: { store: Store; rail: PaymentRail }, enabled: boolean, now: Date): Promise<void> {
  const toCancel: string[] = [];
  deps.store.update((db) => {
    db.settings.agentEnabled = enabled;
    let revoked = 0;
    if (!enabled) {
      for (const a of db.approvals) {
        if (a.status === 'pending' || a.status === 'approved') {
          a.status = 'revoked';
          revoked += 1;
          if (a.payment) toCancel.push(a.payment.id);
        }
      }
    }
    appendLog(db, now, enabled ? 'agent_on' : 'agent_off', null,
      enabled ? 'Agent turned on.' : `Agent turned off. ${revoked} open purchase(s) cancelled.`);
  });
  for (const id of toCancel) await deps.rail.cancel(id);
}
