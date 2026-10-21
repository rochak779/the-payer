import { z } from 'zod';
import type { Currency, Money } from '@/domain/types';

/** Sandbox only, by design: no setting can point this at real money. */
export const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';

export type PayPalAmount = { currency_code: Currency; value: string };

/** The only way money becomes a PayPal amount: integer minor units → "19.99". */
export function toPayPalAmount(m: Money): PayPalAmount {
  return { currency_code: m.currency, value: `${Math.floor(m.minor / 100)}.${String(m.minor % 100).padStart(2, '0')}` };
}

export class PayPalError extends Error {
  constructor(message: string, readonly status: number, readonly issue: string | null, readonly debugId: string | null) {
    super(message);
    this.name = 'PayPalError';
  }
}

export type PayPalClient = {
  request<T>(method: 'GET' | 'POST', path: string, opts?: { body?: unknown; requestId?: string }): Promise<T>;
};

const Token = z.object({ access_token: z.string(), expires_in: z.number() });
const ErrorBody = z.object({
  name: z.string().optional(),
  debug_id: z.string().optional(),
  details: z.array(z.object({ issue: z.string().optional() })).optional(),
  error: z.string().optional(), // OAuth errors use { error, error_description }
}).catch({});

/** Refresh a minute early so a token never expires mid-request. */
const EARLY_MS = 60_000;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/** Never includes the request, the token or the secret: only the status and PayPal's own error names. */
function errorFrom(status: number, body: unknown): PayPalError {
  const err = ErrorBody.parse(body);
  const issue = err.details?.find((d) => d.issue)?.issue ?? err.error ?? null;
  const name = err.name ?? (status === 401 ? 'UNAUTHORIZED' : 'ERROR');
  return new PayPalError(`PayPal ${status} ${name}${issue ? ` (${issue})` : ''}`, status, issue, err.debug_id ?? null);
}

export function createPayPalClient(opts: { clientId: string; clientSecret: string; fetch?: typeof fetch; now?: () => number }): PayPalClient {
  const fetchFn = opts.fetch ?? fetch;
  const now = opts.now ?? Date.now;
  const basic = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64');
  let token: { value: string; expiresAt: number } | null = null;

  async function accessToken(fresh: boolean): Promise<string> {
    if (!fresh && token && now() < token.expiresAt) return token.value;
    const res = await fetchFn(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const body = await readJson(res);
    if (!res.ok) throw errorFrom(res.status, body);
    const t = Token.parse(body);
    token = { value: t.access_token, expiresAt: now() + t.expires_in * 1000 - EARLY_MS };
    return token.value;
  }

  async function send(method: 'GET' | 'POST', path: string, o: { body?: unknown; requestId?: string }, bearer: string) {
    const headers: Record<string, string> = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    if (o.requestId) headers['PayPal-Request-Id'] = o.requestId;
    return fetchFn(`${PAYPAL_BASE}${path}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
  }

  return {
    async request<T>(method: 'GET' | 'POST', path: string, o: { body?: unknown; requestId?: string } = {}): Promise<T> {
      let res = await send(method, path, o, await accessToken(false));
      if (res.status === 401) res = await send(method, path, o, await accessToken(true)); // token revoked or expired early: once
      const body = await readJson(res);
      if (!res.ok) throw errorFrom(res.status, body);
      return body as T;
    },
  };
}

export function payPalClientFromEnv(): PayPalClient {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  return createPayPalClient({ clientId, clientSecret });
}
