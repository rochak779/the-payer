import { afterEach, describe, expect, it } from 'vitest';
import { recordDecision } from '@/approvals/approvals';
import { getDeps } from '@/deps';
import type { Approval, Decision } from '@/domain/types';
import { setAgentEnabled } from '@/payments/agentSwitch';
import { fulfil } from '@/payments/fulfil';
import type { PaymentRail } from '@/payments/rail';
import type { Store } from '@/store/store';
import { makeRequest } from '@/test/factories';
import { tempStore } from '@/test/tempStore';
import { PayPalError, type PayPalClient } from './client';
import { createPayPalRail } from './rail';

const now = new Date('2026-12-01T10:00:00Z');
const approve: Decision = { outcome: 'approve', reasons: [], summary: 'ok', checker: 'test' };
const mug = makeRequest({ item: 'White stoneware mug, 350 ml', merchant: 'Hearth & Kiln', category: 'home', total: { minor: 1200, currency: 'USD' } });

type Sent = { method: string; path: string; body?: unknown; requestId?: string };

/** A fake PayPal: records every call. `capture` and `void` can be swapped to fail. */
function fakePayPal(overrides: { capture?: () => unknown; void?: () => unknown } = {}) {
  const sent: Sent[] = [];
  const client: PayPalClient = {
    async request<T>(method: 'GET' | 'POST', path: string, opts: { body?: unknown; requestId?: string } = {}) {
      sent.push({ method, path, ...opts });
      if (path === '/v2/checkout/orders') {
        return { id: 'ORDER1', status: 'COMPLETED', purchase_units: [{ payments: { authorizations: [{ id: 'HOLD1', status: 'CREATED' }] } }] } as T;
      }
      if (path.endsWith('/capture')) return (overrides.capture?.() ?? { id: 'CAP1', status: 'COMPLETED' }) as T;
      if (path.endsWith('/void')) return (overrides.void?.() ?? { id: 'HOLD1', status: 'VOIDED' }) as T;
      throw new Error(`unexpected call ${path}`);
    },
  };
  const captures = () => sent.filter((s) => s.path.endsWith('/capture'));
  return { client, sent, captures };
}

function setup(paypal = fakePayPal(), vaultId: string | null = 'VAULT1') {
  const store = tempStore();
  const rail = createPayPalRail({ store, client: paypal.client, vaultId: () => vaultId, clock: () => now });
  const approval = recordDecision(store, mug, approve, now);
  return { store, rail, approval, paypal };
}

/** The first half of fulfil: open the hold and save it on the purchase, without charging. */
async function openOnly(store: Store, rail: PaymentRail, approval: Approval) {
  const handle = await rail.open(approval);
  store.update((db) => { db.approvals.find((a) => a.id === approval.id)!.payment = { ...handle, provider: rail.name }; });
  return handle;
}

const saved = (store: Store, id: string) => store.read().approvals.find((a) => a.id === id)!;

describe('PayPal rail: open', () => {
  it('holds exactly the approved total on the saved PayPal', async () => {
    const { rail, approval, paypal } = setup();
    const handle = await rail.open(approval);
    expect(paypal.sent).toEqual([{
      method: 'POST', path: '/v2/checkout/orders', requestId: `${approval.id}-open`,
      body: {
        intent: 'AUTHORIZE',
        purchase_units: [{
          reference_id: approval.id, custom_id: approval.id,
          description: 'White stoneware mug, 350 ml at Hearth & Kiln',
          amount: { currency_code: 'USD', value: '12.00' },
        }],
        payment_source: { paypal: { vault_id: 'VAULT1' } },
      },
    }]);
    expect(handle).toEqual({ id: 'HOLD1', label: 'PayPal, held $12' });
  });

  it('refuses to open without a connected PayPal, and fulfil logs it', async () => {
    const { store, rail, approval, paypal } = setup(fakePayPal(), null);
    await expect(rail.open(approval)).rejects.toThrow('PayPal is not connected yet.');
    const result = await fulfil({ store, rail }, approval.id, now);
    expect(result.approved).toBe(false);
    expect(store.read().log.at(-1)?.message).toBe("Couldn't set up the payment: PayPal is not connected yet.");
    expect(paypal.sent).toEqual([]);
  });
});

describe('PayPal rail: charge', () => {
  it('captures the exact amount once, after the payment check approves', async () => {
    const { store, rail, approval, paypal } = setup();
    const result = await fulfil({ store, rail }, approval.id, now);
    expect(result).toEqual({ approved: true, reasons: [], providerRef: 'CAP1' });
    expect(paypal.captures()).toEqual([{
      method: 'POST', path: '/v2/payments/authorizations/HOLD1/capture', requestId: `${approval.id}-capture`,
      body: { amount: { currency_code: 'USD', value: '12.00' }, final_capture: true, invoice_id: approval.id },
    }]);
    expect(saved(store, approval.id).status).toBe('used');
    const log = store.read().log;
    expect(log.slice(-2).map((l) => l.type)).toEqual(['charge_approved', 'paid']);
    expect(log.at(-1)?.message).toBe('PayPal took $12 (capture CAP1).');
  });

  it('a shop asking for $20 more is declined without calling PayPal', async () => {
    const { store, rail, approval, paypal } = setup();
    const handle = await openOnly(store, rail, approval);
    const result = await rail.charge({ handle, amount: { minor: 3200, currency: 'USD' }, merchant: 'Hearth & Kiln' });
    expect(result.approved).toBe(false);
    expect(result.reasons.join(' ')).toContain('more than the approved');
    expect(paypal.captures()).toEqual([]);
  });

  it('another shop asking is declined without calling PayPal', async () => {
    const { store, rail, approval, paypal } = setup();
    const handle = await openOnly(store, rail, approval);
    const result = await rail.charge({ handle, amount: mug.total, merchant: 'Totally Legit Electronics Ltd' });
    expect(result.approved).toBe(false);
    expect(paypal.captures()).toEqual([]);
  });

  it('a second charge is declined without calling PayPal again', async () => {
    const { store, rail, approval, paypal } = setup();
    await fulfil({ store, rail }, approval.id, now);
    const again = await rail.charge({ handle: saved(store, approval.id).payment!, amount: mug.total, merchant: mug.merchant });
    expect(again.approved).toBe(false);
    expect(again.reasons.join(' ')).toContain('already been used');
    expect(paypal.captures()).toHaveLength(1);
  });

  it('a capture that fails after the check approved is reported, and the purchase stays used', async () => {
    const paypal = fakePayPal({ capture: () => { throw new PayPalError('PayPal 422', 422, 'AUTHORIZATION_EXPIRED', 'dbg'); } });
    const { store, rail, approval } = setup(paypal);
    const result = await fulfil({ store, rail }, approval.id, now);
    expect(result.approved).toBe(false);
    expect(result.reasons).toEqual(["PayPal didn't take the payment: AUTHORIZATION_EXPIRED. Nothing was charged."]);
    expect(saved(store, approval.id).status).toBe('used');
    expect(store.read().log.at(-1)).toMatchObject({ type: 'error', approvalId: approval.id });
  });

  it('a retry after a failed capture is refused, and capture is not called again', async () => {
    const paypal = fakePayPal({ capture: () => { throw new PayPalError('PayPal 500', 500, null, null); } });
    const { store, rail, approval } = setup(paypal);
    await fulfil({ store, rail }, approval.id, now);
    const retry = await rail.charge({ handle: saved(store, approval.id).payment!, amount: mug.total, merchant: mug.merchant });
    expect(retry.approved).toBe(false);
    expect(paypal.captures()).toHaveLength(1);
  });

  it('a capture PayPal leaves pending does not count as paid', async () => {
    const paypal = fakePayPal({ capture: () => ({ id: 'CAP2', status: 'PENDING' }) });
    const { store, rail, approval } = setup(paypal);
    const result = await fulfil({ store, rail }, approval.id, now);
    expect(result).toEqual({ approved: false, reasons: ['PayPal is holding the payment for the shop to accept.'] });
    expect(store.read().log.at(-1)).toMatchObject({ type: 'error', message: 'PayPal is holding the payment for the shop to accept.' });
  });
});

describe('PayPal rail: cancel', () => {
  it('voids the hold once', async () => {
    const { rail, paypal } = setup();
    await rail.cancel('HOLD1');
    expect(paypal.sent).toEqual([{ method: 'POST', path: '/v2/payments/authorizations/HOLD1/void', requestId: 'HOLD1-void' }]);
  });

  it('a void failure is logged, not thrown', async () => {
    const paypal = fakePayPal({ void: () => { throw new PayPalError('PayPal 422', 422, 'PREVIOUSLY_CAPTURED', null); } });
    const { store, rail, approval } = setup(paypal);
    await openOnly(store, rail, approval);
    await expect(rail.cancel('HOLD1')).resolves.toBeUndefined();
    expect(store.read().log.at(-1)).toMatchObject({ type: 'error', approvalId: approval.id });
    expect(store.read().log.at(-1)?.message).toContain('PREVIOUSLY_CAPTURED');
  });

  it('the off switch voids open PayPal holds', async () => {
    const { store, rail, approval, paypal } = setup();
    await openOnly(store, rail, approval);
    await setAgentEnabled({ store, rail }, false, now);
    expect(paypal.sent.filter((s) => s.path.endsWith('/void'))).toHaveLength(1);
    expect(saved(store, approval.id).status).toBe('revoked');
  });
});

describe('PAYMENTS switch', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('PAYMENTS=paypal picks the PayPal rail, and needs the keys', async () => {
    process.env.PAYMENTS = 'paypal';
    process.env.PAYPAL_CLIENT_ID = 'id';
    process.env.PAYPAL_CLIENT_SECRET = 'secret';
    expect((await getDeps()).rail.name).toBe('paypal');
    delete process.env.PAYPAL_CLIENT_SECRET;
    await expect(getDeps()).rejects.toThrow('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  });
});
