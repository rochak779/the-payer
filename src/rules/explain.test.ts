import { describe, expect, it } from 'vitest';
import { checkedBy, explainRule } from './explain';

describe('explainRule', () => {
  it('explains each kind of rule in one plain line', () => {
    expect(explainRule({ id: 'a', source: '', onBreach: 'ask', kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', unitLabel: 'night', category: 'hotel' }))
      .toBe("Hotels over £150 per night → I'll ask you first.");
    expect(explainRule({ id: 'b', source: '', onBreach: 'block', kind: 'amount_cap', max: { minor: 40000, currency: 'GBP' }, per: 'purchase' }))
      .toBe("Any purchase over £400 → I'll block it.");
    expect(explainRule({ id: 'c', source: '', onBreach: 'block', kind: 'category', mode: 'block', categories: ['gift_card'] }))
      .toBe("Gift cards → I'll block it.");
    expect(explainRule({ id: 'd', source: '', onBreach: 'block', kind: 'merchant', mode: 'block', merchants: ['Ryanair'] }))
      .toBe("Buying from Ryanair → I'll block it.");
    expect(explainRule({ id: 'e', source: '', onBreach: 'block', kind: 'date_window', from: '2026-11-01', to: '2026-12-31' }))
      .toBe("Buying outside 2026-11-01 to 2026-12-31 → I'll block it.");
    expect(explainRule({ id: 'f', source: '', onBreach: 'block', kind: 'judgement', text: 'Nothing non-refundable.' }))
      .toContain("if it clearly applies, I'll block it; if I'm not sure, I'll ask you");
  });

  it('says who checks the rule', () => {
    expect(checkedBy({ id: 'g', source: '', onBreach: 'ask', kind: 'judgement', text: 'x' })).toBe('Judgement · checked by AI');
    expect(checkedBy({ id: 'h', source: '', onBreach: 'block', kind: 'category', mode: 'block', categories: ['gift_card'] })).toBe('Hard limit · checked by code');
  });
});
