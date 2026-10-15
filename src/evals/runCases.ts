import { checkPurchase } from '@/checker/checkPurchase';
import type { FuzzyChecker } from '@/checker/fuzzy';
import type { Rule } from '@/domain/types';
import type { CaseResult } from './metrics';
import type { EvalCase } from './schema';

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

export function runCases(cases: EvalCase[], rules: Rule[], fuzzy: FuzzyChecker, concurrency = 4): Promise<CaseResult[]> {
  return mapPool(cases, concurrency, async (c) => {
    const started = Date.now();
    const decision = await checkPurchase(c.request, { rules, agentEnabled: true, fuzzy });
    return {
      id: c.id, category: c.category, split: c.split, expected: c.expected,
      actual: decision.outcome, summary: decision.summary, ms: Date.now() - started,
    };
  });
}
