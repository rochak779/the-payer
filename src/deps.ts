import { fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import type { Shopper } from '@/agent/types';
import { keywordChecker } from '@/checker/keywordChecker';
import { getFuzzyChecker } from '@/checker/registry';
import type { FlowDeps } from '@/flow/runs';
import { createClaudeShopper } from '@/integrations/claude/shopper';
import { createFirecrawlSearch } from '@/integrations/firecrawl/search';
import { createGeminiShopper } from '@/integrations/gemini/shopper';
import { payPalClientFromEnv } from '@/integrations/paypal/client';
import { createPayPalRail } from '@/integrations/paypal/rail';
import { createStripeIssuer } from '@/integrations/stripe/issuer';
import { createFakeRail } from '@/payments/fakeRail';
import type { PaymentRail } from '@/payments/rail';
import type { RuleParser } from '@/rules/parser';
import { patternParser } from '@/rules/patternParser';
import { getRuleParser } from '@/rules/registry';
import type { Store } from '@/store/store';
import { currentStore } from '@/store/visitor';

export type Deps = FlowDeps & { parser: RuleParser };

/** Picks fake or real for each outside service from env vars. Defaults are all offline fakes. Hosted: this visitor's data. */
export async function getDeps(opts: { live?: boolean } = {}): Promise<Deps> {
  const store = await currentStore();
  const clock = () => new Date();
  const rail = getRail(store, clock);
  if (opts.live === false) {
    // Past today's limit: every AI and search piece goes offline; payments stay as configured.
    return { store, clock, fuzzy: keywordChecker, parser: patternParser, search: fixtureSearch, shopper: createScriptedShopper(clock), rail };
  }
  return {
    store,
    clock,
    fuzzy: getFuzzyChecker(process.env.CHECKER ?? 'keyword'),
    parser: getRuleParser(process.env.PARSER ?? 'pattern'),
    search: process.env.SEARCH === 'firecrawl' ? createFirecrawlSearch() : fixtureSearch,
    shopper: getShopper(process.env.SHOPPER, clock),
    rail,
  };
}

/** PAYMENTS picks the rail; the old name ISSUER is still read. */
function getRail(store: Store, clock: () => Date): PaymentRail {
  const name = process.env.PAYMENTS ?? process.env.ISSUER;
  if (name === 'stripe') return createStripeIssuer(store, clock);
  if (name === 'paypal') return createPayPalRail({ store, client: payPalClientFromEnv(), vaultId: () => process.env.PAYPAL_VAULT_ID ?? null, clock });
  return createFakeRail(store, clock);
}

function getShopper(name: string | undefined, clock: () => Date): Shopper {
  if (name === 'claude') return createClaudeShopper({ clock });
  if (name === 'gemini') return createGeminiShopper({ clock });
  return createScriptedShopper(clock);
}
