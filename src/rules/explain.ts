import { CATEGORY_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import type { OnBreach, Rule } from '@/domain/types';

const ACT: Record<OnBreach, string> = { block: "I'll block it", ask: "I'll ask you first" };
const list = (items: string[]) => items.join(', ');

/** "Here's what I understood": one plain line per rule, so misreadings are caught before a bad purchase. */
export function explainRule(rule: Rule): string {
  const act = ACT[rule.onBreach];
  switch (rule.kind) {
    case 'amount_cap': {
      const scope = rule.category ? CATEGORY_LABEL[rule.category] : 'Any purchase';
      const per = rule.per === 'unit' ? ` per ${rule.unitLabel ?? 'unit'}` : '';
      return `${scope} over ${formatMoney(rule.max)}${per} → ${act}.`;
    }
    case 'merchant':
      return rule.mode === 'block'
        ? `Buying from ${list(rule.merchants)} → ${act}.`
        : `Buying anywhere except ${list(rule.merchants)} → ${act}.`;
    case 'category': {
      const labels = list(rule.categories.map((c) => CATEGORY_LABEL[c]));
      return rule.mode === 'block' ? `${labels} → ${act}.` : `Anything except ${labels} → ${act}.`;
    }
    case 'date_window':
      return `Buying outside ${rule.from} to ${rule.to} → ${act}.`;
    case 'judgement':
      return rule.onBreach === 'block'
        ? `"${rule.text}" I'll judge each purchase: if it clearly applies, I'll block it; if I'm not sure, I'll ask you.`
        : `"${rule.text}" I'll judge each purchase: if it applies or I'm not sure, I'll ask you first.`;
  }
}

export function checkedBy(rule: Rule): string {
  return rule.kind === 'judgement' ? 'Judgement · checked by AI' : 'Hard limit · checked by code';
}
