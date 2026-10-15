import type { Decision, JudgementRule, Outcome, PurchaseRequest, Reason, Rule } from '@/domain/types';
import type { FuzzyChecker, FuzzyResult } from './fuzzy';
import { checkHardLimits } from './hardLimits';

const RANK: Record<Outcome, number> = { approve: 0, ask: 1, block: 2 };

export function strictest(outcomes: Outcome[]): Outcome {
  return outcomes.reduce<Outcome>((a, b) => (RANK[b] > RANK[a] ? b : a), 'approve');
}

export type CheckContext = { rules: Rule[]; agentEnabled: boolean; fuzzy: FuzzyChecker; timeoutMs?: number };

export async function checkPurchase(req: PurchaseRequest, ctx: CheckContext): Promise<Decision> {
  if (!ctx.agentEnabled) {
    return decide([{ ruleId: null, by: 'system', outcome: 'block', message: 'The agent is turned off.' }], ctx.fuzzy.name);
  }
  const hard = checkHardLimits(req, ctx.rules);
  if (hard.some((r) => r.outcome === 'block')) return decide(hard, ctx.fuzzy.name); // code already said no

  const judgement = ctx.rules.filter((r): r is JudgementRule => r.kind === 'judgement');
  let soft: Reason[];
  try {
    const result = await withTimeout(ctx.fuzzy.check(req, ctx.rules), ctx.timeoutMs ?? 60_000);
    soft = toReasons(result, judgement);
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    soft = [{ ruleId: null, by: 'system', outcome: 'ask', message: `I couldn't run the judgement checks (${why}), so I'm asking you to be safe.` }];
  }
  return decide([...hard, ...soft], ctx.fuzzy.name);
}

/** The only place AI output becomes an outcome. It can add ask/block, never approve. */
function toReasons(result: FuzzyResult, rules: JudgementRule[]): Reason[] {
  const reasons: Reason[] = [];
  for (const rule of rules) {
    const v = result.verdicts.find((x) => x.ruleId === rule.id);
    if (!v) {
      reasons.push({ ruleId: rule.id, by: 'system', outcome: 'ask', message: `I couldn't get a clear answer on "${rule.text}", so I'm asking you.` });
    } else if (v.verdict === 'breached') {
      reasons.push({ ruleId: rule.id, by: 'ai', outcome: rule.onBreach, message: v.explanation });
    } else if (v.verdict === 'unsure') {
      reasons.push({ ruleId: rule.id, by: 'ai', outcome: 'ask', message: `Not sure about "${rule.text}": ${v.explanation}` });
    }
  }
  if (result.hiddenCosts.flagged) {
    reasons.push({ ruleId: null, by: 'ai', outcome: 'ask', message: `Possible extra costs: ${result.hiddenCosts.explanation}` });
  }
  if (result.injection.flagged) {
    reasons.push({ ruleId: null, by: 'ai', outcome: 'ask', message: `The listing tries to instruct the agent: ${result.injection.explanation}` });
  }
  return reasons;
}

function decide(reasons: Reason[], checker: string): Decision {
  const outcome = strictest(reasons.map((r) => r.outcome));
  const summary =
    outcome === 'approve'
      ? 'Within all your rules.'
      : reasons.filter((r) => r.outcome === outcome).map((r) => r.message).join(' ');
  return { outcome, reasons, summary, checker };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}
