import type { GoogleGenAI } from '@google/genai';
import type { FuzzyChecker } from '@/checker/fuzzy';
import { CheckerOutput, PROMPT_VERSION, SYSTEM, renderPrompt } from '@/integrations/claude/fuzzyChecker';
import { GEMINI_MODEL, gemini, generateJson } from './client';

export function createGeminiFuzzyChecker(opts: { model?: string; client?: GoogleGenAI } = {}): FuzzyChecker {
  const model = opts.model ?? GEMINI_MODEL;
  return {
    name: `gemini:${model}:${PROMPT_VERSION}`,
    // Any failure throws, and checkPurchase turns it into "ask": failing safe, never approving.
    check: (req, rules) =>
      generateJson(opts.client ?? gemini(), { model, system: SYSTEM, prompt: renderPrompt(req, rules), schema: CheckerOutput }),
  };
}
