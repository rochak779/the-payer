import { describe, expect, it } from 'vitest';
import { recordDecision } from '@/approvals/approvals';
import type { Decision } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { tempStore } from '@/test/tempStore';
import { setAgentEnabled } from './agentSwitch';
import { createFakeIssuer } from './fakeIssuer';
import { fulfil } from './fulfil';

const now = new Date('2026-11-10T10:00:00Z');
const approve: Decision = { outcome: 'approve', reasons: [], summary: 'ok', checker: 'test' };

describe('fulfil', () => {
  it('issues a card, charges the exact amount, and marks the purchase used', async () => {
    const store = tempStore();
    const issuer = createFakeIssuer(store, () => now);
    const a = recordDecision(store, makeRequest(), approve, now);
    expect((await fulfil({ store, issuer }, a.id, now)).approved).toBe(true);
    const saved = store.read().approvals[0];
    expect(saved.status).toBe('used');
    expect(saved.card).toMatchObject({ provider: 'fake' });
    expect(store.read().log.map((l) => l.type)).toEqual(['decision', 'card_issued', 'charge_approved']);
  });

  it('refuses to fulfil a purchase that is not approved', async () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), { ...approve, outcome: 'ask' }, now);
    await expect(fulfil({ store, issuer: createFakeIssuer(store) }, a.id, now)).rejects.toThrow('not approved');
  });

  it('logs and returns a decline if the card cannot be created', async () => {
    const store = tempStore();
    const issuer = { ...createFakeIssuer(store), issueCard: async () => { throw new Error('issuing disabled'); } };
    const a = recordDecision(store, makeRequest(), approve, now);
    const result = await fulfil({ store, issuer }, a.id, now);
    expect(result.approved).toBe(false);
    expect(result.reasons[0]).toContain('issuing disabled');
    expect(store.read().log.at(-1)?.type).toBe('error');
  });
});

describe('setAgentEnabled', () => {
  it('turning off revokes open purchases, cancels their cards, and blocks later charges', async () => {
    const store = tempStore();
    const cancelled: string[] = [];
    const issuer = { ...createFakeIssuer(store, () => now), cancelCard: async (id: string) => { cancelled.push(id); } };
    const open = recordDecision(store, makeRequest(), approve, now);
    recordDecision(store, makeRequest(), { ...approve, outcome: 'ask' }, now);
    store.update((db) => { db.approvals[0].card = { id: 'card_x', last4: '1234', provider: 'fake' }; });

    await setAgentEnabled({ store, issuer }, false, now);

    const db = store.read();
    expect(db.settings.agentEnabled).toBe(false);
    expect(db.approvals.map((a) => a.status)).toEqual(['revoked', 'revoked']);
    expect(cancelled).toEqual(['card_x']);
    const charge = await issuer.simulateCharge({ card: { id: 'card_x', last4: '1234' }, amount: open.request.total, merchant: open.request.merchant });
    expect(charge.approved).toBe(false);
    expect(charge.reasons).toContain('The agent is turned off.');
  });

  it('turning back on only flips the switch', async () => {
    const store = tempStore();
    const issuer = createFakeIssuer(store);
    await setAgentEnabled({ store, issuer }, false, now);
    await setAgentEnabled({ store, issuer }, true, now);
    expect(store.read().settings.agentEnabled).toBe(true);
    expect(store.read().log.map((l) => l.type)).toEqual(['agent_off', 'agent_on']);
  });
});
