import type { Content, FunctionCall, GoogleGenAI, Part } from '@google/genai';
import { z } from 'zod';
import type { Shopper } from '@/agent/types';
import { formatMoney } from '@/domain/money';
import { MAX_STEPS, PurchaseInput, STOP_NOTE, SearchInput, TOOL_DESCRIPTIONS, systemPrompt, toPurchaseRequest } from '@/integrations/claude/shopper';
import { CALL_DEADLINE_MS, GEMINI_MODEL, RETRY, gemini, geminiJsonSchema } from './client';

/** Finish reasons that mean the model refused, like Claude's `refusal` stop reason. */
const REFUSED = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII']);

/** Why the agent stopped, when it ended without finishing its answer. */
function stopNote(reason: string): string {
  if (reason === 'MAX_TOKENS') return STOP_NOTE.tooLong;
  if (reason === 'MALFORMED_FUNCTION_CALL' || reason === 'UNEXPECTED_TOOL_CALL') return STOP_NOTE.unreadable;
  return STOP_NOTE.other(reason);
}

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * The Claude agent on Gemini: same instructions, same two tools, same limits. Claude's SDK runs the tool
 * loop itself; here it is written out. A tool error goes back to the model as an error, as Claude's runner does.
 */
export function createGeminiShopper(opts: { model?: string; client?: GoogleGenAI; clock?: () => Date; callTimeoutMs?: number } = {}): Shopper {
  const model = opts.model ?? GEMINI_MODEL;
  return {
    name: `gemini:${model}`,
    async run(task, tools, emit) {
      const today = (opts.clock?.() ?? new Date()).toISOString().slice(0, 10);

      const handlers = new Map<string, Handler>([
        ['search_web', async (args) => {
          const { query } = SearchInput.parse(args);
          emit({ kind: 'search', text: query });
          const results = await tools.searchWeb(query);
          for (const r of results) emit({ kind: 'found', text: `${r.title} (${r.url})` });
          return results;
        }],
        ['request_purchase', async (args) => {
          const req = toPurchaseRequest(PurchaseInput.parse(args), today);
          emit({ kind: 'request', text: `Asking to buy ${req.item} at ${req.merchant} for ${formatMoney(req.total)}` });
          const decision = await tools.requestPurchase(req);
          return { outcome: decision.outcome, reason: decision.summary };
        }],
      ]);

      const config = {
        systemInstruction: systemPrompt(today),
        tools: [{
          functionDeclarations: [
            { name: 'search_web', description: TOOL_DESCRIPTIONS.search_web, parametersJsonSchema: geminiJsonSchema(SearchInput) },
            { name: 'request_purchase', description: TOOL_DESCRIPTIONS.request_purchase, parametersJsonSchema: geminiJsonSchema(PurchaseInput) },
          ],
        }],
        httpOptions: { retryOptions: RETRY },
      };
      const contents: Content[] = [{ role: 'user', parts: [{ text: task }] }];
      const client = opts.client ?? gemini();

      emit({ kind: 'status', text: 'Looking for options…' });
      for (let i = 0; i < MAX_STEPS; i++) {
        const abortSignal = AbortSignal.timeout(opts.callTimeoutMs ?? CALL_DEADLINE_MS);
        const response = await client.models.generateContent({ model, contents, config: { ...config, abortSignal } });
        const candidate = response.candidates?.[0];
        if (response.promptFeedback?.blockReason || REFUSED.has(candidate?.finishReason ?? '')) {
          throw new Error('The agent declined this task.');
        }
        const calls = response.functionCalls;
        if (!calls || !candidate?.content) {
          const reason = candidate?.finishReason;
          if (reason && reason !== 'STOP') return emit({ kind: 'status', text: stopNote(reason) });
          const text = (candidate?.content?.parts ?? []).flatMap((p) => (p.text && !p.thought ? [p.text] : [])).join('').trim();
          if (text) emit({ kind: 'status', text });
          return;
        }
        // The model's turn goes back unchanged: Gemini needs its thought signatures on the next call.
        contents.push(candidate.content);
        const answers: Part[] = [];
        for (const call of calls) answers.push({ functionResponse: { ...(call.id && { id: call.id }), name: call.name, response: await answer(handlers, call) } });
        contents.push({ role: 'user', parts: answers });
      }
      emit({ kind: 'status', text: STOP_NOTE.cap });
    },
  };
}

async function answer(handlers: Map<string, Handler>, call: FunctionCall): Promise<Record<string, unknown>> {
  const handler = call.name === undefined ? undefined : handlers.get(call.name);
  if (!handler) return { error: `Tool '${call.name}' not found` };
  try {
    return { output: await handler(call.args ?? {}) };
  } catch (err) {
    return { error: err instanceof z.ZodError ? z.prettifyError(err) : err instanceof Error ? err.message : String(err) };
  }
}
