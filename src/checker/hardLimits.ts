import { formatMoney } from '@/domain/money';
import type { AmountCapRule, HardRule, PurchaseRequest, Reason, Rule } from '@/domain/types';

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
    default:
      return null; // merchant, category and date rules: Session 5
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
  // No unit count: compare the whole total. Conservative, so a per-night breach can't slip through.
  const units = rule.per === 'unit' ? (req.units ?? 1) : 1;
  const price = Math.ceil(req.total.minor / units);
  if (price <= rule.max.minor) return null; // limits are inclusive
  const shown = formatMoney({ minor: price, currency: req.total.currency });
  const what = rule.per === 'unit' ? `${shown} per ${req.unitLabel ?? rule.unitLabel ?? 'unit'}` : shown;
  return breach(rule, `${what} is over your ${formatMoney(rule.max)} limit.`);
}
