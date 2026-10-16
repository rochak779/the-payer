import { describe, expect, it, vi } from 'vitest';
import type { JudgementRule, Rule } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { checkPurchase, strictest } from './checkPurchase';
import type { FuzzyChecker, FuzzyResult } from './fuzzy';

const refundRule: JudgementRule = { id: 'refundable', source: 'Nothing non-refundable.', onBreach: 'block', kind: 'judgement', text: 'Nothing non-refundable.' };
const giftRule: JudgementRule = { id: 'gifts', source: 'Ask me about gifts.', onBreach: 'ask', kind: 'judgement', text: 'Ask me about gifts.' };
const hotelCap: Rule = { id: 'hotel-cap', source: 'Hotels up to £150 a night.', onBreach: 'ask', kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', category: 'hotel' };
const noRyanair: Rule = { id: 'no-ryanair', source: 'Never book with Ryanair.', onBreach: 'block', kind: 'merchant', mode: 'block', merchants: ['Ryanair'] };

const noFlag = { flagged: false, explanation: '' };
const result = (verdicts: FuzzyResult['verdicts'], extra: Partial<FuzzyResult> = {}): FuzzyResult => ({ verdicts, hiddenCosts: noFlag, injection: noFlag, ...extra });
const stub = (impl: FuzzyChecker['check']): FuzzyChecker => ({ name: 'stub', check: vi.fn(impl) });
const allClear = () =>
  stub(async (_req, rules) => result(rules.filter((r) => r.kind === 'judgement').map((r) => ({ ruleId: r.id, verdict: 'clear' as const, explanation: 'ok' }))));
const ctx = (rules: Rule[], fuzzy: FuzzyChecker, extra: { agentEnabled?: boolean; timeoutMs?: number } = {}) => ({ rules, fuzzy, agentEnabled: true, ...extra });

describe('strictest', () => {
  it('orders approve < ask < block', () => {
    expect(strictest([])).toBe('approve');
    expect(strictest(['approve', 'ask'])).toBe('ask');
    expect(strictest(['ask', 'block', 'approve'])).toBe('block');
  });
});

describe('checkPurchase', () => {
  it('approves when code and AI find nothing', async () => {
    const d = await checkPurchase(makeRequest(), ctx([hotelCap, refundRule], allClear()));
    expect(d).toMatchObject({ outcome: 'approve', summary: 'Within all your rules.', checker: 'stub' });
  });

  it('blocks everything when the agent is off, without calling the AI', async () => {
    const fuzzy = allClear();
    const d = await checkPurchase(makeRequest(), ctx([], fuzzy, { agentEnabled: false }));
    expect(d.outcome).toBe('block');
    expect(fuzzy.check).not.toHaveBeenCalled();
  });

  it('skips the AI when code already blocks', async () => {
    const fuzzy = allClear();
    const d = await checkPurchase(makeRequest({ merchant: 'Ryanair', category: 'flight' }), ctx([noRyanair, refundRule], fuzzy));
    expect(d.outcome).toBe('block');
    expect(fuzzy.check).not.toHaveBeenCalled();
  });

  it("uses the rule's own outcome when the AI says breached", async () => {
    const fuzzy = stub(async () => result([
      { ruleId: 'refundable', verdict: 'breached', explanation: 'This rate is non-refundable.' },
      { ruleId: 'gifts', verdict: 'clear', explanation: '' },
    ]));
    const d = await checkPurchase(makeRequest(), ctx([refundRule, giftRule], fuzzy));
    expect(d.outcome).toBe('block');
    expect(d.reasons).toContainEqual({ ruleId: 'refundable', by: 'ai', outcome: 'block', message: 'This rate is non-refundable.' });
  });

  it('asks (not blocks) when the AI is unsure, even on a block rule', async () => {
    const fuzzy = stub(async () => result([{ ruleId: 'refundable', verdict: 'unsure', explanation: 'No policy shown.' }]));
    expect((await checkPurchase(makeRequest(), ctx([refundRule], fuzzy))).outcome).toBe('ask');
  });

  it('takes the strictest answer when the AI gives one rule two verdicts', async () => {
    const fuzzy = stub(async () => result([
      { ruleId: 'refundable', verdict: 'clear', explanation: 'Looks fine.' },
      { ruleId: 'refundable', verdict: 'breached', explanation: 'Non-refundable rate.' },
    ]));
    const d = await checkPurchase(makeRequest(), ctx([refundRule], fuzzy));
    expect(d.outcome).toBe('block');
  });

  it('asks when the AI skips a rule', async () => {
    const fuzzy = stub(async () => result([]));
    expect((await checkPurchase(makeRequest(), ctx([refundRule], fuzzy))).outcome).toBe('ask');
  });

  it('ignores verdicts about rules that do not exist', async () => {
    const fuzzy = stub(async () => result([
      { ruleId: 'made-up', verdict: 'breached', explanation: 'x' },
      { ruleId: 'refundable', verdict: 'clear', explanation: '' },
    ]));
    expect((await checkPurchase(makeRequest(), ctx([refundRule], fuzzy))).outcome).toBe('approve');
  });

  it('never loosens a code "ask"', async () => {
    const d = await checkPurchase(makeRequest({ total: { minor: 31000, currency: 'GBP' } }), ctx([hotelCap, refundRule], allClear()));
    expect(d.outcome).toBe('ask');
  });

  it('asks when the AI checker throws', async () => {
    const fuzzy = stub(async () => { throw new Error('network down'); });
    const d = await checkPurchase(makeRequest(), ctx([refundRule], fuzzy));
    expect(d.outcome).toBe('ask');
    expect(d.summary).toContain('network down');
  });

  it('asks when the AI checker hangs past the timeout', async () => {
    const fuzzy = stub(() => new Promise<FuzzyResult>(() => {}));
    const d = await checkPurchase(makeRequest(), ctx([refundRule], fuzzy, { timeoutMs: 20 }));
    expect(d.outcome).toBe('ask');
    expect(d.summary).toContain('timed out');
  });

  it('asks on a hidden-cost or injection flag', async () => {
    const flagged = { flagged: true, explanation: 'City tax is extra.' };
    const fuzzy = stub(async () => result([{ ruleId: 'refundable', verdict: 'clear', explanation: '' }], { hiddenCosts: flagged }));
    expect((await checkPurchase(makeRequest(), ctx([refundRule], fuzzy))).outcome).toBe('ask');
    const fuzzy2 = stub(async () => result([{ ruleId: 'refundable', verdict: 'clear', explanation: '' }], { injection: flagged }));
    expect((await checkPurchase(makeRequest(), ctx([refundRule], fuzzy2))).outcome).toBe('ask');
  });

  describe("when the checker reads the purchase as a different category from the agent's label", () => {
    const noGiftCards: Rule = { id: 'no-gift-cards', source: 'No gift cards.', onBreach: 'block', kind: 'category', mode: 'block', categories: ['gift_card'] };
    const readsAs = (category: FuzzyResult['category']) => stub(async () => result([], { category }));

    it('applies the category rule the label dodged', async () => {
      const req = makeRequest({ item: '£50 gift card', merchant: 'Amazon', category: 'other' });
      const d = await checkPurchase(req, ctx([noGiftCards], readsAs('gift_card')));
      expect(d.outcome).toBe('block');
      expect(d.summary).toContain('The agent filed this under "Other", but it belongs under "Gift cards". You said no gift cards.');
      expect(d.reasons).toContainEqual(expect.objectContaining({ ruleId: 'no-gift-cards', by: 'ai' }));
    });

    it('applies a price cap that only covers the real category', async () => {
      const req = makeRequest({ category: 'other', total: { minor: 38000, currency: 'GBP' }, units: 2, unitLabel: 'night' });
      const d = await checkPurchase(req, ctx([hotelCap], readsAs('hotel')));
      expect(d.outcome).toBe('ask');
      expect(d.summary).toContain('over your £150 limit');
    });

    it('changes nothing when the reading breaks no rule', async () => {
      const d = await checkPurchase(makeRequest({ category: 'other' }), ctx([noGiftCards], readsAs('home')));
      expect(d.outcome).toBe('approve');
    });

    it('never removes a breach the label caused', async () => {
      const req = makeRequest({ category: 'gift_card' });
      const d = await checkPurchase(req, ctx([noGiftCards], readsAs('home')));
      expect(d.outcome).toBe('block');
    });
  });
});
