import type Stripe from 'stripe';
import { Currency } from '@/domain/types';
import type { ChargeAttempt } from '@/payments/paymentGate';

export function toChargeAttempt(auth: Stripe.Issuing.Authorization): ChargeAttempt | null {
  const currency = Currency.safeParse((auth.pending_request?.currency ?? auth.currency).toUpperCase());
  if (!currency.success) return null;
  return {
    approvalId: auth.card.metadata?.approval_id ?? null,
    amount: { minor: auth.pending_request?.amount ?? auth.amount, currency: currency.data },
    merchant: auth.merchant_data.name ?? '',
  };
}
