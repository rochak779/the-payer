import { Channel3Error } from '@channel3/sdk';
import { describe, expect, it } from 'vitest';
import { serviceProblem } from '@/domain/serviceError';
import { createChannel3Search, toSearchResults, type Channel3Product } from './search';

const offer = (over: Partial<NonNullable<Channel3Product['offers']>[number]> = {}) => ({
  url: 'https://shop.example/mug', domain: 'shop.example', price: { price: 19.99, currency: 'USD' }, availability: 'InStock', condition: 'new', ...over,
});
const mug: Channel3Product = { title: 'White stoneware mug', description: 'A plain white mug, 350 ml.', offers: [offer()] };

/** A fake Channel3 client: records each request and returns these products as the SDK's page does (in `data`). */
function fakeClient(products: unknown[] | (() => never)) {
  const sent: unknown[] = [];
  return {
    sent,
    client: {
      products: {
        async search(req: object) {
          sent.push(req);
          if (typeof products === 'function') products();
          return { data: products as unknown[] };
        },
      },
    },
  };
}

describe('toSearchResults', () => {
  it('turns decimal prices into exact minor units', () => {
    const product = { ...mug, offers: [offer({ price: { price: 19.99, currency: 'USD' } }), offer({ price: { price: 0.3, currency: 'USD' } }), offer({ price: { price: 395, currency: 'USD' } })] };
    expect(toSearchResults(product).map((r) => r.offer?.price)).toEqual([
      { minor: 1999, currency: 'USD' }, { minor: 30, currency: 'USD' }, { minor: 39500, currency: 'USD' },
    ]);
  });

  it('skips an offer in a currency we do not support', () => {
    expect(toSearchResults({ ...mug, offers: [offer({ price: { price: 199, currency: 'SEK' } }), offer()] })).toHaveLength(1);
  });

  it('skips an offer that is out of stock', () => {
    expect(toSearchResults({ ...mug, offers: [offer({ availability: 'OutOfStock' })] })).toEqual([]);
  });

  it('shows the condition to the agent in both the offer and the text it reads', () => {
    const [r] = toSearchResults({ ...mug, offers: [offer({ condition: 'refurbished' })] });
    expect(r.offer?.condition).toBe('refurbished');
    expect(r.snippet).toContain('Condition: refurbished');
  });

  it('writes the shop, price, condition, stock and refund policy first, then the description', () => {
    const [r] = toSearchResults({ ...mug, offers: [offer({ condition: null })] });
    expect(r).toMatchObject({ title: 'White stoneware mug', url: 'https://shop.example/mug', offer: { shop: 'shop.example', condition: 'unknown', inStock: true } });
    expect(r.snippet).toBe('Shop: shop.example\nPrice: $19.99\nCondition: unknown\nAvailability: InStock\nRefund policy: not stated by the shop\nA plain white mug, 350 ml.');
  });
});

describe('createChannel3Search', () => {
  it('asks for US results in dollars for the query', async () => {
    const fake = fakeClient([mug]);
    const results = await createChannel3Search({ client: fake.client }).search('white mug');
    expect(fake.sent).toEqual([{ query: 'white mug', limit: 5, config: { country: 'US', language: 'en', currency: 'USD' } }]);
    expect(results).toHaveLength(1);
  });

  it('returns at most 8 results', async () => {
    const many = Array.from({ length: 5 }, () => ({ ...mug, offers: [offer(), offer()] }));
    expect(await createChannel3Search({ client: fakeClient(many).client }).search('mug')).toHaveLength(8);
  });

  it('skips a product it cannot read instead of failing the search', async () => {
    expect(await createChannel3Search({ client: fakeClient([{ nonsense: true }, mug]).client }).search('mug')).toHaveLength(1);
  });

  it('needs a key', () => {
    expect(() => createChannel3Search({ apiKey: '' })).toThrow('CHANNEL3_API_KEY is not set');
  });

  it("a rate limit reads as the service being over its usage limit", async () => {
    const fake = fakeClient(() => { throw new Channel3Error({ message: 'Too many requests', statusCode: 429 }); });
    const err = await createChannel3Search({ client: fake.client }).search('mug').catch((e: unknown) => e);
    expect(serviceProblem(err)).toBe('is over its usage limit');
  });
});
