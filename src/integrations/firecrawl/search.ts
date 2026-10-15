import Firecrawl from '@mendable/firecrawl-js';
import type { SearchResult, WebSearch } from '@/agent/types';

const SNIPPET_CHARS = 3000;

export type FirecrawlHit = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
  metadata?: { url?: string; sourceURL?: string; title?: string };
};

export function toSearchResult(hit: FirecrawlHit): SearchResult | null {
  const url = hit.url ?? hit.metadata?.url ?? hit.metadata?.sourceURL;
  if (!url) return null;
  return { title: hit.title ?? hit.metadata?.title ?? url, url, snippet: (hit.markdown ?? hit.description ?? '').slice(0, SNIPPET_CHARS) };
}

/** Real listings: top results with page text, so the agent can read prices, fees and refund policies. */
export function createFirecrawlSearch(apiKey = process.env.FIRECRAWL_API_KEY): WebSearch {
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not set');
  const firecrawl = new Firecrawl({ apiKey });
  return {
    name: 'firecrawl',
    async search(query) {
      const res = await firecrawl.search(query, { limit: 5, scrapeOptions: { formats: ['markdown'], onlyMainContent: true } });
      const hits = ((res as { web?: FirecrawlHit[] }).web ?? []);
      return hits.map(toSearchResult).filter((r): r is SearchResult => r !== null);
    },
  };
}
