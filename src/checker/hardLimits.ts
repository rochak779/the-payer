import { formatMoney } from '@/domain/money';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { AmountCapRule, HardRule, PurchaseRequest, Reason, Rule } from '@/domain/types';
import { merchantMatches } from './merchant';

/** Plain-code checks. One Reason per breached (or uncheckable) hard rule; empty array = all clear. */
export function checkHardLimits(req: PurchaseRequest, rules: Rule[]): Reason[] {
  const reasons: Reason[] = [];
  for (const rule of rules) {
    if (rule.kind === 'judgement') continue;
    const reason = checkRule(req, rule);
    if (reason) reasons.push(reason);
  }
  return reasons;
}

function checkRule(req: PurchaseRequest, rule: HardRule): Reason | null {
  switch (rule.kind) {
    case 'amount_cap':
      return checkAmountCap(req, rule);
    case 'merchant': {
      const hit = rule.merchants.find((m) => merchantMatches(req.merchant, m));
      if (rule.mode === 'block' && hit) return breach(rule, `You said never to use ${hit}.`);
      if (rule.mode === 'allow_only' && !hit) {
        return breach(rule, `${req.merchant} isn't one of the shops you allowed (${rule.merchants.join(', ')}).`);
      }
      return null;
    }
    case 'category': {
      const listed = rule.categories.includes(req.category);
      const label = CATEGORY_LABEL[req.category];
      if (rule.mode === 'block' && listed) return breach(rule, `You said no ${label.toLowerCase()}.`);
      if (rule.mode === 'allow_only' && !listed) return breach(rule, `${label} isn't on your list of allowed purchases.`);
      return null;
    }
    case 'date_window':
      if (req.purchaseDate < rule.from || req.purchaseDate > rule.to) {
        return breach(rule, `Buying on ${req.purchaseDate} is outside your ${rule.from} to ${rule.to} window.`);
      }
      return null;
  }
}

function breach(rule: HardRule, message: string): Reason {
  return { ruleId: rule.id, by: 'code', outcome: rule.onBreach, message };
}

function checkAmountCap(req: PurchaseRequest, rule: AmountCapRule): Reason | null {
  if (rule.category && rule.category !== req.category) return null;
  if (req.total.currency !== rule.max.currency) {
    return {
      ruleId: rule.id, by: 'code', outcome: 'ask',
      message: `The price is in ${req.total.currency} but your limit is in ${rule.max.currency}, so I can't compare them safely.`,
    };
  }
  // The unit count and label come from the agent. If the request counts a different unit from the rule
  // (e.g. guest-nights against a per-night cap), don't divide: compare the whole total, like a missing count.
  const otherUnit = rule.per === 'unit' && !!rule.unitLabel && !!req.unitLabel && unitKey(rule.unitLabel) !== unitKey(req.unitLabel);
  if (otherUnit) {
    if (req.total.minor <= rule.max.minor) return null;
    return breach(rule, `${formatMoney(req.total)} in total is over your ${formatMoney(rule.max)} per ${rule.unitLabel} limit (the listing counts ${unitKey(req.unitLabel!)}s, not ${unitKey(rule.unitLabel!)}s).`);
  }
  // No unit count: compare the whole total. Conservative, so a per-night breach can't slip through.
  const units = rule.per === 'unit' ? (req.units ?? 1) : 1;
  const price = Math.ceil(req.total.minor / units);
  if (price <= rule.max.minor) return null; // limits are inclusive
  const shown = formatMoney({ minor: price, currency: req.total.currency });
  const what = rule.per === 'unit' ? `${shown} per ${req.unitLabel ?? rule.unitLabel ?? 'unit'}` : shown;
  return breach(rule, `${what} is over your ${formatMoney(rule.max)} limit.`);
}

/** "Nights", "night " and "night" are the same unit. */
const unitKey = (label: string) => label.trim().toLowerCase().replace(/s$/, '');
