import { parseArgs } from 'node:util';
import { getFuzzyChecker } from '@/checker/registry';
import { loadEvalSet } from '@/evals/load';
import { computeMetrics } from '@/evals/metrics';
import { formatReport, saveRun, type SavedRun } from '@/evals/results';
import { runCases } from '@/evals/runCases';

async function main() {
  const { values } = parseArgs({
    options: {
      checker: { type: 'string', default: process.env.CHECKER ?? 'keyword' },
      label: { type: 'string', default: '' },
      concurrency: { type: 'string', default: '4' },
    },
  });
  const { rules, cases } = loadEvalSet();
  const fuzzy = getFuzzyChecker(values.checker!);
  const results = await runCases(cases, rules, fuzzy, Number(values.concurrency));
  const run: SavedRun = {
    checker: fuzzy.name,
    label: values.label!,
    ranAt: new Date().toISOString(),
    metrics: {
      all: computeMetrics(results),
      dev: computeMetrics(results.filter((r) => r.split === 'dev')),
      test: computeMetrics(results.filter((r) => r.split === 'test')),
    },
    results,
  };
  console.log(formatReport(run));
  console.log(`\nSaved ${saveRun(run)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
