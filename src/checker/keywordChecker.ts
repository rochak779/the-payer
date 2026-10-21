import type { JudgementRule } from '@/domain/types';
import type { Flag, FuzzyChecker } from './fuzzy';

const STOPWORDS = new Set([
  'nothing', 'anything', 'something', 'everything', 'never', 'only', 'always', 'that', 'this', 'these', 'those',
  'with', 'from', 'into', 'than', 'more', 'less', 'under', 'over', 'about', 'before', 'after', 'buying',
  'someone', 'else', 'them', 'they', 'their', 'your', 'have', 'will', 'would', 'should', 'could', 'please', 'first',
]);

const HIDDEN_COSTS = /\b(city tax|tourist tax|resort fee|service fee|booking fee|delivery|payable at|excluding|not included|added at checkout)\b/i;
const INJECTION = /\b(ignore|disregard)\b.{0,40}\b(rules?|instructions?|previous|limits?)\b|\bsystem\s*(note|prompt|message)\b/i;

export function keywordsFor(ruleText: string): string[] {
  return ruleText
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
}

function flag(pattern: RegExp, text: string, explanation: string): Flag {
  return pattern.test(text) ? { flagged: true, explanation } : { flagged: false, explanation: '' };
}

export const keywordChecker: FuzzyChecker = {
  name: 'keyword-baseline',
  async check(req, rules) {
    const text = [req.item, req.merchant, req.refundPolicy, req.agentNote, req.listingText].join(' ').toLowerCase();
    const verdicts = rules
      .filter((r): r is JudgementRule => r.kind === 'judgement')
      .map((rule) => {
        const hit = keywordsFor(rule.text).find((k) => text.includes(k));
        return hit
          ? { ruleId: rule.id, verdict: 'breached' as const, explanation: `Mentions "${hit}". Your rule: "${rule.text}"` }
          : { ruleId: rule.id, verdict: 'clear' as const, explanation: 'No matching words.' };
      });
    return {
      verdicts,
      hiddenCosts: flag(HIDDEN_COSTS, text, 'Mentions extra costs.'),
      injection: flag(INJECTION, text, 'Contains text aimed at an AI.'),
    };
  },
};
