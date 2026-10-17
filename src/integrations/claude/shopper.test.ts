import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import type { ShopperEvent } from '@/agent/types';
import { createClaudeShopper, toPurchaseRequest } from './shopper';

const input = {
  item: 'Hotel Lisboa Plaza, 2 nights', merchant: 'Hotel Lisboa Plaza', category: 'hotel' as const,
  total_amount: 240.5, currency: 'GBP' as const, units: 2, unit_label: 'night',
  refund_policy: 'Free cancellation until 48 hours before check-in.', url: 'https://example.com/h',
  why: 'Cheapest refundable option.', listing_text: 'x'.repeat(5000),
};

describe('toPurchaseRequest', () => {
  it('converts the tool input into a purchase request in pence', () => {
    const req = toPurchaseRequest(input, '2026-11-10');
    expect(req).toMatchObject({ total: { minor: 24050, currency: 'GBP' }, units: 2, unitLabel: 'night', purchaseDate: '2026-11-10', agentNote: 'Cheapest refundable option.' });
    expect(req.listingText).toHaveLength(4000);
  });

  it('rejects a non-http link from the agent', () => {
    expect(() => toPurchaseRequest({ ...input, url: 'javascript:alert(1)' }, '2026-11-10')).toThrow();
  });
});

describe('Claude shopper run', () => {
  /** Runs the agent with a fake SDK whose tool runner ends on `final`. */
  async function endsWith(final: { stop_reason: string; content: unknown[] }) {
    const toolRunner = vi.fn().mockResolvedValue(final);
    const events: ShopperEvent[] = [];
    const shopper = createClaudeShopper({ client: { beta: { messages: { toolRunner } } } as unknown as Anthropic, clock: () => new Date('2026-11-10T09:00:00Z') });
    await shopper.run('Book a hotel', { searchWeb: vi.fn(), requestPurchase: vi.fn() }, (e) => events.push(e));
    return events.at(-1);
  }

  it('reports its final answer', async () => {
    expect(await endsWith({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Booked.' }] })).toEqual({ kind: 'status', text: 'Booked.' });
  });

  it('says so when it hits its 12-step limit or the length limit, instead of ending silently', async () => {
    const midSearch = [{ type: 'text', text: 'Let me search again.' }, { type: 'tool_use', id: 't1', name: 'search_web', input: { query: 'x' } }];
    expect(await endsWith({ stop_reason: 'tool_use', content: midSearch })).toEqual({ kind: 'status', text: 'Stopped after 12 steps without finding a suitable option.' });
    expect(await endsWith({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'I found' }] })).toEqual({ kind: 'status', text: 'The agent stopped: its answer ran over the length limit. Try the task again.' });
  });
});
