import { fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import type { Shopper, WebSearch } from '@/agent/types';
import { keywordChecker } from '@/checker/keywordChecker';
import { getFuzzyChecker } from '@/checker/registry';
import type { FlowDeps } from '@/flow/runs';
import { createChannel3Search } from '@/integrations/channel3/search';
import { createClaudeShopper } from '@/integrations/claude/shopper';
import { createFirecrawlSearch } from '@/integrations/firecrawl/search';
import { createGeminiShopper } from '@/integrations/gemini/shopper';
import { payPalClientFromEnv } from '@/integrations/paypal/client';
import { createPayPalRail } from '@/integrations/paypal/rail';
import { vaultIdFor } from '@/integrations/paypal/vault';
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
    search: getSearch(process.env.SEARCH),
    shopper: getShopper(process.env.SHOPPER, clock),
    rail,
  };
}

/** PAYMENTS picks the rail; the old name ISSUER is still read. */
export function paymentsName(): string {
  return process.env.PAYMENTS ?? process.env.ISSUER ?? 'fake';
}

function getRail(store: Store, clock: () => Date): PaymentRail {
  const name = paymentsName();
  if (name === 'stripe') return createStripeIssuer(store, clock);
  if (name === 'paypal') return createPayPalRail({ store, client: payPalClientFromEnv(), vaultId: () => vaultIdFor(store.read()), clock });
  return createFakeRail(store, clock);
}

function getSearch(name: string | undefined): WebSearch {
  if (name === 'channel3') return createChannel3Search();
  if (name === 'firecrawl') return createFirecrawlSearch();
  return fixtureSearch;
}

function getShopper(name: string | undefined, clock: () => Date): Shopper {
  if (name === 'claude') return createClaudeShopper({ clock });
  if (name === 'gemini') return createGeminiShopper({ clock });
  return createScriptedShopper(clock);
}
