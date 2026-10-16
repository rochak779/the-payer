/**
 * Export the user's rules as AP2 open Payment Mandate content.
 *
 * Spec: AP2 v0.2.0 (released 28 Apr 2026), read at commit e1ea56d on 15 Oct 2026:
 *   https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/code/sdk/schemas/ap2/open_payment_mandate.json
 *   https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/payment_mandate.md
 * Field names used here are only those recorded in BRIEF.md ("AP2 v0.2 field names").
 *
 * Why the Payment Mandate and not the Checkout Mandate: an open Checkout Mandate must list the exact
 * items allowed (`checkout.line_items`), which standing rules can't know in advance.
 *
 * What AP2 v0.2 can't carry (per-unit or per-category caps, shop deny lists, categories, plain-English
 * judgement rules, and ask vs block) goes in our own `x_agent_mandates` extension. The output is
 * unsigned content: `cnf` (the agent's key) and the `payment.reference` link to an open Checkout
 * Mandate are added when a trusted surface signs it, so they are left empty / out here.
 */
import type { OnBreach, Rule } from '@/domain/types';

const VCT = 'mandate.payment.open.1';
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

type ExtRule = { rule_id: string; source: string; on_breach: OnBreach; exported_as: string };

/** Lower-case slug used as the AP2 Merchant `id` (we only know shop names, not merchant ids). */
const merchantId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** True for a YYYY-MM-DD date that exists (rejects 2026-13-01 and 2026-02-30). */
const isRealDay = (d: string) => {
  const t = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(t.getTime()) && isoDay(t) === d;
};

function toEpochSeconds(validUntil: string): number {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(validUntil);
  const ms = dateOnly ? (isRealDay(validUntil) ? Date.parse(`${validUntil}T23:59:59Z`) : NaN) : Date.parse(validUntil);
  if (Number.isNaN(ms)) throw new Error(`validUntil must be YYYY-MM-DD or an ISO date-time, got "${validUntil}"`);
  return Math.floor(ms / 1000);
}

export function toAp2OpenMandate(
  rules: Rule[],
  opts: { validUntil: string; now?: Date },
): Record<string, unknown> {
  const exp = toEpochSeconds(opts.validUntil);
  const constraints: Record<string, unknown>[] = [];
  const ext = {
    about:
      'Agent Mandates extension: rules AP2 v0.2 has no field for, and whether each rule asks or blocks. ' +
      'Unsigned content: cnf (the agent key) and payment.reference are added when a trusted surface signs it.',
    rules: [] as ExtRule[],
    amount_caps: [] as Record<string, unknown>[],
    blocked_merchants: [] as Record<string, unknown>[],
    category_rules: [] as Record<string, unknown>[],
    judgement_rules: [] as Record<string, unknown>[],
  };
  const trace = (rule: Rule, exported_as: string) =>
    ext.rules.push({ rule_id: rule.id, source: rule.source, on_breach: rule.onBreach, exported_as });

  for (const rule of rules) {
    switch (rule.kind) {
      case 'amount_cap':
        if (rule.per === 'purchase' && !rule.category) {
          constraints.push({ type: 'payment.amount_range', currency: rule.max.currency, max: rule.max.minor });
          trace(rule, 'constraints: payment.amount_range');
        } else {
          ext.amount_caps.push({
            rule_id: rule.id,
            max: { amount: rule.max.minor, currency: rule.max.currency },
            per: rule.per,
            ...(rule.unitLabel ? { unit_label: rule.unitLabel } : {}),
            ...(rule.category ? { category: rule.category } : {}),
          });
          trace(rule, 'x_agent_mandates.amount_caps');
        }
        break;
      case 'merchant':
        if (rule.mode === 'allow_only') {
          constraints.push({ type: 'payment.allowed_payees', allowed: rule.merchants.map((name) => ({ id: merchantId(name), name })) });
          trace(rule, 'constraints: payment.allowed_payees');
        } else {
          ext.blocked_merchants.push({ rule_id: rule.id, merchants: rule.merchants });
          trace(rule, 'x_agent_mandates.blocked_merchants');
        }
        break;
      case 'category':
        ext.category_rules.push({ rule_id: rule.id, mode: rule.mode, categories: rule.categories });
        trace(rule, 'x_agent_mandates.category_rules');
        break;
      case 'date_window':
        constraints.push({ type: 'payment.execution_date', not_before: `${rule.from}T00:00:00Z`, not_after: `${rule.to}T23:59:59Z` });
        trace(rule, 'constraints: payment.execution_date');
        break;
      case 'judgement':
        ext.judgement_rules.push({ rule_id: rule.id, text: rule.text });
        trace(rule, 'x_agent_mandates.judgement_rules');
        break;
    }
  }

  return {
    vct: VCT,
    constraints,
    cnf: {},
    iat: Math.floor((opts.now ?? new Date()).getTime() / 1000),
    exp,
    x_agent_mandates: ext,
  };
}

/** The mandate runs to the latest date-window end, or 30 days from today if there is none. */
export function defaultValidUntil(rules: Rule[], today: Date = new Date()): string {
  const ends = rules.flatMap((r) => (r.kind === 'date_window' && isRealDay(r.to) ? [r.to] : [])).sort();
  return ends.at(-1) ?? isoDay(new Date(today.getTime() + 30 * DAY_MS));
}
