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
    match: /\b(mugs?|cups?)\b/i,
    query: 'plain white ceramic mug',
    results: [{ title: 'White stoneware mug, 350 ml – $12', url: 'https://example.com/white-stoneware-mug', snippet: 'Condition: new. Returns within 30 days.' }],
    pick: {
      item: 'White stoneware mug, 350 ml', merchant: 'Hearth & Kiln', category: 'home', total: { minor: 1200, currency: 'USD' },
      refundPolicy: 'Returns within 30 days.', url: 'https://example.com/white-stoneware-mug',
      agentNote: 'Plain white mug, well under budget.', listingText: 'Condition: new. Returns within 30 days.',
    },
  },
  {
    match: /\b(gift|present|birthday|nephew|lego|toys?)\b/i,
    query: 'building blocks set gift for 10 year old',
    results: [{ title: 'Building blocks race car set, ages 9+ – $38', url: 'https://example.com/building-blocks-race-car', snippet: 'Ages 9+. Free returns within 60 days.' }],
    pick: {
      item: 'Building blocks race car set, ages 9+', merchant: 'Brick & Bolt Toys', category: 'other', total: { minor: 3800, currency: 'USD' },
      refundPolicy: 'Free returns within 60 days.', url: 'https://example.com/building-blocks-race-car',
      agentNote: "Birthday gift for the user's nephew.", listingText: 'Ages 9+. Free returns within 60 days.',
    },
  },
  {
    match: /\b(headphones|earbuds)\b/i,
    query: 'wireless over-ear headphones under $80',
    results: [{ title: 'Wireless over-ear headphones (refurbished) – $55', url: 'https://example.com/refurbished-headphones', snippet: 'Condition: refurbished. 90-day warranty.' }],
    pick: {
      item: 'Wireless over-ear headphones (refurbished)', merchant: 'Second Spin Audio', category: 'electronics',
      total: { minor: 5500, currency: 'USD' }, refundPolicy: 'Returns within 30 days.', url: 'https://example.com/refurbished-headphones',
      agentNote: 'Cheapest well-reviewed option under budget.', listingText: 'Condition: refurbished. 90-day warranty.',
    },
  },
];

export const FALLBACK: Scenario = {
  match: /.*/,
  query: 'illustrated hardback cookbook',
  results: [{ title: 'Illustrated hardback cookbook – £35', url: 'https://example.com/hardback-cookbook', snippet: 'Hardback. Returns within 30 days.' }],
  pick: {
    item: 'Illustrated hardback cookbook', merchant: 'Paper Lane Books', category: 'other',
    total: { minor: 3500, currency: 'GBP' }, refundPolicy: 'Returns within 30 days.', url: 'https://example.com/hardback-cookbook',
    agentNote: 'Matches the request.', listingText: 'Hardback. Returns within 30 days.',
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
