import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { createClaudeRuleParser, toRule, type ParsedRule } from './ruleParser';

const blank: ParsedRule = {
  kind: 'judgement', source: 'x', onBreach: 'ask', maxAmount: null, currency: null, per: null, unitLabel: null,
  category: null, mode: null, merchants: null, categories: null, from: null, to: null, text: null,
};

describe('toRule', () => {
  it('builds an amount cap in pence', () => {
    const rule = toRule({ ...blank, kind: 'amount_cap', source: 'Hotels up to £150 a night.', maxAmount: 150, currency: 'GBP', per: 'unit', unitLabel: 'night', category: 'hotel' });
    expect(rule).toMatchObject({ kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', category: 'hotel' });
  });

  it('falls back to a judgement rule (keeping onBreach) when a hard rule is incomplete', () => {
    const rule = toRule({ ...blank, kind: 'amount_cap', source: 'Never spend loads.', onBreach: 'block', maxAmount: null });
    expect(rule).toMatchObject({ kind: 'judgement', text: 'Never spend loads.', onBreach: 'block' });
  });
});

describe('createClaudeRuleParser', () => {
  it('turns a refusal into a readable error', async () => {
    const client = { beta: { messages: { parse: vi.fn().mockResolvedValue({ stop_reason: 'refusal', parsed_output: null }) } } } as unknown as Anthropic;
    await expect(createClaudeRuleParser({ client }).parse('Hotels up to £150.')).rejects.toThrow("Couldn't read those rules");
  });
});
