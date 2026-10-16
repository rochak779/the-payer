import { checkPurchase } from '@/checker/checkPurchase';
import { loadEvalSet } from '@/evals/load';
import { createGeminiFuzzyChecker } from '@/integrations/gemini/fuzzyChecker';

/** One real checker call on the first eval case: proves the key works and Google accepts our answer format. */
async function main() {
  const { rules, cases } = loadEvalSet();
  const c = cases[0];
  const fuzzy = createGeminiFuzzyChecker();
  const started = Date.now();
  const result = await fuzzy.check(c.request, rules);
  const decision = await checkPurchase(c.request, { rules, agentEnabled: true, fuzzy: { name: fuzzy.name, check: async () => result } });
  console.log(`${fuzzy.name} on ${c.id} (${Date.now() - started}ms): expected ${c.expected}, got ${decision.outcome}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
