import Stripe from 'stripe';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

let client: Stripe | undefined;

/** Sandbox only: a live key can never be used by this demo. */
export function stripeClient(): Stripe {
  const key = requireEnv('STRIPE_SECRET_KEY');
  if (!key.startsWith('sk_test_')) throw new Error('STRIPE_SECRET_KEY must be a sandbox key (sk_test_…).');
  client ??= new Stripe(key);
  return client;
}
