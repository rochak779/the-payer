import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Sandbox only: STRIPE_SECRET_KEY must start with sk_test_');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function charge(cardId: string, minor: number) {
  const auth = await stripe.testHelpers.issuing.authorizations.create({
    card: cardId, amount: minor, currency: 'gbp', merchant_data: { name: 'Spike Test Shop' },
  });
  console.log(`charge ${minor}p → approved=${auth.approved} reason=${auth.request_history.at(-1)?.reason}`);
}

async function main() {
  const card = await stripe.issuing.cards.create({
    cardholder: process.env.STRIPE_CARDHOLDER_ID!, type: 'virtual', status: 'active', currency: 'gbp',
    spending_controls: { spending_limits: [{ amount: 5000, interval: 'all_time' }] },
    metadata: { approval_id: 'apv_spike' },
  });
  console.log(`card ${card.id} •••• ${card.last4}`);
  await charge(card.id, 1000); // within limit → decided by our webhook (expect declined)
  await charge(card.id, 6000); // over limit → Stripe declines before the webhook (spending_controls)
  await stripe.issuing.cards.update(card.id, { status: 'canceled' });
}

main().catch((err) => { console.error(err); process.exit(1); });
