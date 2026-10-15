import { describe, expect, it } from 'vitest';
import { keywordChecker } from '@/checker/keywordChecker';
import { makeRequest } from '@/test/factories';
import type { EvalCase } from './schema';
import { runCases } from './runCases';

describe('runCases', () => {
  it('runs every case through the checker and keeps input order', async () => {
    const cases: EvalCase[] = [
      { id: 'within-01', category: 'within', split: 'dev', expected: 'approve', why: 'fine', request: makeRequest() },
      { id: 'refund-01', category: 'refund_wording', split: 'test', expected: 'block', why: 'nr', request: makeRequest({ refundPolicy: 'Non-refundable.' }) },
    ];
    const rules = [{ id: 'refundable', kind: 'judgement' as const, source: 'Nothing non-refundable.', onBreach: 'block' as const, text: 'Nothing non-refundable.' }];
    const results = await runCases(cases, rules, keywordChecker, 2);
    expect(results.map((x) => [x.id, x.actual, x.split])).toEqual([['within-01', 'approve', 'dev'], ['refund-01', 'block', 'test']]);
  });
});
