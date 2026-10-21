import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStore, emptyDb } from '@/store/store';
import { tempStore } from '@/test/tempStore';
import { PayPalError, type PayPalClient } from './client';
import { finishConnecting, finishVaultSetup, handleReturn, isValidSetupTokenId, startVaultSetup, vaultIdFor } from './vault';

const now = new Date('2026-12-01T10:00:00Z');

type Sent = { method: string; path: string; body?: unknown; requestId?: string };

/** A fake PayPal that records every call. `answer` decides what each path returns. */
function fakePayPal(answer: (path: string) => unknown) {
  const sent: Sent[] = [];
  const client: PayPalClient = {
    async request<T>(method: 'GET' | 'POST', path: string, opts: { body?: unknown; requestId?: string } = {}) {
      sent.push({ method, path, ...opts });
      return answer(path) as T;
    },
  };
  return { client, sent };
}

const approveLink = 'https://www.sandbox.paypal.com/agreements/approve?approval_session_id=5C991763VB2781612';
const setupToken = { id: '5C991763VB2781612', status: 'PAYER_ACTION_REQUIRED', links: [{ rel: 'self', href: 'https://x/self' }, { rel: 'approve', href: approveLink }] };
const savedToken = { id: 'VAULT9', customer: { id: 'CUST1' } };

describe('startVaultSetup', () => {
  it('asks PayPal for a setup token with our return links, and gives back the approve link', async () => {
    const paypal = fakePayPal(() => setupToken);
    const result = await startVaultSetup(paypal.client, 'http://localhost:3000');
    expect(result).toEqual({ setupTokenId: '5C991763VB2781612', approveUrl: approveLink });
    expect(paypal.sent).toHaveLength(1);
    expect(paypal.sent[0]).toMatchObject({ method: 'POST', path: '/v3/vault/setup-tokens' });
    expect(paypal.sent[0].body).toMatchObject({
      payment_source: {
        paypal: {
          usage_type: 'MERCHANT',
          customer_type: 'CONSUMER',
          experience_context: {
            return_url: 'http://localhost:3000/paypal/return',
            cancel_url: 'http://localhost:3000/paypal/return?cancelled=1',
          },
        },
      },
    });
  });

  it("throws when PayPal doesn't return an approval link", async () => {
    const paypal = fakePayPal(() => ({ ...setupToken, links: [{ rel: 'self', href: 'https://x/self' }] }));
    await expect(startVaultSetup(paypal.client, 'http://localhost:3000')).rejects.toThrow("PayPal didn't return an approval link");
  });

  it('refuses a setup token id that could change the path it is later used in', async () => {
    const paypal = fakePayPal(() => ({ ...setupToken, id: '../../v1/x' }));
    await expect(startVaultSetup(paypal.client, 'http://localhost:3000')).rejects.toThrow('PayPal returned an unexpected setup token id');
  });
});

describe('finishVaultSetup', () => {
  it('swaps the approved setup token for a saved PayPal, once per token', async () => {
    const paypal = fakePayPal(() => savedToken);
    expect(await finishVaultSetup(paypal.client, '5C991763VB2781612')).toEqual({ vaultId: 'VAULT9' });
    expect(paypal.sent).toEqual([{
      method: 'POST', path: '/v3/vault/payment-tokens', requestId: '5C991763VB2781612-vault',
      body: { payment_source: { token: { id: '5C991763VB2781612', type: 'SETUP_TOKEN' } } },
    }]);
  });
});

describe('vaultIdFor', () => {
  const connected = () => {
    const db = emptyDb();
    db.settings.paypal = { vaultId: 'MINE', connectedAt: now.toISOString() };
    return db;
  };

  it("prefers the visitor's own PayPal over the demo buyer", () => {
    expect(vaultIdFor(connected(), { PAYPAL_VAULT_ID: 'DEMO' })).toBe('MINE');
  });

  it('falls back to the demo buyer, then to nothing', () => {
    expect(vaultIdFor(emptyDb(), { PAYPAL_VAULT_ID: 'DEMO' })).toBe('DEMO');
    expect(vaultIdFor(emptyDb(), {})).toBeNull();
  });

  it('an old data file with no PayPal setting gives null, not a crash', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'am-')), 'db.json');
    fs.writeFileSync(file, JSON.stringify({ rules: [], approvals: [], log: [], runs: [], settings: { agentEnabled: true } }));
    expect(vaultIdFor(createStore(file).read(), {})).toBeNull();
  });
});

describe('isValidSetupTokenId', () => {
  it('accepts PayPal-shaped ids only', () => {
    expect(isValidSetupTokenId('5C991763VB2781612')).toBe(true);
    for (const bad of [null, '', '../../x', '5c991763vb2781612', 'SHORT', 'A'.repeat(31), '5C991763VB2781612/']) {
      expect(isValidSetupTokenId(bad)).toBe(false);
    }
  });
});

/**
 * PayPal's sandbox records the approval but then fails to send the buyer back (Session 7, any return address).
 * So the app remembers the setup token it's waiting for and asks PayPal whether it was approved.
 */
describe('finishing a connection', () => {
  const pendingToken = { setupTokenId: '5C991763VB2781612', approveUrl: approveLink };
  const setup = (status = 'APPROVED', save: () => unknown = () => savedToken) => {
    const paypal = fakePayPal((path) => (path.startsWith('/v3/vault/setup-tokens/') ? { id: '5C991763VB2781612', status } : save()));
    const store = tempStore();
    store.update((db) => { db.settings.paypalPending = pendingToken; });
    return { paypal, store, deps: { client: paypal.client, store, clock: () => now } };
  };

  it('saves the PayPal once PayPal has the approval, and stops waiting', async () => {
    const { paypal, store, deps } = setup();
    expect(await finishConnecting(deps)).toBe('connected');
    expect(paypal.sent.map((s) => `${s.method} ${s.path}`)).toEqual(['GET /v3/vault/setup-tokens/5C991763VB2781612', 'POST /v3/vault/payment-tokens']);
    expect(store.read().settings.paypal).toEqual({ vaultId: 'VAULT9', connectedAt: now.toISOString() });
    expect(store.read().settings.paypalPending).toBeNull();
  });

  it('not approved yet: keeps waiting and saves nothing', async () => {
    const { paypal, store, deps } = setup('PAYER_ACTION_REQUIRED');
    expect(await finishConnecting(deps)).toBe('waiting');
    expect(paypal.sent.map((s) => s.path)).toEqual(['/v3/vault/setup-tokens/5C991763VB2781612']);
    expect(store.read().settings.paypal).toBeNull();
    expect(store.read().settings.paypalPending).toEqual(pendingToken);
  });

  it('a PayPal refusal saves nothing and stops waiting, so Connect can start again', async () => {
    const { store, deps } = setup('APPROVED', () => { throw new PayPalError('PayPal 422 UNPROCESSABLE_ENTITY (PAYER_ACTION_REQUIRED)', 422, 'PAYER_ACTION_REQUIRED', null); });
    expect(await finishConnecting(deps)).toBe('cancelled');
    expect(store.read().settings.paypal).toBeNull();
    expect(store.read().settings.paypalPending).toBeNull();
  });

  it('with nothing pending, makes no PayPal call (an old data file has no pending key)', async () => {
    const paypal = fakePayPal(() => savedToken);
    const store = tempStore();
    expect(await finishConnecting({ client: paypal.client, store, clock: () => now })).toBe('cancelled');
    expect(paypal.sent).toEqual([]);
  });

  it('finishing twice (a second click) still says connected, with no second PayPal call', async () => {
    const { paypal, store, deps } = setup();
    expect(await finishConnecting(deps)).toBe('connected');
    expect(await finishConnecting(deps)).toBe('connected');
    expect(paypal.sent).toHaveLength(2); // the first finish's status check and save only
    expect(store.read().settings.paypal?.vaultId).toBe('VAULT9');
  });

  it("PayPal's return link finishes the pending connection and ignores what the link says", async () => {
    const { store, deps } = setup();
    expect(await handleReturn(new URLSearchParams({ approval_token_id: 'SOMEONEELSES1234' }), deps)).toBe('connected');
    expect(store.read().settings.paypal?.vaultId).toBe('VAULT9');
  });

  it('a tampered return link with nothing pending makes no PayPal call', async () => {
    const paypal = fakePayPal(() => savedToken);
    const store = tempStore();
    for (const query of ['token=../../x', 'approval_token_id=../../x', '']) {
      expect(await handleReturn(new URLSearchParams(query), { client: paypal.client, store, clock: () => now })).toBe('cancelled');
    }
    expect(paypal.sent).toEqual([]);
  });

  it('a cancel makes no PayPal call and stops waiting', async () => {
    const { paypal, store, deps } = setup();
    expect(await handleReturn(new URLSearchParams({ cancelled: '1' }), deps)).toBe('cancelled');
    expect(paypal.sent).toEqual([]);
    expect(store.read().settings.paypalPending).toBeNull();
  });
});
