import http from 'node:http';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Sandbox only: STRIPE_SECRET_KEY must start with sk_test_');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = process.env.STRIPE_WEBHOOK_SECRET!;

http.createServer(async (req, res) => {
  const started = Date.now();
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.concat(chunks), String(req.headers['stripe-signature']), secret);
  } catch (err) {
    console.log('bad signature', err);
    res.writeHead(400).end();
    return;
  }
  console.log(new Date().toISOString(), event.type);
  if (event.type === 'issuing_authorization.request') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Stripe-Version': event.api_version ?? '' });
    res.end(JSON.stringify({ approved: false }));
    console.log(`  answered approved=false in ${Date.now() - started}ms`);
    return;
  }
  res.writeHead(200).end();
}).listen(4242, () => console.log('spike webhook on http://localhost:4242'));
