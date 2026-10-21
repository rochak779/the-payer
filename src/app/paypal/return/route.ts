import { redirect } from 'next/navigation';
import { payPalClientFromEnv } from '@/integrations/paypal/client';
import { handleReturn } from '@/integrations/paypal/vault';
import { currentStore } from '@/store/visitor';

/**
 * PayPal sends the buyer here after "Connect PayPal", when its redirect works (in the sandbox it doesn't, so "Finish connecting" does the same).
 * Hosted: the visitor cookie comes back on this redirect (SameSite=Lax).
 */
export async function GET(request: Request) {
  const result = await handleReturn(new URL(request.url).searchParams, {
    client: payPalClientFromEnv(),
    store: await currentStore(),
    clock: () => new Date(),
  });
  redirect(`/ask?paypal=${result}`);
}
