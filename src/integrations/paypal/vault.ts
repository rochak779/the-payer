import { z } from 'zod';
import type { Store, Db } from '@/store/store';
import type { PayPalClient } from './client';

/**
 * "Connect PayPal": the buyer approves once on PayPal, and PayPal saves their account for this shop (the vault).
 * After that, each approved purchase can be held on it with no buyer action. Shapes verified in the sandbox (BRIEF.md).
 */
const SetupToken = z.object({ id: z.string(), links: z.array(z.object({ rel: z.string(), href: z.string().url() })).default([]) });
const PaymentToken = z.object({ id: z.string() });
const SetupTokenStatus = z.object({ status: z.string() });

/** PayPal ids are upper-case letters and digits; anything else never reaches PayPal. */
export function isValidSetupTokenId(id: string | null): id is string {
  return typeof id === 'string' && /^[A-Z0-9]{10,30}$/.test(id);
}

export async function startVaultSetup(client: PayPalClient, appUrl: string): Promise<{ setupTokenId: string; approveUrl: string }> {
  const setup = SetupToken.parse(await client.request('POST', '/v3/vault/setup-tokens', {
    body: {
      payment_source: {
        paypal: {
          description: 'The Payer: lets your agent pay for purchases you approve',
          usage_type: 'MERCHANT',
          customer_type: 'CONSUMER',
          permit_multiple_payment_tokens: false,
          usage_pattern: 'IMMEDIATE', // on demand: variable amount, variable frequency
          experience_context: {
            return_url: `${appUrl}/paypal/return`,
            cancel_url: `${appUrl}/paypal/return?cancelled=1`,
            brand_name: 'The Payer',
            shipping_preference: 'NO_SHIPPING',
          },
        },
      },
    },
  }));
  // The id goes into a URL path later, so it must look like a PayPal id.
  if (!isValidSetupTokenId(setup.id)) throw new Error('PayPal returned an unexpected setup token id');
  const approve = setup.links.find((l) => l.rel === 'approve');
  if (!approve) throw new Error("PayPal didn't return an approval link");
  return { setupTokenId: setup.id, approveUrl: approve.href };
}

/** The fixed request id makes a reloaded return page get the same saved PayPal back, not a second one. */
export async function finishVaultSetup(client: PayPalClient, setupTokenId: string): Promise<{ vaultId: string }> {
  const saved = PaymentToken.parse(await client.request('POST', '/v3/vault/payment-tokens', {
    requestId: `${setupTokenId}-vault`,
    body: { payment_source: { token: { id: setupTokenId, type: 'SETUP_TOKEN' } } },
  }));
  return { vaultId: saved.id };
}

/** The person's own PayPal if they connected one, else the demo buyer, else none. Old data files have no `paypal` key. */
export function vaultIdFor(db: Db, env: Record<string, string | undefined> = process.env): string | null {
  return db.settings.paypal?.vaultId ?? env.PAYPAL_VAULT_ID ?? null;
}

type ConnectDeps = { client: PayPalClient; store: Store; clock: () => Date };
export type ConnectResult = 'connected' | 'waiting' | 'cancelled';

/**
 * "Finish connecting": asks PayPal whether the buyer approved the setup token we're waiting for, and if so saves their PayPal.
 * The sandbox records the approval but then fails to send the buyer back (Session 7, any return address), so the app can't rely on the redirect.
 */
export async function finishConnecting(deps: ConnectDeps): Promise<ConnectResult> {
  const { paypal, paypalPending: pending } = deps.store.read().settings; // both undefined in an old data file
  if (!pending) return paypal ? 'connected' : 'cancelled'; // a second click after a finish is still connected
  try {
    const { status } = SetupTokenStatus.parse(await deps.client.request('GET', `/v3/vault/setup-tokens/${pending.setupTokenId}`));
    if (status !== 'APPROVED') return 'waiting';
    const { vaultId } = await finishVaultSetup(deps.client, pending.setupTokenId);
    deps.store.update((db) => {
      db.settings.paypal = { vaultId, connectedAt: deps.clock().toISOString() };
      db.settings.paypalPending = null;
    });
    return 'connected';
  } catch (err) {
    console.error(`PayPal connect failed: ${err instanceof Error ? err.message : String(err)}`); // PayPalError messages carry no secrets
    deps.store.update((db) => { db.settings.paypalPending = null; }); // an expired or refused token won't recover; Connect starts afresh
    return 'cancelled';
  }
}

/**
 * PayPal's return link, for when its redirect works. It finishes the connection this visitor started and never reads a token
 * from the link, so a crafted link can't attach someone else's PayPal.
 */
export async function handleReturn(params: URLSearchParams, deps: ConnectDeps): Promise<ConnectResult> {
  if (params.has('cancelled')) {
    deps.store.update((db) => { db.settings.paypalPending = null; });
    return 'cancelled';
  }
  return finishConnecting(deps);
}
