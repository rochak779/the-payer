import { describe, expect, it } from 'vitest';
import evalRules from '../../evals/rules.json';
import { Rule } from '@/domain/types';
import example from './ap2.example.json';
import { defaultValidUntil, toAp2OpenMandate } from './ap2';

const rules = Rule.array().parse(evalRules);
const NOW = new Date('2026-10-15T09:00:00Z');

type Constraint = Record<string, unknown> & { type: string };
type Ext = {
  rules: { rule_id: string; source: string; on_breach: string; exported_as: string }[];
  amount_caps: Record<string, unknown>[];
  blocked_merchants: Record<string, unknown>[];
  category_rules: Record<string, unknown>[];
  judgement_rules: Record<string, unknown>[];
};
const run = (rs: Rule[] = rules) => {
  const out = toAp2OpenMandate(rs, { validUntil: '2026-12-31', now: NOW });
  return { out, constraints: out.constraints as Constraint[], ext: out.x_agent_mandates as Ext };
};

// Field names recorded from AP2 v0.2.0 (open Payment Mandate schema + Merchant type). See BRIEF.md.
const AP2_NAMES = new Set([
  'vct', 'constraints', 'cnf', 'iat', 'exp',
  'type', 'currency', 'max', 'min', 'allowed', 'id', 'name', 'website', 'not_before', 'not_after',
]);
const keysOf = (v: unknown): string[] =>
  Array.isArray(v) ? v.flatMap(keysOf)
    : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k, ...keysOf(x)])
      : [];

describe('toAp2OpenMandate', () => {
  it('(a) puts every hard rule under the AP2 field recorded for its kind', () => {
    const { constraints, ext } = run();
    expect(constraints).toContainEqual({ type: 'payment.amount_range', currency: 'GBP', max: 40000 });
    expect(constraints).toContainEqual({ type: 'payment.execution_date', not_before: '2026-11-01T00:00:00Z', not_after: '2026-12-31T23:59:59Z' });
    // AP2 v0.2 has no per-night cap, category or merchant deny list: these travel in the extension.
    expect(ext.amount_caps).toContainEqual({ rule_id: 'hotel-cap', max: { amount: 15000, currency: 'GBP' }, per: 'unit', unit_label: 'night', category: 'hotel' });
    expect(ext.blocked_merchants).toContainEqual({ rule_id: 'no-ryanair', merchants: ['Ryanair'] });
    expect(ext.category_rules).toContainEqual({ rule_id: 'no-gift-cards', mode: 'block', categories: ['gift_card'] });

    const where = Object.fromEntries(ext.rules.map((r) => [r.rule_id, r.exported_as]));
    expect(where).toMatchObject({
      'single-cap': 'constraints: payment.amount_range',
      window: 'constraints: payment.execution_date',
      'hotel-cap': 'x_agent_mandates.amount_caps',
      'no-ryanair': 'x_agent_mandates.blocked_merchants',
      'no-gift-cards': 'x_agent_mandates.category_rules',
    });
    for (const r of rules) expect(where[r.id]).toBeDefined();
  });

  it('maps an allow-only shop list to payment.allowed_payees', () => {
    const { constraints, ext } = run([
      { id: 'only', kind: 'merchant', source: 'Only Booking.com.', onBreach: 'ask', mode: 'allow_only', merchants: ['Booking.com'] },
    ]);
    expect(constraints).toEqual([{ type: 'payment.allowed_payees', allowed: [{ id: 'booking-com', name: 'Booking.com' }] }]);
    expect(ext.rules[0]).toMatchObject({ rule_id: 'only', exported_as: 'constraints: payment.allowed_payees' });
  });

  it('(b) puts judgement rules under x_agent_mandates.judgement_rules (AP2 v0.2 has no natural-language field)', () => {
    const { ext } = run();
    const judgement = rules.filter((r) => r.kind === 'judgement');
    expect(judgement.length).toBeGreaterThan(0);
    for (const r of judgement) expect(ext.judgement_rules).toContainEqual({ rule_id: r.id, text: r.text });
  });

  it('keeps ask vs block for every rule (AP2 sends any failed constraint back to the user)', () => {
    const { ext } = run();
    for (const r of rules) expect(ext.rules).toContainEqual(expect.objectContaining({ rule_id: r.id, source: r.source, on_breach: r.onBreach }));
  });

  it('(c) has every top-level key the official example has, and the same vct', () => {
    const { out } = run();
    for (const key of Object.keys(example)) expect(out).toHaveProperty(key);
    expect(out.vct).toBe(example.vct);
    expect(out.iat).toBe(Math.floor(NOW.getTime() / 1000));
    expect(out.exp).toBe(Date.parse('2026-12-31T23:59:59Z') / 1000);
  });

  it('uses no AP2 field name outside the recorded list', () => {
    const { out } = run([
      ...rules,
      { id: 'only', kind: 'merchant', source: '', onBreach: 'ask', mode: 'allow_only', merchants: ['Booking.com'] },
    ]);
    const ap2Part = Object.fromEntries(Object.entries(out).filter(([k]) => k !== 'x_agent_mandates'));
    for (const key of keysOf(ap2Part)) expect(AP2_NAMES).toContain(key);
  });

  it('rejects an unreadable validUntil', () => {
    expect(() => toAp2OpenMandate(rules, { validUntil: 'next week' })).toThrow(/validUntil/);
  });
});

describe('defaultValidUntil', () => {
  it('uses the latest date window end', () => {
    expect(defaultValidUntil(rules, NOW)).toBe('2026-12-31');
  });
  it('falls back to 30 days from today', () => {
    expect(defaultValidUntil([], NOW)).toBe('2026-11-14');
  });
});
