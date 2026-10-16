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
