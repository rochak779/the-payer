import { Channel3, Channel3Error, Channel3TimeoutError } from '@channel3/sdk';
import { z } from 'zod';
import type { Offer, SearchResult, WebSearch } from '@/agent/types';
import { formatMoney, money } from '@/domain/money';
import { Currency } from '@/domain/types';

const DESCRIPTION_CHARS = 1500;
const MAX_RESULTS = 8;

/** Only the fields we read. Everything here is shop-written text: untrusted data for the agent. */
const Product = z.object({
  title: z.string(),
  description: z.string().nullish(),
  offers: z.array(z.object({
    url: z.string(),
    domain: z.string(),
    price: z.object({ price: z.number(), currency: z.string() }),
    availability: z.string(),
    condition: z.string().nullish(),
  })).default([]),
});
export type Channel3Product = z.input<typeof Product>;

const IN_STOCK = new Set(['InStock', 'LimitedAvailability']);
const CONDITIONS = new Set<Offer['condition']>(['new', 'used', 'refurbished']);

/** One result per offer that's in stock and priced in a currency we support. Prices go through money(), the only decimal → minor-units path. */
export function toSearchResults(product: Channel3Product): SearchResult[] {
  const p = Product.parse(product);
  return p.offers.flatMap((o) => {
    const currency = Currency.safeParse(o.price.currency);
    if (!currency.success || !IN_STOCK.has(o.availability)) return [];
    const condition = CONDITIONS.has(o.condition as Offer['condition']) ? (o.condition as Offer['condition']) : 'unknown';
    const offer: Offer = { shop: o.domain, price: money(o.price.price, currency.data), condition, inStock: true };
    const snippet = [
      `Shop: ${o.domain}`,
      `Price: ${formatMoney(offer.price)}`,
      `Condition: ${condition}`,
      `Availability: ${o.availability}`,
      'Refund policy: not stated by the shop',
      (p.description ?? '').slice(0, DESCRIPTION_CHARS),
    ].join('\n').trimEnd();
    return [{ title: p.title, url: o.url, snippet, offer }];
  });
}

/** Channel3's errors carry `statusCode`; the app's serviceProblem() reads `status` and the name TimeoutError. */
function asServiceError(err: unknown): unknown {
  if (err instanceof Channel3TimeoutError) return Object.assign(new Error('Channel3 search timed out'), { name: 'TimeoutError' });
  if (err instanceof Channel3Error && err.statusCode) return Object.assign(new Error(`Channel3 search failed (HTTP ${err.statusCode})`), { status: err.statusCode });
  return err;
}

type SearchClient = { products: { search(req: object): Promise<{ data: unknown[] }> } };

/** Real products from US shops, in dollars, with each shop's price and condition. */
export function createChannel3Search(opts: { apiKey?: string; client?: SearchClient } = {}): WebSearch {
  const apiKey = opts.apiKey ?? process.env.CHANNEL3_API_KEY;
  if (!opts.client && !apiKey) throw new Error('CHANNEL3_API_KEY is not set');
  const client: SearchClient = opts.client ?? new Channel3({ apiKey });
  return {
    name: 'channel3',
    async search(query) {
      let products: unknown[];
      try {
        // The SDK returns a page; its `data` holds this page's products.
        ({ data: products } = await client.products.search({ query, limit: 5, config: { country: 'US', language: 'en', currency: 'USD' } }));
      } catch (err) {
        throw asServiceError(err);
      }
      const readable = products.flatMap((p) => {
        const parsed = Product.safeParse(p);
        return parsed.success ? [parsed.data] : [];
      });
      return readable.flatMap(toSearchResults).slice(0, MAX_RESULTS);
    },
  };
}
