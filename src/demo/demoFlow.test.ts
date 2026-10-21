import { describe, expect, it } from 'vitest';
import { fixtureSearch } from '@/agent/fixtures';
import { createScriptedShopper } from '@/agent/scriptedShopper';
import { keywordChecker } from '@/checker/keywordChecker';
import { executeRun, startRun, type FlowDeps } from '@/flow/runs';
import { createFakeRail } from '@/payments/fakeRail';
import { emptyDb } from '@/store/store';
import { tempStore } from '@/test/tempStore';
import { SUGGESTED_TASKS, seedDemo } from './demoContent';

/** The offline demo: scripted shopper, keyword checker, fake rail, seeded demo rules. */
async function demoRun(task: string) {
  const store = tempStore();
  const seeded = emptyDb();
  await seedDemo(seeded);
  store.update((db) => { Object.assign(db, seeded); });
  const clock = () => new Date('2026-11-10T10:00:00Z');
  const deps: FlowDeps = { store, clock, fuzzy: keywordChecker, search: fixtureSearch, shopper: createScriptedShopper(clock), rail: createFakeRail(store, clock) };
  const run = startRun(store, task, clock());
  await executeRun(deps, run.id);
  const db = store.read();
  const [approval] = db.approvals;
  return { approval, logTypes: db.log.filter((l) => l.approvalId === approval.id).map((l) => l.type) };
}

describe('offline retail demo', () => {
  const [mug, nephew, headphones] = SUGGESTED_TASKS;

  it('the mug is approved and paid exactly $12', async () => {
    const { approval, logTypes } = await demoRun(mug);
    expect(approval.status).toBe('used');
    expect(approval.request.total).toEqual({ minor: 1200, currency: 'USD' });
    expect(logTypes).toEqual(expect.arrayContaining(['payment_opened', 'charge_approved']));
  });

  it('the present for the nephew waits for the person to decide', async () => {
    const { approval } = await demoRun(nephew);
    expect(approval.status).toBe('pending');
  });

  it('the refurbished headphones are blocked by the new-items rule', async () => {
    const { approval } = await demoRun(headphones);
    expect(approval.status).toBe('blocked');
    expect(approval.decision.reasons.map((r) => r.message).join(' ')).toContain('nothing used or refurbished');
  });
});
