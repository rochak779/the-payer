import { describe, expect, it } from 'vitest';
import { computeMetrics, type CaseResult } from './metrics';
import { formatReport, type SavedRun } from './results';

const result = (checkerError: boolean, unreadable = false): CaseResult => ({ id: 'within-01', category: 'within', split: 'dev', expected: 'ask', actual: 'ask', summary: '', ms: 1, checkerError, unreadable });
const run = (results: CaseResult[]): SavedRun => ({
  checker: 'gemini', label: '', ranAt: '2026-10-16T00:00:00Z', results,
  metrics: { all: computeMetrics(results), dev: computeMetrics(results), test: computeMetrics([]) },
});

describe('formatReport', () => {
  it('warns first when the checker failed on some cases', () => {
    const report = formatReport(run([result(true), result(false)]));
    expect(report.split('\n')[0]).toBe('WARNING: the checker failed on 1 of 2 cases (counted as asks). Do not quote these numbers.');
  });

  it('reports refusals and unreadable answers without blocking the run', () => {
    const report = formatReport(run([result(false, true), result(false)]));
    expect(report).not.toContain('WARNING');
    expect(report).toContain('The model refused or gave an unreadable answer on 1 of 2 cases (scored as asks).');
  });

  it('has no warning when every check ran', () => {
    expect(formatReport(run([result(false)]))).not.toContain('WARNING');
  });
});
