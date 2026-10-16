import type { PurchaseRequest } from '@/domain/types';

export function makeRequest(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return {
    item: 'Hotel Lisboa Plaza, 2 nights',
    merchant: 'Hotel Lisboa Plaza',
    category: 'hotel',
    total: { minor: 24000, currency: 'GBP' },
    units: 2,
    unitLabel: 'night',
    refundPolicy: 'Free cancellation until 48 hours before check-in.',
    url: 'https://example.com/hotel-lisboa-plaza',
    purchaseDate: '2026-11-10',
    agentNote: '',
    listingText: 'Guest rating 8.7/10.',
    ...overrides,
  };
}
