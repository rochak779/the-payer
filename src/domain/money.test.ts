import { describe, expect, it } from 'vitest';
import { formatMoney, money } from './money';

describe('money', () => {
  it('converts major units to pence without float drift', () => {
    expect(money(149.99)).toEqual({ minor: 14999, currency: 'GBP' });
    expect(money(0.1 + 0.2)).toEqual({ minor: 30, currency: 'GBP' });
  });

  it('formats whole amounts without pence and others with two decimals', () => {
    expect(formatMoney({ minor: 15000, currency: 'GBP' })).toBe('£150');
    expect(formatMoney({ minor: 15001, currency: 'GBP' })).toBe('£150.01');
    expect(formatMoney({ minor: 32000, currency: 'EUR' })).toBe('€320');
  });
});
