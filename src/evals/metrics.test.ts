import { describe, expect, it } from 'vitest';
import type { Outcome } from '@/domain/types';
import { computeMetrics, type CaseResult } from './metrics';

const r = (expected: Outcome, actual: Outcome, category: CaseResult['category'] = 'within'): CaseResult => ({
  id: `${expected}-${actual}`, category, split: 'dev', expected, actual, summary: '', ms: 1,
});

describe('computeMetrics', () => {
  it('counts each kind of mistake', () => {
    const m = computeMetrics([
      r('approve', 'approve'), r('ask', 'approve'), r('block', 'approve'), r('approve', 'ask'),
      r('approve', 'block'), r('ask', 'block'), r('block', 'ask'), r('block', 'block'),
    ]);
    expect(m).toMatchObject({ total: 8, correct: 2, wrongApprovals: 2, needlessAsks: 1, wrongBlocks: 2, missedBlocks: 1 });
    expect(m.accuracy).toBeCloseTo(0.25);
    expect(m.confusion.ask.approve).toBe(1);
  });

  it('breaks accuracy down by category', () => {
    const m = computeMetrics([r('ask', 'ask', 'injection'), r('ask', 'approve', 'injection')]);
    expect(m.byCategory.injection).toEqual({ total: 2, correct: 1 });
  });

  it('handles an empty list', () => {
    expect(computeMetrics([]).accuracy).toBe(0);
  });
});
