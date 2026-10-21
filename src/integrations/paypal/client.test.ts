import { describe, expect, it } from 'vitest';
import { createPayPalClient, PAYPAL_BASE, PayPalError, toPayPalAmount } from './client';

const SECRET = 'super-secret-value-123';

type Call = { url: string; init: RequestInit };
type Reply = { status: number; body: unknown };

/** A fake fetch: token calls get a fresh token each time; other calls get the queued replies in order. */
function fakeFetch(replies: Reply[] = [], tokenReplies: Reply[] = []) {
  const calls: Call[] = [];
  let tokens = 0;
  const fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const reply = String(url).endsWith('/v1/oauth2/token')
      ? tokenReplies.shift() ?? { status: 200, body: { access_token: `token-${++tokens}`, expires_in: 32400 } }
      : replies.shift() ?? { status: 200, body: {} };
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof globalThis.fetch;
  return { fetch, calls, tokenCalls: () => calls.filter((c) => c.url.endsWith('/v1/oauth2/token')).length };
}

const client = (f: ReturnType<typeof fakeFetch>, now = () => 0) => createPayPalClient({ clientId: 'id', clientSecret: SECRET, fetch: f.fetch, now });
const header = (c: Call, name: string) => new Headers(c.init.headers).get(name);

describe('toPayPalAmount', () => {
  it('writes minor units as a two-decimal string and keeps the currency', () => {
    expect(toPayPalAmount({ minor: 1200, currency: 'USD' })).toEqual({ currency_code: 'USD', value: '12.00' });
    expect(toPayPalAmount({ minor: 1999, currency: 'USD' }).value).toBe('19.99');
    expect(toPayPalAmount({ minor: 5, currency: 'USD' }).value).toBe('0.05');
    expect(toPayPalAmount({ minor: 24000, currency: 'GBP' })).toEqual({ currency_code: 'GBP', value: '240.00' });
  });
});

describe('createPayPalClient', () => {
  it('fetches one token for two requests, and a new one after it expires', async () => {
    let now = 0;
    const f = fakeFetch();
    const c = client(f, () => now);
    await c.request('GET', '/v2/checkout/orders/A');
    await c.request('GET', '/v2/checkout/orders/B');
    expect(f.tokenCalls()).toBe(1);
    now = 32400 * 1000;
    await c.request('GET', '/v2/checkout/orders/C');
    expect(f.tokenCalls()).toBe(2);
  });

  it('retries a 401 once with a new token, and throws on a second 401', async () => {
    const f = fakeFetch([{ status: 401, body: {} }, { status: 200, body: { id: 'A' } }]);
    await expect(client(f).request('GET', '/v2/checkout/orders/A')).resolves.toEqual({ id: 'A' });
    expect(f.tokenCalls()).toBe(2);

    const g = fakeFetch([{ status: 401, body: {} }, { status: 401, body: {} }]);
    await expect(client(g).request('GET', '/v2/checkout/orders/A')).rejects.toBeInstanceOf(PayPalError);
  });

  it('only ever calls the sandbox', async () => {
    const f = fakeFetch();
    await client(f).request('POST', '/v2/checkout/orders', { body: {} });
    expect(f.calls.length).toBeGreaterThan(0);
    for (const call of f.calls) expect(call.url.startsWith(PAYPAL_BASE)).toBe(true);
  });

  it('sends the request id as PayPal-Request-Id', async () => {
    const f = fakeFetch();
    await client(f).request('POST', '/v2/checkout/orders', { body: {}, requestId: 'apv_1-open' });
    expect(header(f.calls.at(-1)!, 'PayPal-Request-Id')).toBe('apv_1-open');
  });

  it("turns PayPal's error body into a PayPalError with the issue and debug id", async () => {
    const f = fakeFetch([{ status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'AUTHORIZATION_ALREADY_CAPTURED' }], debug_id: 'abc' } }]);
    const err = await client(f).request('POST', '/v2/payments/authorizations/H/capture', { body: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PayPalError);
    expect(err).toMatchObject({ status: 422, issue: 'AUTHORIZATION_ALREADY_CAPTURED', debugId: 'abc' });
  });

  it('never puts the client secret in an error message', async () => {
    const failures = [
      fakeFetch([], [{ status: 401, body: { error: 'invalid_client', error_description: 'Client Authentication failed' } }]),
      fakeFetch([{ status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'X' }] } }]),
      fakeFetch([{ status: 500, body: 'not json' }]),
    ];
    for (const f of failures) {
      const err = await client(f).request('GET', '/v2/checkout/orders/A').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(Error);
      expect(String((err as Error).message)).not.toContain(SECRET);
      expect(String((err as Error).message)).not.toContain(Buffer.from(`id:${SECRET}`).toString('base64'));
    }
  });
});
