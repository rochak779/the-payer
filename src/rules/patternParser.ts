import { newId } from '@/domain/ids';
import type { Category, Currency, OnBreach, Rule } from '@/domain/types';
import type { RuleParser } from './parser';

const NEGATIVE = /\b(never|no|nothing|don't|do not|must not)\b/i;
const AMOUNT = /\b(?:under|below|less than|up to|max(?:imum)?|no more than|not more than|at most|more than|over)\s*([£$€])\s?(\d+(?:\.\d{1,2})?)/i;
const CURRENCY_OF: Record<string, Currency> = { '£': 'GBP', $: 'USD', '€': 'EUR' };
const PER_UNIT = /\b(?:per|a|an|each)\s+(night|person|ticket|item)\b|\/\s*(night|person|ticket|item)\b/i;
const MERCHANT_BLOCK = /\b(?:never|don't|do not)\s+(?:use|book with|book on|book through|buy from|shop at)\s+(.+?)[.!]?$/i;
const MERCHANT_ONLY = /\bonly\s+(?:use|book with|book on|book through|buy from|shop at)\s+(.+?)[.!]?$/i;
const CATEGORY_BLOCK = /^(?:no|never buy|don't buy|do not buy)\b/i;

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\bgift ?cards?\b|\bvouchers?\b/i, 'gift_card'],
  [/\bhotels?\b/i, 'hotel'],
  [/\bflights?\b/i, 'flight'],
  [/\btrains?\b/i, 'train'],
  [/\brestaurants?\b/i, 'restaurant'],
  [/\bgroceries\b/i, 'groceries'],
  [/\belectronics\b|\bgadgets?\b/i, 'electronics'],
  [/\bclothes\b|\bclothing\b/i, 'clothing'],
  [/\bsubscriptions?\b/i, 'subscription'],
  [/\b(?:event|concert|theatre) tickets?\b/i, 'event_ticket'],
];

export function splitSentences(text: string): string[] {
  return text
    .replace(/[’‘]/g, "'")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const findCategory = (s: string): Category | undefined => CATEGORY_WORDS.find(([re]) => re.test(s))?.[1];
const names = (list: string) => list.split(/\s*(?:,|\bor\b|\band\b)\s*/i).map((n) => n.trim()).filter(Boolean);

function parseSentence(source: string): Rule {
  const onBreach: OnBreach = NEGATIVE.test(source) ? 'block' : 'ask';
  const base = { id: newId('rule'), source, onBreach };

  const amount = source.match(AMOUNT);
  if (amount) {
    const unit = source.match(PER_UNIT);
    return {
      ...base, kind: 'amount_cap',
      max: { minor: Math.round(Number(amount[2]) * 100), currency: CURRENCY_OF[amount[1]] },
      per: unit ? 'unit' : 'purchase',
      unitLabel: unit ? (unit[1] ?? unit[2]).toLowerCase() : undefined,
      category: findCategory(source),
    };
  }
  const blocked = source.match(MERCHANT_BLOCK);
  if (blocked) return { ...base, kind: 'merchant', mode: 'block', merchants: names(blocked[1]) };
  const only = source.match(MERCHANT_ONLY);
  if (only) return { ...base, kind: 'merchant', mode: 'allow_only', merchants: names(only[1]) };
  const category = findCategory(source);
  if (category && CATEGORY_BLOCK.test(source)) return { ...base, kind: 'category', mode: 'block', categories: [category] };
  return { ...base, kind: 'judgement', text: source };
}

/** Offline, pattern-only parser. Common shapes become hard rules; everything else becomes a judgement rule. */
export const patternParser: RuleParser = {
  name: 'pattern',
  async parse(text) {
    return splitSentences(text).map(parseSentence);
  },
};
