import type { Category, PurchaseRequest, Rule } from '@/domain/types';

export type Verdict = { ruleId: string; verdict: 'clear' | 'breached' | 'unsure'; explanation: string };
export type Flag = { flagged: boolean; explanation: string };

/** Facts only. What they mean (ask/block) is decided in code by checkPurchase. */
export type FuzzyResult = {
  verdicts: Verdict[];
  hiddenCosts: Flag;
  injection: Flag;
  /** The checker's own reading of what is being bought. The agent's label can be wrong or steered. */
  category?: Category;
};

export interface FuzzyChecker {
  readonly name: string;
  /** Receives every rule for context; must return one verdict per judgement rule. */
  check(req: PurchaseRequest, rules: Rule[]): Promise<FuzzyResult>;
}

/**
 * The model answered, but refused or gave something unusable. Unlike an outage (quota, server error, timeout),
 * this is how the model behaves, so a person would meet it too: evals score it as the "ask" it becomes.
 */
export class CheckerAnswerError extends Error {}
