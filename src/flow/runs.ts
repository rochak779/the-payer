import type { Shopper, ShopperEvent, ShopperTools, WebSearch } from '@/agent/types';
import { recordDecision } from '@/approvals/approvals';
import { checkPurchase } from '@/checker/checkPurchase';
import type { FuzzyChecker } from '@/checker/fuzzy';
import { newId } from '@/domain/ids';
import { OUTCOME_LABEL } from '@/domain/labels';
import type { ApprovalStatus, Outcome, Run } from '@/domain/types';
import type { CardIssuer } from '@/payments/cardIssuer';
import { fulfil } from '@/payments/fulfil';
import type { Db, Store } from '@/store/store';

export const MAX_REQUESTS_PER_RUN = 2;

export type FlowDeps = { store: Store; fuzzy: FuzzyChecker; search: WebSearch; shopper: Shopper; issuer: CardIssuer; clock: () => Date };
export type RunView = Run & { approvals: { id: string; status: ApprovalStatus; outcome: Outcome }[] };

export function startRun(store: Store, task: string, now: Date): Run {
  const run: Run = { id: newId('run'), task, status: 'running', createdAt: now.toISOString(), events: [], approvalIds: [] };
  store.update((db) => { db.runs.push(run); });
  return run;
}

function findRun(db: Db, id: string): Run {
  const run = db.runs.find((r) => r.id === id);
  if (!run) throw new Error(`No run ${id}`);
  return run;
}

/** One task: agent searches → asks to buy → checker decides → (if approved) card + charge. Progress is stored as events. */
export async function executeRun(deps: FlowDeps, runId: string): Promise<void> {
  const task = findRun(deps.store.read(), runId).task;
  const emit = (e: ShopperEvent) =>
    deps.store.update((db) => { findRun(db, runId).events.push({ ...e, at: deps.clock().toISOString() }); });
  let requests = 0;

  const tools: ShopperTools = {
    searchWeb: (query) => deps.search.search(query),
    requestPurchase: async (req) => {
      requests += 1;
      if (requests > MAX_REQUESTS_PER_RUN) throw new Error(`Only ${MAX_REQUESTS_PER_RUN} purchase requests are allowed per task.`);
      const { rules, settings } = deps.store.read();
      const decision = await checkPurchase(req, { rules, agentEnabled: settings.agentEnabled, fuzzy: deps.fuzzy });
      const approval = recordDecision(deps.store, req, decision, deps.clock());
      deps.store.update((db) => { findRun(db, runId).approvalIds.push(approval.id); });
      emit({ kind: 'decision', text: `${OUTCOME_LABEL[decision.outcome]}: ${decision.summary}` });
      if (decision.outcome === 'approve') {
        const charge = await fulfil(deps, approval.id, deps.clock());
        emit({ kind: 'status', text: charge.approved ? 'Paid with a one-time card.' : `Payment declined: ${charge.reasons.join(' ')}` });
      }
      return decision;
    },
  };

  try {
    await deps.shopper.run(task, tools, emit);
    deps.store.update((db) => { findRun(db, runId).status = 'done'; });
  } catch (err) {
    emit({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
    deps.store.update((db) => { findRun(db, runId).status = 'failed'; });
  }
}

export function viewRun(db: Db, runId: string): RunView | null {
  const run = db.runs.find((r) => r.id === runId);
  if (!run) return null;
  const approvals = db.approvals
    .filter((a) => run.approvalIds.includes(a.id))
    .map((a) => ({ id: a.id, status: a.status, outcome: a.decision.outcome }));
  return { ...run, approvals };
}
