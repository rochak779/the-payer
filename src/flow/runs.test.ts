import { describe, expect, it } from 'vitest';
import { FALLBACK, fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import type { Shopper } from '@/agent/types';
import { keywordChecker } from '@/checker/keywordChecker';
import { createFakeIssuer } from '@/payments/fakeIssuer';
import { tempStore } from '@/test/tempStore';
import { executeRun, startRun, viewRun, type FlowDeps } from './runs';

function deps(): FlowDeps {
  const store = tempStore();
  const clock = () => new Date('2026-11-10T10:00:00Z');
  return { store, clock, fuzzy: keywordChecker, search: fixtureSearch, shopper: createScriptedShopper(clock), issuer: createFakeIssuer(store, clock) };
}

async function runTask(d: FlowDeps, task: string) {
  const run = startRun(d.store, task, d.clock());
  await executeRun(d, run.id);
  return viewRun(d.store.read(), run.id)!;
}

describe('executeRun', () => {
  it('auto-approved task: issues a card, charges it, and finishes', async () => {
    const view = await runTask(deps(), 'Book a hotel in Lisbon');
    expect(view.status).toBe('done');
    expect(view.approvals).toEqual([{ id: expect.any(String), status: 'used', outcome: 'approve' }]);
    expect(view.events.map((e) => e.kind)).toEqual(['status', 'search', 'found', 'found', 'request', 'decision', 'status', 'status']);
  });

  it('task that needs asking: leaves a pending approval and no card', async () => {
    const d = deps();
    d.store.update((db) => { db.rules = [{ id: 'gifts', kind: 'judgement', source: 'Ask me about gifts.', onBreach: 'ask', text: 'Ask me about gifts.' }]; });
    const view = await runTask(d, 'Buy a birthday present for my nephew');
    expect(view.status).toBe('done');
    expect(d.store.read().approvals[0]).toMatchObject({ status: 'pending', card: null });
  });

  it('marks the run failed and records the error if the agent crashes', async () => {
    const broken: Shopper = { name: 'broken', run: async () => { throw new Error('agent crashed'); } };
    const view = await runTask({ ...deps(), shopper: broken }, 'anything');
    expect(view.status).toBe('failed');
    expect(view.events.at(-1)).toMatchObject({ kind: 'error', text: 'agent crashed' });
  });

  it('refuses a third purchase request in one task', async () => {
    const greedy: Shopper = {
      name: 'greedy',
      run: async (_task, tools) => {
        for (let i = 0; i < 3; i++) await tools.requestPurchase({ ...FALLBACK.pick, purchaseDate: '2026-11-10' });
      },
    };
    const d = { ...deps(), shopper: greedy };
    const view = await runTask(d, 'buy books');
    expect(view.status).toBe('failed');
    expect(view.approvals).toHaveLength(2);
    expect(view.events.at(-1)?.text).toContain('Only 2 purchase requests');
  });
});
