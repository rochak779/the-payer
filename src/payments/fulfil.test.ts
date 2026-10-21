import { describe, expect, it } from 'vitest';
import { recordDecision } from '@/approvals/approvals';
import type { Decision } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { tempStore } from '@/test/tempStore';
import { setAgentEnabled } from './agentSwitch';
import { createFakeRail } from './fakeRail';
import { fulfil } from './fulfil';

const now = new Date('2026-11-10T10:00:00Z');
const approve: Decision = { outcome: 'approve', reasons: [], summary: 'ok', checker: 'test' };

describe('fulfil', () => {
  it('sets up a payment, charges the exact amount, and marks the purchase used', async () => {
    const store = tempStore();
    const rail = createFakeRail(store, () => now);
    const a = recordDecision(store, makeRequest(), approve, now);
    expect((await fulfil({ store, rail }, a.id, now)).approved).toBe(true);
    const saved = store.read().approvals[0];
    expect(saved.status).toBe('used');
    expect(saved.payment).toMatchObject({ provider: 'fake', label: 'Offline test payment' });
    expect(store.read().log.map((l) => l.type)).toEqual(['decision', 'payment_opened', 'charge_approved']);
    expect(store.read().log[1].message).toBe('Offline test payment: set up for exactly £240 at Hotel Lisboa Plaza.');
  });

  it('refuses to fulfil a purchase that is not approved', async () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), { ...approve, outcome: 'ask' }, now);
    await expect(fulfil({ store, rail: createFakeRail(store) }, a.id, now)).rejects.toThrow('not approved');
  });

  it('logs and returns a decline if the payment cannot be set up', async () => {
    const store = tempStore();
    const rail = { ...createFakeRail(store), open: async () => { throw new Error('issuing disabled'); } };
    const a = recordDecision(store, makeRequest(), approve, now);
    const result = await fulfil({ store, rail }, a.id, now);
    expect(result.approved).toBe(false);
    expect(result.reasons[0]).toBe("Couldn't set up the payment: issuing disabled");
    expect(store.read().log.at(-1)?.type).toBe('error');
  });
});

describe('setAgentEnabled', () => {
  it('turning off revokes open purchases, cancels their payments, and blocks later charges', async () => {
    const store = tempStore();
    const cancelled: string[] = [];
    const rail = { ...createFakeRail(store, () => now), cancel: async (id: string) => { cancelled.push(id); } };
    const open = recordDecision(store, makeRequest(), approve, now);
    recordDecision(store, makeRequest(), { ...approve, outcome: 'ask' }, now);
    store.update((db) => { db.approvals[0].payment = { id: 'pay_x', label: 'Offline test payment', provider: 'fake' }; });

    await setAgentEnabled({ store, rail }, false, now);

    const db = store.read();
    expect(db.settings.agentEnabled).toBe(false);
    expect(db.approvals.map((a) => a.status)).toEqual(['revoked', 'revoked']);
    expect(cancelled).toEqual(['pay_x']);
    const charge = await rail.charge({ handle: { id: 'pay_x', label: 'Offline test payment' }, amount: open.request.total, merchant: open.request.merchant });
    expect(charge.approved).toBe(false);
    expect(charge.reasons).toContain('The agent is turned off.');
  });

  it('turning back on only flips the switch', async () => {
    const store = tempStore();
    const rail = createFakeRail(store);
    await setAgentEnabled({ store, rail }, false, now);
    await setAgentEnabled({ store, rail }, true, now);
    expect(store.read().settings.agentEnabled).toBe(true);
    expect(store.read().log.map((l) => l.type)).toEqual(['agent_off', 'agent_on']);
  });
});
