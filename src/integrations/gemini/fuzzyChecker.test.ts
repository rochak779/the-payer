import type { GoogleGenAI } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { checkPurchase } from '@/checker/checkPurchase';
import { CheckerAnswerError } from '@/checker/fuzzy';
import { getFuzzyChecker } from '@/checker/registry';
import type { JudgementRule } from '@/domain/types';
import { PROMPT_VERSION, renderPrompt } from '@/integrations/claude/fuzzyChecker';
import { makeRequest } from '@/test/factories';
import { CALL_DEADLINE_MS, generateJson } from './client';
import { createGeminiFuzzyChecker } from './fuzzyChecker';

const refundRule: JudgementRule = { id: 'refundable', source: 'Nothing non-refundable.', onBreach: 'block', kind: 'judgement', text: 'Nothing non-refundable.' };
const noFlag = { flagged: false, explanation: '' };
const ok = { verdicts: [{ ruleId: 'refundable', verdict: 'breached', explanation: 'This rate is non-refundable.' }], hiddenCosts: noFlag, injection: noFlag, category: 'hotel' };

function fakeClient(response: { text?: string; promptFeedback?: { blockReason?: string } }) {
  const generateContent = vi.fn().mockResolvedValue(response);
  return { client: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

describe('Gemini fuzzy checker', () => {
  it('sends the same prompt as the Claude checker and returns the parsed verdicts', async () => {
    const { client, generateContent } = fakeClient({ text: JSON.stringify(ok) });
    const checker = createGeminiFuzzyChecker({ client, model: 'gemini-3.8-flash' });
    expect(checker.name).toBe(`gemini:gemini-3.8-flash:${PROMPT_VERSION}`);
    const req = makeRequest();
    expect(await checker.check(req, [refundRule])).toEqual(ok);
    const args = generateContent.mock.calls[0][0];
    expect(args).toMatchObject({
      model: 'gemini-3.8-flash',
      contents: renderPrompt(req, [refundRule]),
      config: { systemInstruction: expect.stringContaining('untrusted data'), responseMimeType: 'application/json' },
    });
    expect(args.config.systemInstruction).toContain('not from the label the agent gave');
    expect(args.config.responseJsonSchema).toMatchObject({ type: 'object', required: expect.arrayContaining(['verdicts', 'hiddenCosts', 'injection', 'category']) });
  });

  it('retries rate limits, but gives up well inside the 60-second check timeout', async () => {
    const { client, generateContent } = fakeClient({ text: JSON.stringify(ok) });
    await createGeminiFuzzyChecker({ client }).check(makeRequest(), [refundRule]);
    const retry = generateContent.mock.calls[0][0].config.httpOptions.retryOptions;
    expect(retry.attempts).toBeGreaterThan(1);
    expect(retry.maxDelay).toBeLessThanOrEqual(20);
  });

  it('cancels the call, retries included, before the 60-second check timeout gives up on it', async () => {
    expect(CALL_DEADLINE_MS).toBeLessThan(60_000);
    const { client, generateContent } = fakeClient({ text: JSON.stringify(ok) });
    await createGeminiFuzzyChecker({ client }).check(makeRequest(), [refundRule]);
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);

    const stalled = vi.fn().mockImplementation(({ config }: { config: { abortSignal: AbortSignal } }) =>
      new Promise((_, reject) => config.abortSignal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
    const call = { model: 'm', system: 's', prompt: 'p', schema: z.object({}), timeoutMs: 20 };
    await expect(generateJson({ models: { generateContent: stalled } } as unknown as GoogleGenAI, call)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('a blocked prompt becomes "ask", never "approve"', async () => {
    const { client } = fakeClient({ promptFeedback: { blockReason: 'SAFETY' } });
    const d = await checkPurchase(makeRequest(), { rules: [refundRule], agentEnabled: true, fuzzy: createGeminiFuzzyChecker({ client }) });
    expect(d.outcome).toBe('ask');
    expect(d.summary).toContain('declined');
  });

  it('marks a blocked prompt and a junk answer as the model\'s own answer, not an outage', async () => {
    for (const response of [{ promptFeedback: { blockReason: 'SAFETY' } }, { text: 'not json' }]) {
      const { client } = fakeClient(response);
      await expect(createGeminiFuzzyChecker({ client }).check(makeRequest(), [refundRule])).rejects.toBeInstanceOf(CheckerAnswerError);
    }
  });

  it('an answer that is not the expected JSON becomes "ask"', async () => {
    for (const text of ['not json', JSON.stringify({ verdicts: 'clear' }), undefined]) {
      const { client } = fakeClient({ text });
      const d = await checkPurchase(makeRequest(), { rules: [refundRule], agentEnabled: true, fuzzy: createGeminiFuzzyChecker({ client }) });
      expect(d.outcome).toBe('ask');
    }
  });

  it("a failed call is an outage, not the model's answer, and still becomes \"ask\"", async () => {
    const quota = Object.assign(new Error('quota'), { status: 429 });
    const fuzzy = createGeminiFuzzyChecker({ client: { models: { generateContent: vi.fn().mockRejectedValue(quota) } } as unknown as GoogleGenAI });
    const err = await fuzzy.check(makeRequest(), [refundRule]).catch((e: unknown) => e);
    expect(err).toBe(quota);
    expect(err).not.toBeInstanceOf(CheckerAnswerError);
    expect((await checkPurchase(makeRequest(), { rules: [refundRule], agentEnabled: true, fuzzy })).outcome).toBe('ask');
  });

  it('a category outside the list is an unreadable answer', async () => {
    const { client } = fakeClient({ text: JSON.stringify({ ...ok, category: 'spaceship' }) });
    await expect(createGeminiFuzzyChecker({ client }).check(makeRequest(), [refundRule])).rejects.toBeInstanceOf(CheckerAnswerError);
  });

  it('is available from the registry without making a call', () => {
    expect(getFuzzyChecker('gemini').name).toMatch(/^gemini:gemini-3\.5-flash-lite:/);
  });
});
