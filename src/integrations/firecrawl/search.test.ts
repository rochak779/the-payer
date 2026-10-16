import { describe, expect, it } from 'vitest';
import { toSearchResult } from './search';

describe('toSearchResult', () => {
  it('maps a plain search hit', () => {
    expect(toSearchResult({ url: 'https://a.com', title: 'A', description: 'about A' })).toEqual({ title: 'A', url: 'https://a.com', snippet: 'about A' });
  });

  it('maps a scraped hit, preferring page text and capping its length', () => {
    const r = toSearchResult({ markdown: 'x'.repeat(5000), metadata: { sourceURL: 'https://b.com', title: 'B' } });
    expect(r).toMatchObject({ title: 'B', url: 'https://b.com' });
    expect(r!.snippet).toHaveLength(3000);
  });

  it('drops hits without a URL', () => {
    expect(toSearchResult({ title: 'no link' })).toBeNull();
  });
});
