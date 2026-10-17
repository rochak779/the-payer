import { describe, expect, it } from 'vitest';
import { PurchaseRequest } from '@/domain/types';
import { FALLBACK, SCENARIOS, fixtureSearch } from './fixtures';
import { createScriptedShopper } from './scriptedShopper';
import type { ShopperEvent } from './types';

const clock = () => new Date('2026-11-10T09:00:00Z');

describe('scripted shopper', () => {
  it('searches, then asks to buy the scenario that matches the task', async () => {
    const requested: PurchaseRequest[] = [];
    const events: ShopperEvent[] = [];
    await createScriptedShopper(clock).run(
      'Buy a birthday present for my nephew',
      {
        searchWeb: fixtureSearch.search,
        requestPurchase: async (req) => { requested.push(req); return { outcome: 'ask', reasons: [], summary: 'gift', checker: 'test' }; },
      },
      (e) => events.push(e),
    );
    expect(requested).toHaveLength(1);
    expect(requested[0]).toMatchObject({ merchant: 'LEGO', purchaseDate: '2026-11-10' });
    expect(events.map((e) => e.kind)).toEqual(['status', 'search', 'found', 'request', 'status']);
  });

  it('falls back to a default scenario for anything else', async () => {
    const requested: PurchaseRequest[] = [];
    await createScriptedShopper(clock).run('Get me something to read', {
      searchWeb: fixtureSearch.search,
      requestPurchase: async (req) => { requested.push(req); return { outcome: 'approve', reasons: [], summary: '', checker: 'test' }; },
    }, () => {});
    expect(requested[0].merchant).toBe(FALLBACK.pick.merchant);
  });

  it("the canned search answers an AI agent's own wording for the nephew present", async () => {
    const results = await fixtureSearch.search('LEGO Star Wars set around 60 GBP');
    expect(results[0].url).toBe('https://example.com/lego-technic');
  });

  it('every scenario is a valid purchase request', () => {
    for (const s of [...SCENARIOS, FALLBACK]) {
      expect(PurchaseRequest.safeParse({ ...s.pick, purchaseDate: '2026-11-10' }).success).toBe(true);
    }
  });
});
