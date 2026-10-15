import type Stripe from 'stripe';
import { toChargeAttempt } from '@/integrations/stripe/authorization';
import { stripeClient } from '@/integrations/stripe/client';
import { checkCharge } from '@/payments/paymentGate';
import { defaultStore } from '@/store/store';

/** Warm-up: `next dev` compiles a route on first hit, which can take longer than Stripe's real-time window. */
export function GET() {
  return Response.json({ ok: true });
}

/** Stripe asks "approve this card charge?" in real time. Code only: the payment check from Session 13. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('STRIPE_WEBHOOK_SECRET is not set', { status: 500 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
  if (event.type !== 'issuing_authorization.request') return new Response(null, { status: 200 });

  const attempt = toChargeAttempt(event.data.object as Stripe.Issuing.Authorization);
  const result = attempt ? checkCharge(defaultStore(), attempt, new Date()) : { approved: false };
  return Response.json({ approved: result.approved }, { headers: { 'Stripe-Version': event.api_version ?? '' } });
}
