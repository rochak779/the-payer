import type { ApprovalStatus, Category, Outcome } from './types';

export const CATEGORY_LABEL: Record<Category, string> = {
  hotel: 'Hotels', flight: 'Flights', train: 'Trains', restaurant: 'Restaurants',
  groceries: 'Groceries', electronics: 'Electronics', clothing: 'Clothing', gift_card: 'Gift cards',
  subscription: 'Subscriptions', event_ticket: 'Event tickets', home: 'Home', other: 'Other',
};

export const OUTCOME_LABEL: Record<Outcome, string> = { approve: 'Approved', ask: 'Asking you', block: 'Blocked' };

export const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'waiting for you', approved: 'approved, not yet charged', declined: 'you declined',
  blocked: 'blocked', used: 'paid', revoked: 'cancelled (agent turned off)',
};
