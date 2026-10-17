import type { Shopper, ShopperEvent, ShopperTools, WebSearch } from '@/agent/types';
import { recordDecision } from '@/approvals/approvals';
import { checkPurchase } from '@/checker/checkPurchase';
import type { FuzzyChecker } from '@/checker/fuzzy';
import { merchantMatches } from '@/checker/merchant';
import { newId } from '@/domain/ids';
import { OUTCOME_LABEL, STATUS_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import { serviceProblem } from '@/domain/serviceError';
import type { Approval, ApprovalStatus, Decision, Outcome, PurchaseRequest, Run } from '@/domain/types';
import type { CardIssuer } from '@/payments/cardIssuer';
import { fulfil } from '@/payments/fulfil';
import type { Db, Store } from '@/store/store';

export const MAX_REQUESTS_PER_RUN = 2;

/** Requests in these states still stand: a repeat of one would be a double booking. */
const STANDING: ApprovalStatus[] = ['pending', 'approved', 'used'];

/**
 * An earlier request in this run at the same shop for the same price that is waiting, approved or paid.
 * Matching on shop and price, not item wording, catches an agent that retries with different words,
 * e.g. after a charge failed part-way. Two different purchases in one task are still fine.
 */
function earlierSame(db: Db, run: Run, req: PurchaseRequest): Approval | undefined {
  const sameShop = (a: string, b: string) => merchantMatches(a, b) || merchantMatches(b, a);
  return db.approvals.find(
    (a) =>
      run.approvalIds.includes(a.id) &&
      STANDING.includes(a.status) &&
      a.request.total.minor === req.total.minor &&
      a.request.total.currency === req.total.currency &&
      sameShop(a.request.merchant, req.merchant),
  );
}

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
      const db = deps.store.read();
      const earlier = earlierSame(db, findRun(db, runId), req);
      if (earlier) {
        const message = `Already requested in this task: ${earlier.request.item} at ${earlier.request.merchant} for ${formatMoney(earlier.request.total)} (${STATUS_LABEL[earlier.status]}). Not buying it twice.`;
        emit({ kind: 'decision', text: `${OUTCOME_LABEL.block}: ${message}` });
        const duplicate: Decision = { outcome: 'block', reasons: [{ ruleId: null, by: 'system', outcome: 'block', message }], summary: message, checker: 'duplicate-check' };
        return duplicate;
      }
      const { rules, settings } = db;
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
    // A shopper with live search can fail on either service, so the message doesn't say which.
    const problem = serviceProblem(err);
    const text = problem ? `The agent stopped: a service it uses ${problem}. Try again later.` : err instanceof Error ? err.message : String(err);
    emit({ kind: 'error', text });
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
