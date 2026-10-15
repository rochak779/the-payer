import type { Currency, Money } from './types';

const SYMBOL: Record<Currency, string> = { GBP: '£', EUR: '€', USD: '$' };

export function money(amount: number, currency: Currency = 'GBP'): Money {
  return { minor: Math.round(amount * 100), currency };
}

export function formatMoney(m: Money): string {
  const major = m.minor % 100 === 0 ? String(m.minor / 100) : (m.minor / 100).toFixed(2);
  return `${SYMBOL[m.currency]}${major}`;
}
