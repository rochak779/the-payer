import type { Outcome } from '@/domain/types';
import type { EvalCategory } from './schema';

export type CaseResult = {
  id: string;
  category: EvalCategory;
  split: 'dev' | 'test';
  expected: Outcome;
  actual: Outcome;
  summary: string;
  ms: number;
  /** The checker call failed (quota, outage, timeout), so "ask" here says nothing about the model. Missing in older runs. */
  checkerError?: boolean;
};

export type Metrics = {
  total: number;
  correct: number;
  accuracy: number;
  wrongApprovals: number; // expected ask/block, got approve: money at risk
  needlessAsks: number; // expected approve, got ask: annoyance
  wrongBlocks: number; // expected approve/ask, got block: task fails
  missedBlocks: number; // expected block, got ask: person still asked
  checkerErrors: number; // checker call failed; the run needs repeating before anyone quotes it
  confusion: Record<Outcome, Record<Outcome, number>>; // confusion[expected][actual]
  byCategory: Record<string, { total: number; correct: number }>;
};

export const OUTCOMES: Outcome[] = ['approve', 'ask', 'block'];

export function computeMetrics(results: CaseResult[]): Metrics {
  const row = () => ({ approve: 0, ask: 0, block: 0 });
  const confusion = { approve: row(), ask: row(), block: row() };
  const byCategory: Metrics['byCategory'] = {};
  for (const r of results) {
    confusion[r.expected][r.actual] += 1;
    const c = (byCategory[r.category] ??= { total: 0, correct: 0 });
    c.total += 1;
    if (r.expected === r.actual) c.correct += 1;
  }
  const correct = results.filter((r) => r.expected === r.actual).length;
  return {
    total: results.length,
    correct,
    accuracy: results.length ? correct / results.length : 0,
    wrongApprovals: confusion.ask.approve + confusion.block.approve,
    needlessAsks: confusion.approve.ask,
    wrongBlocks: confusion.approve.block + confusion.ask.block,
    missedBlocks: confusion.block.ask,
    checkerErrors: results.filter((r) => r.checkerError).length,
    confusion,
    byCategory,
  };
}
