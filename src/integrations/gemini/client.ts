import { GoogleGenAI, type HttpRetryOptions } from '@google/genai';
import { z } from 'zod';
import { CheckerAnswerError } from '@/checker/fuzzy';

/**
 * Free stopgap until there is an Anthropic key. Same prompts as Claude, so results compare like for like.
 * Flash-Lite by default: its free tier allows 500 calls a day (one eval run is 67), while 3.8 Flash allows 20.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

let client: GoogleGenAI | undefined;

/** Uses GEMINI_API_KEY. On the free tier Google may use prompts to improve its products: mock data only. */
export function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/**
 * Rate limits (429) and server errors are retried up to 3 times. The waits start at 2, 4 and 8 seconds and are
 * randomised up to double, so they add up to about 28 seconds at most.
 */
export const RETRY: HttpRetryOptions = { attempts: 4, initialDelay: 2, maxDelay: 20 };

/**
 * Each call, retries included, is cancelled after 50 seconds. A stalled connection can't leave a task "running",
 * and a call can't go on retrying, and spending free quota, after the checker's 60-second limit has given up on it.
 * (The SDK's own `timeout` covers one attempt, and a timed-out attempt is retried.)
 */
export const CALL_DEADLINE_MS = 50_000;

/** The model answered, but not with something we can use. Callers turn this into "ask" or "rephrase". */
export class UnreadableAnswer extends CheckerAnswerError {}

const parseJson = (text: string | undefined): unknown => {
  try {
    return text === undefined ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** A Zod schema as the JSON Schema Gemini accepts: a subset of JSON Schema, with no `$schema` keyword. */
export function geminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json: Record<string, unknown> = z.toJSONSchema(schema);
  delete json.$schema;
  return json;
}

/** One call whose reply must match `schema`. */
export async function generateJson<S extends z.ZodType>(
  c: GoogleGenAI,
  call: { model: string; system: string; prompt: string; schema: S; timeoutMs?: number },
): Promise<z.output<S>> {
  const response = await c.models.generateContent({
    model: call.model,
    contents: call.prompt,
    config: {
      systemInstruction: call.system,
      responseMimeType: 'application/json',
      responseJsonSchema: geminiJsonSchema(call.schema),
      httpOptions: { retryOptions: RETRY },
      abortSignal: AbortSignal.timeout(call.timeoutMs ?? CALL_DEADLINE_MS),
    },
  });
  const blocked = response.promptFeedback?.blockReason;
  if (blocked) throw new UnreadableAnswer(`the model declined to answer (${blocked})`);
  const parsed = call.schema.safeParse(parseJson(response.text));
  if (!parsed.success) {
    throw new UnreadableAnswer(`no readable answer (finish reason: ${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
  }
  return parsed.data;
}
