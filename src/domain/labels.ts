import type { Category, Outcome } from './types';

export const CATEGORY_LABEL: Record<Category, string> = {
  hotel: 'Hotels', flight: 'Flights', train: 'Trains', restaurant: 'Restaurants',
  groceries: 'Groceries', electronics: 'Electronics', clothing: 'Clothing', gift_card: 'Gift cards',
  subscription: 'Subscriptions', event_ticket: 'Event tickets', home: 'Home', other: 'Other',
};

export const OUTCOME_LABEL: Record<Outcome, string> = { approve: 'Approved', ask: 'Asking you', block: 'Blocked' };
