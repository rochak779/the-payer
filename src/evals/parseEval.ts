import type { Category, Money, OnBreach, Rule } from '@/domain/types';

/** What a rule must mean, without ids or wording. */
export type ExpectedRule = {
  kind: Rule['kind'];
  onBreach: OnBreach;
  max?: Money;
  per?: 'purchase' | 'unit';
  category?: Category;
  mode?: 'allow_only' | 'block';
  merchants?: string[];
  categories?: Category[];
  from?: string;
  to?: string;
};

export function keyOf(r: ExpectedRule): string {
  const parts: unknown[] = [r.kind, r.onBreach];
  if (r.kind === 'amount_cap') parts.push(r.max?.minor, r.max?.currency, r.per, r.category ?? null);
  if (r.kind === 'merchant') parts.push(r.mode, (r.merchants ?? []).map((m) => m.toLowerCase()).sort());
  if (r.kind === 'category') parts.push(r.mode, [...(r.categories ?? [])].sort());
  if (r.kind === 'date_window') parts.push(r.from, r.to);
  return JSON.stringify(parts);
}

export function sameRules(actual: Rule[], expected: ExpectedRule[]): boolean {
  const a = actual.map(keyOf).sort();
  const e = expected.map(keyOf).sort();
  return a.length === e.length && a.every((k, i) => k === e[i]);
}
