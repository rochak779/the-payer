import type { GoogleGenAI } from '@google/genai';
import { ParserOutput, SYSTEM, renderRulesPrompt, toRule } from '@/integrations/claude/ruleParser';
import type { RuleParser } from '@/rules/parser';
import { GEMINI_MODEL, UnreadableAnswer, gemini, generateJson } from './client';

export function createGeminiRuleParser(opts: { model?: string; client?: GoogleGenAI; today?: () => string } = {}): RuleParser {
  const model = opts.model ?? GEMINI_MODEL;
  return {
    name: `gemini:${model}`,
    async parse(text) {
      const today = opts.today?.() ?? new Date().toISOString().slice(0, 10);
      try {
        const output = await generateJson(opts.client ?? gemini(), { model, system: SYSTEM, prompt: renderRulesPrompt(text, today), schema: ParserOutput });
        return output.rules.map(toRule);
      } catch (err) {
        if (err instanceof UnreadableAnswer) throw new Error("Couldn't read those rules. Try rephrasing them.");
        throw err;
      }
    },
  };
}
