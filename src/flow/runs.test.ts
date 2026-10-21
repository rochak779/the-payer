import { describe, expect, it } from 'vitest';
import { FALLBACK, fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import type { Shopper } from '@/agent/types';
import { keywordChecker } from '@/checker/keywordChecker';
import { formatMoney } from '@/domain/money';
import { createFakeRail } from '@/payments/fakeRail';
import { tempStore } from '@/test/tempStore';
import { executeRun, startRun, viewRun, type FlowDeps } from './runs';

function deps(): FlowDeps {
  const store = tempStore();
  const clock = () => new Date('2026-11-10T10:00:00Z');
  return { store, clock, fuzzy: keywordChecker, search: fixtureSearch, shopper: createScriptedShopper(clock), rail: createFakeRail(store, clock) };
}

async function runTask(d: FlowDeps, task: string) {
  const run = startRun(d.store, task, d.clock());
  await executeRun(d, run.id);
  return viewRun(d.store.read(), run.id)!;
}

describe('executeRun', () => {
  it('auto-approved task: sets up a payment, charges it, and finishes', async () => {
    const view = await runTask(deps(), 'Book a hotel in Lisbon');
    expect(view.status).toBe('done');
    // Enough of each purchase for the Ask screen to print its receipt, without the listing's raw text.
    expect(view.approvals).toEqual([{
      id: expect.any(String), status: 'used', outcome: 'approve',
      item: expect.stringContaining('Hotel Lisboa Plaza'), merchant: 'Hotel Lisboa Plaza', total: { minor: 24000, currency: 'GBP' },
      summary: 'Within all your rules.', reasons: [], paymentLabel: 'Offline test payment',
    }]);
    expect(view.events.map((e) => e.kind)).toEqual(['status', 'search', 'found', 'found', 'request', 'decision', 'status', 'status']);
    expect(view.events.map((e) => e.text)).toContain('Paid £240, once, for this purchase only.');
  });

  it('task that needs asking: leaves a pending approval and no payment', async () => {
    const d = deps();
    d.store.update((db) => { db.rules = [{ id: 'gifts', kind: 'judgement', source: 'Ask me about gifts.', onBreach: 'ask', text: 'Ask me about gifts.' }]; });
    const view = await runTask(d, 'Buy a birthday present for my nephew');
    expect(view.status).toBe('done');
    expect(d.store.read().approvals[0]).toMatchObject({ status: 'pending', payment: null });
  });

  it('marks the run failed and records the error if the agent crashes', async () => {
    const broken: Shopper = { name: 'broken', run: async () => { throw new Error('agent crashed'); } };
    const view = await runTask({ ...deps(), shopper: broken }, 'anything');
    expect(view.status).toBe('failed');
    expect(view.events.at(-1)).toMatchObject({ kind: 'error', text: 'agent crashed' });
  });

  it("explains a service failure in plain English, not the service's raw error", async () => {
    const quota = Object.assign(new Error('{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}'), { status: 429 });
    const outage = Object.assign(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'), { status: 503 });
    const slow = Object.assign(new Error('This operation was aborted'), { name: 'AbortError' });
    const cases: [Error, string][] = [
      [quota, 'The agent stopped: a service it uses is over its usage limit. Try again later.'],
      [outage, 'The agent stopped: a service it uses returned an error (HTTP 503). Try again later.'],
      [slow, "The agent stopped: a service it uses didn't answer in time. Try again later."],
    ];
    for (const [err, text] of cases) {
      const view = await runTask({ ...deps(), shopper: { name: 'x', run: async () => { throw err; } } }, 'anything');
      expect(view.status).toBe('failed');
      expect(view.events.at(-1)).toMatchObject({ kind: 'error', text });
    }
  });

  it('refuses a third purchase request in one task', async () => {
    const greedy: Shopper = {
      name: 'greedy',
      run: async (_task, tools) => {
        // Different prices, so these are three different purchases, not repeats of one.
        for (let i = 0; i < 3; i++) await tools.requestPurchase({ ...FALLBACK.pick, total: { minor: 3500 + i * 100, currency: 'GBP' }, purchaseDate: '2026-11-10' });
      },
    };
    const d = { ...deps(), shopper: greedy };
    const view = await runTask(d, 'buy books');
    expect(view.status).toBe('failed');
    expect(view.approvals).toHaveLength(2);
    expect(view.events.at(-1)?.text).toContain('Only 2 purchase requests');
  });

  describe('double booking', () => {
    const book = { ...FALLBACK.pick, purchaseDate: '2026-11-10' };

    it('never buys the same thing twice in one task, even reworded', async () => {
      const decisions: string[] = [];
      const repeater: Shopper = {
        name: 'repeater',
        run: async (_task, tools) => {
          decisions.push((await tools.requestPurchase(book)).outcome);
          decisions.push((await tools.requestPurchase({ ...book, item: `${book.item} (paperback)`, merchant: book.merchant.toUpperCase() })).outcome);
        },
      };
      const d = { ...deps(), shopper: repeater };
      const view = await runTask(d, 'buy a book');
      expect(decisions).toEqual(['approve', 'block']);
      expect(view.approvals).toEqual([expect.objectContaining({ status: 'used', outcome: 'approve' })]);
      expect(view.events.filter((e) => e.text === `Paid ${formatMoney(book.total)}, once, for this purchase only.`)).toHaveLength(1);
      expect(view.events.at(-1)?.text).toContain('Not buying it twice');
    });

    it('does not retry into a second booking when a charge fails part-way', async () => {
      const d = deps();
      let failures = 0;
      const flaky = { ...d.rail, charge: async (...args: Parameters<typeof d.rail.charge>) => {
        if (failures++ === 0) throw new Error('network error after the charge');
        return d.rail.charge(...args);
      } };
      const retrier: Shopper = {
        name: 'retrier',
        run: async (_task, tools) => {
          await tools.requestPurchase(book).catch(() => tools.requestPurchase(book));
        },
      };
      const view = await runTask({ ...d, rail: flaky, shopper: retrier }, 'buy a book');
      expect(view.approvals).toHaveLength(1);
      expect(failures).toBe(1);
    });

    it('still allows two different purchases in one task', async () => {
      const two: Shopper = {
        name: 'two',
        run: async (_task, tools) => {
          await tools.requestPurchase(book);
          await tools.requestPurchase({ ...book, item: 'Clean Code', total: { minor: 3000, currency: 'GBP' } });
        },
      };
      const view = await runTask({ ...deps(), shopper: two }, 'buy two books');
      expect(view.approvals.map((a) => a.status)).toEqual(['used', 'used']);
    });
  });
});
