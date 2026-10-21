import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/health (Render health check)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('answers 200 { ok: true } with the hosted settings and no keys, calling no outside service', async () => {
    for (const [name, value] of Object.entries({ HOSTED: '1', CHECKER: 'gemini', PARSER: 'gemini', SEARCH: 'channel3', SHOPPER: 'gemini', PAYMENTS: 'paypal' })) vi.stubEnv(name, value);
    for (const key of ['GEMINI_API_KEY', 'CHANNEL3_API_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']) vi.stubEnv(key, undefined);
    const outside = vi.fn(async () => { throw new Error('the health check must not call out'); });
    vi.stubGlobal('fetch', outside);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(outside).not.toHaveBeenCalled();
  });
});
