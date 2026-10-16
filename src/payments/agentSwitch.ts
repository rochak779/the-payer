import { appendLog } from '@/log/log';
import type { Store } from '@/store/store';
import type { CardIssuer } from './cardIssuer';

/** The user's off switch: revokes every open purchase and cancels its card. */
export async function setAgentEnabled(deps: { store: Store; issuer: CardIssuer }, enabled: boolean, now: Date): Promise<void> {
  const toCancel: string[] = [];
  deps.store.update((db) => {
    db.settings.agentEnabled = enabled;
    let revoked = 0;
    if (!enabled) {
      for (const a of db.approvals) {
        if (a.status === 'pending' || a.status === 'approved') {
          a.status = 'revoked';
          revoked += 1;
          if (a.card) toCancel.push(a.card.id);
        }
      }
    }
    appendLog(db, now, enabled ? 'agent_on' : 'agent_off', null,
      enabled ? 'Agent turned on.' : `Agent turned off. ${revoked} open purchase(s) cancelled.`);
  });
  for (const id of toCancel) await deps.issuer.cancelCard(id);
}
