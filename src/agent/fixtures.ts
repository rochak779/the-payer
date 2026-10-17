import type { PurchaseRequest } from '@/domain/types';
import type { SearchResult, WebSearch } from './types';

export type Scenario = {
  match: RegExp;
  query: string;
  results: SearchResult[];
  pick: Omit<PurchaseRequest, 'purchaseDate'>;
};

export const SCENARIOS: Scenario[] = [
  {
    match: /\b(lisbon|hotel)\b/i,
    query: 'refundable hotels in Lisbon 7-9 November',
    results: [
      { title: 'Hotel Lisboa Plaza – from £120/night', url: 'https://example.com/hotel-lisboa-plaza', snippet: '£120 per night. Free cancellation until 48 hours before check-in. Guest rating 8.7/10.' },
      { title: 'Hotel Chiado – from £190/night', url: 'https://example.com/hotel-chiado', snippet: '£190 per night. Guest rating 9.1/10.' },
    ],
    pick: {
      item: 'Hotel Lisboa Plaza, 2 nights (7–9 Nov)', merchant: 'Hotel Lisboa Plaza', category: 'hotel',
      total: { minor: 24000, currency: 'GBP' }, units: 2, unitLabel: 'night',
      refundPolicy: 'Free cancellation until 48 hours before check-in.', url: 'https://example.com/hotel-lisboa-plaza',
      agentNote: 'Cheapest refundable option with a good rating.',
      listingText: '£120 per night. Free cancellation until 48 hours before check-in. Guest rating 8.7/10.',
    },
  },
  {
    match: /\b(gift|present|birthday|nephew|lego|toys?)\b/i,
    query: 'LEGO Technic gift for 10 year old',
    results: [{ title: 'LEGO Technic race car – £60', url: 'https://example.com/lego-technic', snippet: 'Ages 9+. Free returns within 90 days.' }],
    pick: {
      item: 'LEGO Technic race car', merchant: 'LEGO', category: 'other', total: { minor: 6000, currency: 'GBP' },
      refundPolicy: 'Free returns within 90 days.', url: 'https://example.com/lego-technic',
      agentNote: "Birthday gift for the user's nephew.", listingText: 'Ages 9+. Free returns within 90 days.',
    },
  },
  {
    match: /\b(headphones|earbuds)\b/i,
    query: 'noise cancelling headphones deal UK',
    results: [{ title: 'Bose QuietComfort (open box) – £179', url: 'https://example.com/bose-open-box', snippet: 'Open box. All sales final.' }],
    pick: {
      item: 'Bose QuietComfort headphones (open box)', merchant: 'AudioDeals UK', category: 'electronics',
      total: { minor: 17900, currency: 'GBP' }, refundPolicy: 'All sales final.', url: 'https://example.com/bose-open-box',
      agentNote: 'Cheapest well-reviewed option.', listingText: 'Open box. All sales final.',
    },
  },
];

export const FALLBACK: Scenario = {
  match: /.*/,
  query: 'The Pragmatic Programmer paperback',
  results: [{ title: 'The Pragmatic Programmer – £35', url: 'https://example.com/pragmatic-programmer', snippet: 'Paperback. Returns within 30 days.' }],
  pick: {
    item: 'The Pragmatic Programmer (paperback)', merchant: 'Waterstones', category: 'other',
    total: { minor: 3500, currency: 'GBP' }, refundPolicy: 'Returns within 30 days.', url: 'https://example.com/pragmatic-programmer',
    agentNote: 'Matches the request.', listingText: 'Paperback. Returns within 30 days.',
  },
};

export function scenarioFor(text: string): Scenario {
  return SCENARIOS.find((s) => s.match.test(text)) ?? FALLBACK;
}

/** Offline search: returns the canned results for whichever scenario the query matches. */
export const fixtureSearch: WebSearch = {
  name: 'fixtures',
  async search(query) {
    return scenarioFor(query).results;
  },
};
