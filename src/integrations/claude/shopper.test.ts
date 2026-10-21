import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import type { SearchResult, ShopperEvent } from '@/agent/types';
import { PurchaseInput, createClaudeShopper, systemPrompt, toPurchaseRequest } from './shopper';

const input = {
  item: 'Hotel Lisboa Plaza, 2 nights', merchant: 'Hotel Lisboa Plaza', category: 'hotel' as const,
  total_amount: 240.5, currency: 'GBP' as const, units: 2, unit_label: 'night',
  refund_policy: 'Free cancellation until 48 hours before check-in.', url: 'https://example.com/h',
  why: 'Cheapest refundable option.', listing_text: 'x'.repeat(5000),
};

describe('toPurchaseRequest', () => {
  it('converts the tool input into a purchase request in pence', () => {
    const req = toPurchaseRequest(input, '2026-11-10');
    expect(req).toMatchObject({ total: { minor: 24050, currency: 'GBP' }, units: 2, unitLabel: 'night', purchaseDate: '2026-11-10', agentNote: 'Cheapest refundable option.' });
    expect(req.listingText).toHaveLength(4000);
  });

  it('rejects a non-http link from the agent', () => {
    expect(() => toPurchaseRequest({ ...input, url: 'javascript:alert(1)' }, '2026-11-10')).toThrow();
  });
});

/** A Channel3 result: one shop's offer, with the shop's own price and condition. */
const mugOffer: SearchResult = {
  title: 'Ceramic mug, white, 12 oz', url: 'https://mugs.example/products/white-mug?variant=7',
  snippet: 'Shop: mugs.example\nPrice: $12.99\nCondition: refurbished\nAvailability: InStock\nRefund policy: not stated by the shop\nA plain white mug.',
  offer: { shop: 'mugs.example', price: { minor: 1299, currency: 'USD' }, condition: 'refurbished', inStock: true },
};
const otherOffer: SearchResult = {
  ...mugOffer, url: 'https://cups.example/white-cup',
  offer: { shop: 'cups.example', price: { minor: 899, currency: 'USD' }, condition: 'new', inStock: true },
};
/** The agent's request for the mug, with its own (wrong) price, currency and shop, and no condition line. */
const mugInput = {
  ...input, item: 'White ceramic mug', merchant: 'Mug World', category: 'home' as const, total_amount: 9.99, currency: 'GBP' as const,
  units: undefined, unit_label: undefined, refund_policy: '', url: mugOffer.url, listing_text: 'A plain white mug, $9.99.',
};

describe('toPurchaseRequest with search results', () => {
  it("uses the listing's price and shop when the agent picked an offer, even if the agent wrote different ones", () => {
    const req = toPurchaseRequest(mugInput, '2026-11-10', [otherOffer, mugOffer]);
    expect(req.total).toEqual({ minor: 1299, currency: 'USD' });
    expect(req.merchant).toBe('mugs.example');
  });

  it("gives the checker the listing's own text, Condition line included", () => {
    const req = toPurchaseRequest(mugInput, '2026-11-10', [mugOffer]);
    expect(req.listingText).toContain('Condition: refurbished');
  });

  it("keeps the agent's words when its link matches no offer it was shown", () => {
    const req = toPurchaseRequest({ ...mugInput, url: 'https://elsewhere.example/mug' }, '2026-11-10', [mugOffer]);
    expect(req).toMatchObject({ total: { minor: 999, currency: 'GBP' }, merchant: 'Mug World', listingText: 'A plain white mug, $9.99.' });
  });
});

describe('systemPrompt', () => {
  const prompt = systemPrompt('2026-11-10');

  it('assumes US dollars, not pounds', () => {
    expect(prompt).toContain('US dollars');
    expect(prompt).not.toContain('GBP');
  });

  it('tells the agent to pick only in-stock offers and to copy the price and shop from the listing', () => {
    expect(prompt).toMatch(/only .*in stock/i);
    expect(prompt).toMatch(/copy .*price.*shop|copy .*shop.*price/i);
  });

  // Live run (Session 10): asked for "a wooden building blocks set for my nephew", Gemini searched "… Melissa and Doug …" and "site:walmart.com".
  it("tells the agent to search in the person's own words, without adding brands or shops they didn't name", () => {
    expect(prompt).toMatch(/search .*person's own words/i);
    expect(prompt).toMatch(/brand or shop .*didn't name/i);
  });
});

describe('PurchaseInput', () => {
  it('sends a hotel request without a night count back to the agent, saying what to add', () => {
    const result = PurchaseInput.safeParse({ ...input, units: undefined, unit_label: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['units'], message: 'A hotel is priced per night: set units to the number of nights and unit_label to "night".' });
  });

  // Live run (Session 10): Gemini filed a birthday present (a wooden blocks set) as gift_card, so "No gift cards" blocked it.
  it('tells the agent that gift_card means a gift card or voucher, never a present', () => {
    expect(PurchaseInput.shape.category.description).toMatch(/gift_card .*only .*gift card or voucher/i);
    expect(PurchaseInput.shape.category.description).toMatch(/present .*not gift_card/i);
  });

  it('other purchases may leave the count out', () => {
    expect(PurchaseInput.safeParse({ ...input, category: 'other', units: undefined, unit_label: undefined }).success).toBe(true);
  });
});

describe('Claude shopper run', () => {
  /** Runs the agent with a fake SDK whose tool runner ends on `final`. */
  async function endsWith(final: { stop_reason: string; content: unknown[] }) {
    const toolRunner = vi.fn().mockResolvedValue(final);
    const events: ShopperEvent[] = [];
    const shopper = createClaudeShopper({ client: { beta: { messages: { toolRunner } } } as unknown as Anthropic, clock: () => new Date('2026-11-10T09:00:00Z') });
    await shopper.run('Book a hotel', { searchWeb: vi.fn(), requestPurchase: vi.fn() }, (e) => events.push(e));
    return events.at(-1);
  }

  it("asks to buy at the listing's price and shop from this run's search, not the agent's words", async () => {
    // A fake runner that does what the model would: search, then request the offer with the wrong price and shop.
    const toolRunner = vi.fn(async ({ tools }: { tools: { run(args: unknown): Promise<unknown> }[] }) => {
      await tools[0].run({ query: 'white mug' });
      await tools[1].run(mugInput);
      return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Done.' }] };
    });
    const requestPurchase = vi.fn().mockResolvedValue({ outcome: 'approve', reasons: [], summary: 'Fits your rules.', checker: 'test' });
    const events: ShopperEvent[] = [];
    const shopper = createClaudeShopper({ client: { beta: { messages: { toolRunner } } } as unknown as Anthropic, clock: () => new Date('2026-11-10T09:00:00Z') });
    await shopper.run('Buy a white mug', { searchWeb: vi.fn().mockResolvedValue([mugOffer]), requestPurchase }, (e) => events.push(e));
    expect(requestPurchase).toHaveBeenCalledWith(expect.objectContaining({ merchant: 'mugs.example', total: { minor: 1299, currency: 'USD' } }));
    expect(events).toContainEqual({ kind: 'request', text: 'Asking to buy White ceramic mug at mugs.example for $12.99' });
  });

  it('reports its final answer', async () => {
    expect(await endsWith({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Booked.' }] })).toEqual({ kind: 'status', text: 'Booked.' });
  });

  it('says so when it hits its 12-step limit or the length limit, instead of ending silently', async () => {
    const midSearch = [{ type: 'text', text: 'Let me search again.' }, { type: 'tool_use', id: 't1', name: 'search_web', input: { query: 'x' } }];
    expect(await endsWith({ stop_reason: 'tool_use', content: midSearch })).toEqual({ kind: 'status', text: 'Stopped after 12 steps without finding a suitable option.' });
    expect(await endsWith({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'I found' }] })).toEqual({ kind: 'status', text: 'The agent stopped: its answer ran over the length limit. Try the task again.' });
  });
});
