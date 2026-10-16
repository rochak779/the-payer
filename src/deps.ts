import { fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import type { Shopper } from '@/agent/types';
import { getFuzzyChecker } from '@/checker/registry';
import type { FlowDeps } from '@/flow/runs';
import { createClaudeShopper } from '@/integrations/claude/shopper';
import { createFirecrawlSearch } from '@/integrations/firecrawl/search';
import { createGeminiShopper } from '@/integrations/gemini/shopper';
import { createStripeIssuer } from '@/integrations/stripe/issuer';
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
    search: process.env.SEARCH === 'firecrawl' ? createFirecrawlSearch() : fixtureSearch,
    shopper: getShopper(process.env.SHOPPER, clock),
    issuer: process.env.ISSUER === 'stripe' ? createStripeIssuer(store, clock) : createFakeIssuer(store, clock),
  };
}

function getShopper(name: string | undefined, clock: () => Date): Shopper {
  if (name === 'claude') return createClaudeShopper({ clock });
  if (name === 'gemini') return createGeminiShopper({ clock });
  return createScriptedShopper(clock);
}
