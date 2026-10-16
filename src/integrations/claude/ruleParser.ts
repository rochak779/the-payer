import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { newId } from '@/domain/ids';
import { Category, Currency, Rule } from '@/domain/types';
import type { RuleParser } from '@/rules/parser';
import { CHECKER_MODEL, claude } from './client';

const ParsedRule = z.object({
  kind: z.enum(['amount_cap', 'merchant', 'category', 'date_window', 'judgement']),
  source: z.string(),
  onBreach: z.enum(['ask', 'block']),
  maxAmount: z.number().nullable(),
  currency: Currency.nullable(),
  per: z.enum(['purchase', 'unit']).nullable(),
  unitLabel: z.string().nullable(),
  category: Category.nullable(),
  mode: z.enum(['allow_only', 'block']).nullable(),
  merchants: z.array(z.string()).nullable(),
  categories: z.array(Category).nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  text: z.string().nullable(),
});
export type ParsedRule = z.infer<typeof ParsedRule>;
export const ParserOutput = z.object({ rules: z.array(ParsedRule) });

/** Shared with the Gemini rule reader. */
export const SYSTEM = `You turn a person's plain-English spending rules for their AI shopping agent into structured rules.

Kinds:
- amount_cap: a price limit. maxAmount in major units (150 for £150), currency, per "unit" for per-night/per-person/per-ticket limits, otherwise "purchase"; unitLabel (e.g. "night"); category if the limit only applies to one kind of purchase.
- merchant: specific shops. mode "block" (never use them) or "allow_only" (only use them).
- category: kinds of purchase. mode "block" or "allow_only". Allowed categories: ${Category.options.join(', ')}.
- date_window: only buy between two dates. from/to as YYYY-MM-DD.
- judgement: anything that needs judgement or can't be expressed exactly by the kinds above. text = the rule in the person's words.

Policy:
- onBreach is "block" only when the person says never / no / nothing / don't / must not. Otherwise "ask".
- Split a sentence that holds two rules into two rules; both keep the full sentence as source.
- If a rule is only partly expressible as a hard limit (e.g. a shop rule that only applies to one category), make it a judgement rule. Never invent limits the person didn't state.
- Set every field that doesn't apply to null.`;

export const renderRulesPrompt = (text: string, today: string) => `Today is ${today}.\n<rules>\n${text.replace(/</g, '‹')}\n</rules>`;

export function toRule(p: ParsedRule): Rule {
  const base = { id: newId('rule'), source: p.source, onBreach: p.onBreach };
  const candidate =
    p.kind === 'amount_cap'
      ? { ...base, kind: p.kind, max: { minor: Math.round((p.maxAmount ?? -1) * 100), currency: p.currency ?? 'GBP' }, per: p.per ?? 'purchase', unitLabel: p.unitLabel ?? undefined, category: p.category ?? undefined }
      : p.kind === 'merchant'
        ? { ...base, kind: p.kind, mode: p.mode ?? 'block', merchants: p.merchants ?? [] }
        : p.kind === 'category'
          ? { ...base, kind: p.kind, mode: p.mode ?? 'block', categories: p.categories ?? [] }
          : p.kind === 'date_window'
            ? { ...base, kind: p.kind, from: p.from ?? '', to: p.to ?? '' }
            : { ...base, kind: p.kind, text: p.text ?? p.source };
  const parsed = Rule.safeParse(candidate);
  // An incomplete hard rule becomes a judgement rule: the checker then asks when unsure, which is safe.
  return parsed.success ? parsed.data : { ...base, kind: 'judgement', text: p.source };
}

export function createClaudeRuleParser(opts: { model?: string; client?: Anthropic; today?: () => string } = {}): RuleParser {
  const model = opts.model ?? CHECKER_MODEL;
  return {
    name: `claude:${model}`,
    async parse(text) {
      const today = opts.today?.() ?? new Date().toISOString().slice(0, 10);
      const response = await (opts.client ?? claude()).beta.messages.parse({
        model,
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: 'user', content: renderRulesPrompt(text, today) }],
        output_config: { format: betaZodOutputFormat(ParserOutput), effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default', // same as the checker: retry a wrongful decline on a fallback model
      });
      if (response.stop_reason === 'refusal' || !response.parsed_output) {
        throw new Error("Couldn't read those rules. Try rephrasing them.");
      }
      return response.parsed_output.rules.map(toRule);
    },
  };
}
