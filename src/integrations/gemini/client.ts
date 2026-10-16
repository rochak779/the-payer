import { GoogleGenAI, type HttpRetryOptions } from '@google/genai';
import { z } from 'zod';

/**
 * Free stopgap until there is an Anthropic key. Same prompts as Claude, so results compare like for like.
 * Flash-Lite by default: its free tier ran hundreds of calls a day without limit errors, while 3.8 Flash allows 20.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

let client: GoogleGenAI | undefined;

/** Uses GEMINI_API_KEY. On the free tier Google may use prompts to improve its products: mock data only. */
export function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Free-tier rate limits (429) are retried. Waits of 2 + 4 + 8 seconds stay well inside the 60-second check timeout. */
export const RETRY: HttpRetryOptions = { attempts: 4, initialDelay: 2, maxDelay: 20 };

/** The model answered, but not with something we can use. Callers turn this into "ask" or "rephrase". */
export class UnreadableAnswer extends Error {}

const parseJson = (text: string | undefined): unknown => {
  try {
    return text === undefined ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** One call whose reply must match `schema`. */
export async function generateJson<S extends z.ZodType>(
  c: GoogleGenAI,
  call: { model: string; system: string; prompt: string; schema: S },
): Promise<z.output<S>> {
  // Gemini accepts a subset of JSON Schema, which has no `$schema` keyword.
  const { $schema: _unused, ...responseJsonSchema } = z.toJSONSchema(call.schema);
  const response = await c.models.generateContent({
    model: call.model,
    contents: call.prompt,
    config: {
      systemInstruction: call.system,
      responseMimeType: 'application/json',
      responseJsonSchema,
      httpOptions: { retryOptions: RETRY },
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
