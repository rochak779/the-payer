import { describe, expect, it } from 'vitest';
import { merchantMatches } from './merchant';

describe('merchantMatches', () => {
  it('ignores case, punctuation and accents', () => {
    expect(merchantMatches('Booking.com', 'booking.com')).toBe(true);
    expect(merchantMatches('Booking.com', 'bookingcom')).toBe(true);
    expect(merchantMatches('Hotel Príncipe Real', 'hotel principe real')).toBe(true);
  });

  it('matches a pattern found as whole words inside a longer name', () => {
    expect(merchantMatches('Ryanair DAC', 'Ryanair')).toBe(true);
    expect(merchantMatches('Ryanair (pre-approved partner)', 'Ryanair')).toBe(true);
  });

  it('never matches part of a word, or a shorter name against a longer pattern', () => {
    expect(merchantMatches('Palace Hotel', 'Ace')).toBe(false);
    expect(merchantMatches('Hotel', 'Hotel Lisboa Plaza')).toBe(false);
    expect(merchantMatches('Anything', '')).toBe(false);
  });
});
