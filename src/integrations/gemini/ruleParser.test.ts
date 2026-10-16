import type { GoogleGenAI } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { getRuleParser } from '@/rules/registry';
import { createGeminiRuleParser } from './ruleParser';

const nulls = { maxAmount: null, currency: null, per: null, unitLabel: null, category: null, mode: null, merchants: null, categories: null, from: null, to: null, text: null };

function fakeClient(response: { text?: string; promptFeedback?: { blockReason?: string } }) {
  const generateContent = vi.fn().mockResolvedValue(response);
  return { client: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

describe('Gemini rule reader', () => {
  it('turns the parsed rules into app rules, using the Claude reader instructions', async () => {
    const parsed = { rules: [{ ...nulls, kind: 'amount_cap', source: 'Hotels up to £150 a night.', onBreach: 'ask', maxAmount: 150, currency: 'GBP', per: 'unit', unitLabel: 'night', category: 'hotel' }] };
    const { client, generateContent } = fakeClient({ text: JSON.stringify(parsed) });
    const rules = await createGeminiRuleParser({ client, today: () => '2026-10-16' }).parse('Hotels up to £150 a night.');
    expect(rules).toMatchObject([{ kind: 'amount_cap', max: { minor: 15000, currency: 'GBP' }, per: 'unit', category: 'hotel' }]);
    const args = generateContent.mock.calls[0][0];
    expect(args.contents).toContain('Today is 2026-10-16.');
    expect(args.config).toMatchObject({ systemInstruction: expect.stringContaining('structured rules'), responseMimeType: 'application/json' });
  });

  it('a blocked or unreadable answer asks the person to rephrase', async () => {
    for (const response of [{ promptFeedback: { blockReason: 'SAFETY' } }, { text: 'not json' }]) {
      const { client } = fakeClient(response);
      await expect(createGeminiRuleParser({ client }).parse('x')).rejects.toThrow("Couldn't read those rules");
    }
  });

  it('is available from the registry', () => {
    expect(getRuleParser('gemini').name).toBe('gemini:gemini-3.8-flash');
  });
});
