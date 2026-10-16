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
    expect(results.map((x) => x.checkerError)).toEqual([false, false]);
  });

  it('marks a case whose checker call failed, so a quota error is not scored as a real "ask"', async () => {
    const cases: EvalCase[] = [{ id: 'within-01', category: 'within', split: 'dev', expected: 'ask', why: 'x', request: makeRequest() }];
    const rules = [{ id: 'refundable', kind: 'judgement' as const, source: 'Nothing non-refundable.', onBreach: 'block' as const, text: 'Nothing non-refundable.' }];
    const failing = { name: 'down', check: async () => { throw new Error('429 quota exceeded'); } };
    const [result] = await runCases(cases, rules, failing);
    expect(result).toMatchObject({ actual: 'ask', checkerError: true });
  });
});
