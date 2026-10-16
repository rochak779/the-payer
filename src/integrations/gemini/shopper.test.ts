import { GenerateContentResponse, type GoogleGenAI, type Part } from '@google/genai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SearchResult, ShopperEvent, ShopperTools } from '@/agent/types';
import type { Decision } from '@/domain/types';
import { getDeps } from '@/deps';
import { systemPrompt, toPurchaseRequest } from '@/integrations/claude/shopper';
import { RETRY } from './client';
import { createGeminiShopper } from './shopper';

const today = '2026-11-01';
const clock = () => new Date(`${today}T10:00:00Z`);

const purchase = {
  item: 'Hotel Lisboa Plaza, 2 nights', merchant: 'Hotel Lisboa Plaza', category: 'hotel',
  total_amount: 240.5, currency: 'GBP', units: 2, unit_label: 'night',
  refund_policy: 'Free cancellation until 48 hours before check-in.', url: 'https://example.com/h',
  why: 'Cheapest refundable option.', listing_text: 'Total £240.50 incl. taxes. Free cancellation.',
};
const results: SearchResult[] = [{ title: 'Hotel Lisboa Plaza', url: 'https://example.com/h', snippet: '£120 a night' }];
const approve: Decision = { outcome: 'approve', reasons: [], summary: 'Fits your rules.', checker: 'keyword-baseline' };

/** A real SDK response object, so `functionCalls` is the SDK's own getter. */
function reply(parts: Part[], extra: Partial<GenerateContentResponse> = {}): GenerateContentResponse {
  return Object.assign(new GenerateContentResponse(), { candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }], ...extra });
}
const call = (name: string, args: Record<string, unknown>): Part => ({ functionCall: { name, args } });

function setup(replies: GenerateContentResponse[]) {
  const generateContent = vi.fn();
  for (const r of replies) generateContent.mockResolvedValueOnce(r);
  const tools = {
    searchWeb: vi.fn<ShopperTools['searchWeb']>().mockResolvedValue(results),
    requestPurchase: vi.fn<ShopperTools['requestPurchase']>().mockResolvedValue(approve),
  };
  const events: ShopperEvent[] = [];
  const shopper = createGeminiShopper({ client: { models: { generateContent } } as unknown as GoogleGenAI, model: 'gemini-test', clock });
  const run = () => shopper.run('Book a hotel in Lisbon, 7–9 Nov', tools, (e) => events.push(e));
  return { generateContent, tools, events, shopper, run };
}

/** The parts of the last message sent in model call `n` (0-based). */
const lastSent = (generateContent: ReturnType<typeof vi.fn>, n: number): Part[] => generateContent.mock.calls[n][0].contents.at(-1).parts;

describe('Gemini shopper', () => {
  it('searches, asks to buy one option, and reports the answer', async () => {
    const searchTurn: Part[] = [{ ...call('search_web', { query: 'Lisbon hotel 7-9 Nov' }), thoughtSignature: 'sig-1' }];
    const { generateContent, tools, events, run } = setup([
      reply(searchTurn),
      reply([call('request_purchase', purchase)]),
      reply([{ text: 'Booked Hotel Lisboa Plaza.' }]),
    ]);
    await run();

    expect(tools.searchWeb).toHaveBeenCalledWith('Lisbon hotel 7-9 Nov');
    expect(tools.requestPurchase).toHaveBeenCalledWith(toPurchaseRequest(purchase as Parameters<typeof toPurchaseRequest>[0], today));
    expect(events).toEqual([
      { kind: 'status', text: 'Looking for options…' },
      { kind: 'search', text: 'Lisbon hotel 7-9 Nov' },
      { kind: 'found', text: 'Hotel Lisboa Plaza (https://example.com/h)' },
      { kind: 'request', text: 'Asking to buy Hotel Lisboa Plaza, 2 nights at Hotel Lisboa Plaza for £240.50' },
      { kind: 'status', text: 'Booked Hotel Lisboa Plaza.' },
    ]);

    // The model's turn goes back unchanged (Gemini needs its thought signature), followed by the tool's answer.
    const second = generateContent.mock.calls[1][0].contents;
    expect(second[1]).toEqual({ role: 'model', parts: searchTurn });
    expect(second[2]).toEqual({ role: 'user', parts: [{ functionResponse: { name: 'search_web', response: { output: results } } }] });
    expect(lastSent(generateContent, 2)).toEqual([
      { functionResponse: { name: 'request_purchase', response: { output: { outcome: 'approve', reason: 'Fits your rules.' } } } },
    ]);
  });

  it('gets exactly two tools and the Claude agent instructions, with rate-limit retries', async () => {
    const { generateContent, shopper, run } = setup([reply([{ text: 'Nothing suitable.' }])]);
    await run();
    expect(shopper.name).toBe('gemini:gemini-test');
    const { model, config } = generateContent.mock.calls[0][0];
    expect(model).toBe('gemini-test');
    expect(config.systemInstruction).toBe(systemPrompt(today));
    expect(config.httpOptions.retryOptions).toEqual(RETRY);
    const declarations = config.tools.flatMap((t: { functionDeclarations: unknown[] }) => t.functionDeclarations);
    expect(declarations.map((d: { name: string }) => d.name)).toEqual(['search_web', 'request_purchase']);
    const schema = declarations[1].parametersJsonSchema;
    expect(schema).not.toHaveProperty('$schema');
    expect(schema).toMatchObject({ type: 'object', required: expect.arrayContaining(['item', 'merchant', 'total_amount', 'currency', 'url']) });
  });

  it('a malformed purchase request goes back to the agent as an error and is never checked', async () => {
    const { generateContent, tools, events, run } = setup([
      reply([call('request_purchase', { ...purchase, url: 'javascript:alert(1)' })]),
      reply([{ text: 'Stopped.' }]),
    ]);
    await run();
    expect(tools.requestPurchase).not.toHaveBeenCalled();
    const [part] = lastSent(generateContent, 1);
    expect(part.functionResponse).toMatchObject({ name: 'request_purchase', response: { error: expect.any(String) } });
    expect(events.at(-1)).toEqual({ kind: 'status', text: 'Stopped.' });
  });

  it('an unknown tool goes back to the agent as an error', async () => {
    const { generateContent, run } = setup([reply([call('get_card_number', {})]), reply([{ text: 'OK.' }])]);
    await run();
    expect(lastSent(generateContent, 1)).toEqual([
      { functionResponse: { name: 'get_card_number', response: { error: "Tool 'get_card_number' not found" } } },
    ]);
  });

  it('stops after 12 model calls and says so', async () => {
    const generateContent = vi.fn().mockImplementation(async () => reply([call('search_web', { query: 'again' })]));
    const tools = { searchWeb: vi.fn().mockResolvedValue([]), requestPurchase: vi.fn() };
    const events: ShopperEvent[] = [];
    const shopper = createGeminiShopper({ client: { models: { generateContent } } as unknown as GoogleGenAI, clock });
    await shopper.run('Book a hotel', tools, (e) => events.push(e));
    expect(generateContent).toHaveBeenCalledTimes(12);
    expect(events.at(-1)).toEqual({ kind: 'status', text: 'Stopped after 12 steps without finding a suitable option.' });
  });

  it('a blocked prompt or a safety stop fails the run', async () => {
    const blocked = reply([], { candidates: undefined, promptFeedback: { blockReason: 'SAFETY' } } as Partial<GenerateContentResponse>);
    const safety = Object.assign(new GenerateContentResponse(), { candidates: [{ finishReason: 'SAFETY' }] });
    for (const r of [blocked, safety]) {
      const { run } = setup([r]);
      await expect(run()).rejects.toThrow('The agent declined this task.');
    }
  });
});

describe('SHOPPER switch', () => {
  const before = process.env.SHOPPER;
  afterEach(() => {
    if (before === undefined) delete process.env.SHOPPER;
    else process.env.SHOPPER = before;
  });

  it('SHOPPER=gemini picks the Gemini agent', () => {
    process.env.SHOPPER = 'gemini';
    expect(getDeps().shopper.name).toMatch(/^gemini:/);
  });
});
