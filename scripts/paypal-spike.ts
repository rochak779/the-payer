import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * Session 1 spike: answers what PayPal's sandbox really does before we build on it.
 * Prints statuses, ids and error names only. Never prints the access token or the client secret.
 * Usage: npm run paypal:spike <command> [args]. Set SPIKE_VERBOSE=1 to print whole response bodies.
 */
const BASE = 'https://api-m.sandbox.paypal.com'; // sandbox only, by design
const RETURN_URL = 'http://localhost:3000/paypal/return';
const CANCEL_URL = 'http://localhost:3000/paypal/cancel';
const VERBOSE = process.env.SPIKE_VERBOSE === '1';
const CURRENCY = process.env.SPIKE_CURRENCY ?? 'GBP'; // SPIKE_CURRENCY=USD to test dollars

const Link = z.object({ rel: z.string(), href: z.string() });
const ErrorBody = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  debug_id: z.string().optional(),
  details: z.array(z.object({ issue: z.string().optional(), description: z.string().optional() })).optional(),
  links: z.array(z.object({ rel: z.string().optional(), href: z.string().optional() })).optional(),
  error: z.string().optional(), // OAuth errors use { error, error_description }
  error_description: z.string().optional(),
});
const Token = z.object({ access_token: z.string(), expires_in: z.number() });
const SetupToken = z.object({ id: z.string(), status: z.string().optional(), links: z.array(Link).default([]) });
const PaymentToken = z.object({ id: z.string(), customer: z.object({ id: z.string() }).optional() });
const Authorization = z.object({ id: z.string(), status: z.string(), amount: z.object({ value: z.string() }).optional(), expiration_time: z.string().optional() });
const Order = z.object({
  id: z.string(),
  status: z.string(),
  purchase_units: z.array(z.object({ payments: z.object({ authorizations: z.array(Authorization).optional() }).optional() })).default([]),
  links: z.array(Link).default([]),
});
const Capture = z.object({ id: z.string(), status: z.string(), amount: z.object({ value: z.string() }).optional(), status_details: z.object({ reason: z.string() }).optional() });
const Refund = z.object({ id: z.string(), status: z.string() });

class SpikeError extends Error {}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new SpikeError(`${name} is not set in .env.local`);
  return value;
}

function amountArg(arg: string | undefined): string {
  if (!arg || !/^\d+(\.\d{1,2})?$/.test(arg)) throw new SpikeError(`Expected an amount, like 60 or 12.50, got: ${arg ?? 'nothing'}`);
  return Number(arg).toFixed(2);
}

function requestId(step: string): string {
  return `spike-${step}-${Date.now()}`;
}

let cachedToken: string | null = null;

async function token(): Promise<{ accessToken: string; expiresIn: number }> {
  const basic = Buffer.from(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_CLIENT_SECRET')}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = ErrorBody.parse(body);
    throw new SpikeError(`token → ${res.status} ${err.error ?? err.name ?? ''} ${err.error_description ?? ''}`.trim());
  }
  const parsed = Token.parse(body);
  cachedToken = parsed.access_token;
  return { accessToken: parsed.access_token, expiresIn: parsed.expires_in };
}

/** One PayPal call. Prints the outcome line; on failure prints the error name, issues and debug id, then throws. */
async function call(method: 'GET' | 'POST', apiPath: string, opts: { body?: unknown; requestId?: string } = {}): Promise<unknown> {
  const accessToken = cachedToken ?? (await token()).accessToken;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  if (opts.requestId) headers['PayPal-Request-Id'] = opts.requestId;
  const res = await fetch(`${BASE}${apiPath}`, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : {};
  console.log(`${method} ${apiPath} → ${res.status}${opts.requestId ? ` (request id ${opts.requestId})` : ''}`);
  if (VERBOSE) console.log(JSON.stringify(body, null, 2));
  if (!res.ok) {
    const err = ErrorBody.parse(body);
    const issues = (err.details ?? []).map((d) => d.issue).filter(Boolean).join(', ');
    console.log(`  error: ${err.name ?? '?'}${issues ? ` · issue: ${issues}` : ''} · debug id: ${err.debug_id ?? '?'}`);
    for (const d of err.details ?? []) if (d.description) console.log(`  ${d.description}`);
    const payerAction = err.links?.find((l) => l.rel === 'payer-action');
    if (payerAction) console.log(`  payer-action link: ${payerAction.href}`);
    throw new SpikeError(`PayPal refused: ${err.name ?? res.status}${issues ? ` (${issues})` : ''}`);
  }
  return body;
}

function vaultId(): string {
  return env('PAYPAL_VAULT_ID');
}

function orderBody(amount: string, description: string, extra: Record<string, unknown> = {}) {
  return {
    intent: 'AUTHORIZE',
    purchase_units: [{ reference_id: 'spike', description, amount: { currency_code: CURRENCY, value: amount }, ...extra }],
    payment_source: { paypal: { vault_id: vaultId() } },
  };
}

/** Creates an AUTHORIZE order on the saved PayPal and returns the hold (authorisation), calling /authorize if needed. */
async function hold(amount: string, extra: Record<string, unknown> = {}, reqId = requestId('hold')): Promise<string | null> {
  const order = Order.parse(await call('POST', '/v2/checkout/orders', { body: orderBody(amount, 'Spike test at Example Shop', extra), requestId: reqId }));
  let auth = order.purchase_units[0]?.payments?.authorizations?.[0];
  console.log(`  order ${order.id}: ${order.status}${auth ? ` · hold ${auth.id}: ${auth.status} ${CURRENCY} ${auth.amount?.value ?? '?'} (returned at once)` : ' · no hold in the response'}`);
  if (!auth) {
    const authorized = Order.parse(await call('POST', `/v2/checkout/orders/${order.id}/authorize`, { body: {}, requestId: `${reqId}-authorize` }));
    auth = authorized.purchase_units[0]?.payments?.authorizations?.[0];
    console.log(`  after /authorize: order ${authorized.status}${auth ? ` · hold ${auth.id}: ${auth.status} ${CURRENCY} ${auth.amount?.value ?? '?'}` : ' · still no hold'}`);
  }
  if (auth?.expiration_time) console.log(`  hold expires ${auth.expiration_time}`);
  return auth?.id ?? null;
}

function saveVaultId(id: string): void {
  const file = path.join(process.cwd(), '.env.local');
  const kept = readFileSync(file, 'utf8').split('\n').filter((line) => !line.startsWith('PAYPAL_VAULT_ID='));
  while (kept.length && kept[kept.length - 1] === '') kept.pop();
  writeFileSync(file, `${kept.join('\n')}\nPAYPAL_VAULT_ID=${id}\n`);
}

const commands: Record<string, (args: string[]) => Promise<void>> = {
  /** Read-only look at any sandbox resource, e.g. get /v2/payments/captures/<id>. Prints the whole body. */
  async get([apiPath]) {
    if (!apiPath?.startsWith('/v')) throw new SpikeError('Usage: get </v2/...path>');
    console.log(JSON.stringify(await call('GET', apiPath), null, 2));
  },

  async token() {
    const { expiresIn } = await token();
    console.log(`ok, expires in ${expiresIn}s`);
  },

  async 'vault-start'() {
    const setup = SetupToken.parse(
      await call('POST', '/v3/vault/setup-tokens', {
        requestId: requestId('vault-start'),
        body: {
          payment_source: {
            paypal: {
              description: 'The Payer: lets your agent pay for purchases you approve',
              usage_type: 'MERCHANT',
              customer_type: 'CONSUMER',
              permit_multiple_payment_tokens: false,
              usage_pattern: 'IMMEDIATE', // "On-demand instant payments: non-recurring, variable amount, variable frequency"
              experience_context: { return_url: RETURN_URL, cancel_url: CANCEL_URL, brand_name: 'The Payer', shipping_preference: 'NO_SHIPPING' },
            },
          },
        },
      }),
    );
    const approve = setup.links.find((l) => l.rel === 'approve');
    console.log(`  setup token ${setup.id}: ${setup.status ?? '?'}`);
    console.log(approve ? `  approve link (open it, log in as the sandbox buyer): ${approve.href}` : '  no approve link returned');
  },

  async 'vault-finish'([setupTokenId]) {
    if (!setupTokenId) throw new SpikeError('Usage: vault-finish <setupTokenId>');
    const saved = PaymentToken.parse(
      await call('POST', '/v3/vault/payment-tokens', {
        requestId: requestId('vault-finish'),
        body: { payment_source: { token: { id: setupTokenId, type: 'SETUP_TOKEN' } } },
      }),
    );
    saveVaultId(saved.id);
    console.log(`  saved vault id ending ${saved.id.slice(-4)} to .env.local`);
  },

  async hold([amount]) {
    await hold(amountArg(amount));
  },

  async capture([authId, amount, flag]) {
    if (!authId) throw new SpikeError('Usage: capture <authId> <amount> [--partial]');
    const partial = flag === '--partial';
    const cap = Capture.parse(
      await call('POST', `/v2/payments/authorizations/${authId}/capture`, {
        requestId: requestId('capture'),
        body: { amount: { currency_code: CURRENCY, value: amountArg(amount) }, final_capture: !partial },
      }),
    );
    console.log(`  capture ${cap.id}: ${cap.status} ${CURRENCY} ${cap.amount?.value ?? '?'}${cap.status_details ? ` (${cap.status_details.reason})` : ''}${partial ? ' (partial)' : ' (final)'}`);
  },

  async void([authId]) {
    if (!authId) throw new SpikeError('Usage: void <authId>');
    const body = await call('POST', `/v2/payments/authorizations/${authId}/void`, { requestId: requestId('void') });
    const parsed = Authorization.safeParse(body);
    console.log(`  hold ${authId}: ${parsed.success ? parsed.data.status : 'voided (no body returned)'}`);
  },

  async refund([captureId]) {
    if (!captureId) throw new SpikeError('Usage: refund <captureId>');
    const refund = Refund.parse(await call('POST', `/v2/payments/captures/${captureId}/refund`, { requestId: requestId('refund'), body: {} }));
    console.log(`  refund ${refund.id}: ${refund.status}`);
  },

  async payee([amount, email = process.env.THE_SECOND_SHOP]) {
    if (!email) throw new SpikeError('Usage: payee <amount> [secondShopSandboxEmail], or set THE_SECOND_SHOP in .env.local');
    await hold(amountArg(amount), { payee: { email_address: email } }, requestId('payee'));
  },

  async repeat([amount]) {
    const reqId = requestId('repeat');
    const first = await hold(amountArg(amount), {}, reqId);
    const second = await hold(amountArg(amount), {}, reqId);
    console.log(`  same request id twice → holds ${first} and ${second}: ${first === second ? 'the same (no double hold)' : 'DIFFERENT (double hold!)'}`);
  },
};

async function main() {
  const [name, ...args] = process.argv.slice(2);
  const command = name ? commands[name] : undefined;
  if (!command) {
    console.log(`Commands: ${Object.keys(commands).join(', ')}`);
    process.exit(name ? 1 : 0);
  }
  await command(args);
}

main().catch((err) => {
  console.error(err instanceof SpikeError ? err.message : err);
  process.exit(1);
});
