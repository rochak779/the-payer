import { formatMoney } from '@/domain/money';
import { scenarioFor } from './fixtures';
import type { Shopper } from './types';

/** Offline agent: picks a canned scenario from the task's words and follows the same steps as the real agent. */
export function createScriptedShopper(clock: () => Date = () => new Date()): Shopper {
  return {
    name: 'scripted',
    async run(task, tools, emit) {
      const scenario = scenarioFor(task);
      emit({ kind: 'status', text: 'Looking for options…' });
      emit({ kind: 'search', text: scenario.query });
      const results = await tools.searchWeb(scenario.query);
      for (const r of results) emit({ kind: 'found', text: `${r.title} (${r.url})` });
      const req = { ...scenario.pick, purchaseDate: clock().toISOString().slice(0, 10) };
      emit({ kind: 'request', text: `Asking to buy ${req.item} at ${req.merchant} for ${formatMoney(req.total)}` });
      const decision = await tools.requestPurchase(req);
      emit({
        kind: 'status',
        text: decision.outcome === 'approve' ? 'Done.' : decision.outcome === 'ask' ? 'Waiting for you to decide.' : 'Stopped: that purchase is not allowed.',
      });
    },
  };
}
