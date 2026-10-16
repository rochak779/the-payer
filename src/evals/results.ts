import fs from 'node:fs';
import path from 'node:path';
import { OUTCOMES, type CaseResult, type Metrics } from './metrics';

export type SavedRun = {
  checker: string;
  label: string;
  ranAt: string;
  metrics: { all: Metrics; dev: Metrics; test: Metrics };
  results: CaseResult[];
};

export const resultsDir = () => path.join(process.cwd(), 'evals', 'results');

export function saveRun(run: SavedRun, dir = resultsDir()): string {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = run.ranAt.replace(/[:.]/g, '-');
  const name = [stamp, run.checker.replace(/[^a-z0-9.-]+/gi, '_'), run.label].filter(Boolean).join('_');
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(run, null, 2));
  return file;
}

export function loadRuns(dir = resultsDir()): SavedRun[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as SavedRun);
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function formatReport(run: SavedRun): string {
  const lines = [`Checker: ${run.checker}${run.label ? ` (${run.label})` : ''}`];
  const errors = run.metrics.all.checkerErrors ?? 0; // older saved runs have no count
  if (errors) lines.unshift(`WARNING: the checker failed on ${errors} of ${run.metrics.all.total} cases (counted as asks). Do not quote these numbers.`);
  const unreadable = run.metrics.all.unreadableAnswers ?? 0;
  if (unreadable) lines.push(`The model refused or gave an unreadable answer on ${unreadable} of ${run.metrics.all.total} cases (scored as asks).`);
  for (const [name, m] of Object.entries(run.metrics)) {
    if (m.total === 0) continue;
    lines.push(`\n[${name}] ${m.correct}/${m.total} correct (${pct(m.accuracy)})`);
    lines.push(`  Wrong approvals: ${m.wrongApprovals}   Needless asks: ${m.needlessAsks}   Wrong blocks: ${m.wrongBlocks}   Missed blocks: ${m.missedBlocks}`);
  }
  const all = run.metrics.all;
  lines.push('\nConfusion, all cases (rows = expected, columns = actual)');
  lines.push(`  ${''.padEnd(8)} ${OUTCOMES.map((o) => o.padStart(7)).join(' ')}`);
  for (const e of OUTCOMES) lines.push(`  ${e.padEnd(8)} ${OUTCOMES.map((a) => String(all.confusion[e][a]).padStart(7)).join(' ')}`);
  lines.push('\nBy category');
  for (const [cat, c] of Object.entries(all.byCategory)) lines.push(`  ${cat.padEnd(15)} ${c.correct}/${c.total}`);
  const failures = run.results.filter((r) => r.expected !== r.actual);
  if (failures.length) {
    lines.push('\nFailures');
    for (const f of failures) lines.push(`  ${f.id.padEnd(14)} expected ${f.expected.padEnd(7)} got ${f.actual.padEnd(7)} ${f.summary}`);
  }
  return lines.join('\n');
}
