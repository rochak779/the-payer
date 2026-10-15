import { fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import { getFuzzyChecker } from '@/checker/registry';
import type { FlowDeps } from '@/flow/runs';
import { createFakeIssuer } from '@/payments/fakeIssuer';
import type { RuleParser } from '@/rules/parser';
import { getRuleParser } from '@/rules/registry';
import { defaultStore } from '@/store/store';

export type Deps = FlowDeps & { parser: RuleParser };

/** Picks fake or real for each outside service from env vars. Defaults are all offline fakes. */
export function getDeps(): Deps {
  const store = defaultStore();
  const clock = () => new Date();
  return {
    store,
    clock,
    fuzzy: getFuzzyChecker(process.env.CHECKER ?? 'keyword'),
    parser: getRuleParser(process.env.PARSER ?? 'pattern'),
    search: fixtureSearch,
    shopper: createScriptedShopper(clock),
    issuer: createFakeIssuer(store, clock),
  };
}
