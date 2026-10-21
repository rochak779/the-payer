'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { userDecides } from '@/approvals/approvals';
import { getDeps } from '@/deps';
import { Rule } from '@/domain/types';
import { executeRun, startRun } from '@/flow/runs';
import { payPalClientFromEnv } from '@/integrations/paypal/client';
import { finishConnecting, startVaultSetup } from '@/integrations/paypal/vault';
import { limitsFromEnv, OFFLINE_NOTICE, takeAllowance, usageFile } from '@/hosted/usage';
import { appendLog } from '@/log/log';
import { setAgentEnabled } from '@/payments/agentSwitch';
import { fulfil } from '@/payments/fulfil';
import { checkedBy, explainRule } from '@/rules/explain';
import { currentVisitorId } from '@/store/visitor';

export type PreviewItem = { rule: Rule; explanation: string; checkedBy: string };

/** Hosted: false once today's limit for this kind of use is reached. Locally: always true. */
async function liveAllowed(kind: 'task' | 'preview'): Promise<boolean> {
  if (process.env.HOSTED !== '1') return true;
  return takeAllowance(usageFile(), kind, (await currentVisitorId()) ?? 'unknown', new Date(), limitsFromEnv());
}

export async function previewRules(text: string): Promise<PreviewItem[]> {
  // Past the limit this is the pattern reader, which is offline anyway, so nothing is shown.
  const rules = await (await getDeps({ live: await liveAllowed('preview') })).parser.parse(text);
  return rules.map((rule) => ({ rule, explanation: explainRule(rule), checkedBy: checkedBy(rule) }));
}

export async function saveRules(rules: Rule[]): Promise<void> {
  const parsed = z.array(Rule).parse(rules);
  const deps = await getDeps();
  deps.store.update((db) => {
    db.rules = parsed;
    appendLog(db, deps.clock(), 'rules_saved', null, `Saved ${parsed.length} rule(s).`);
  });
  revalidatePath('/rules');
}

export async function startTask(task: string): Promise<string> {
  const trimmed = task.trim();
  if (!trimmed) throw new Error('Tell the agent what you want.');
  const live = await liveAllowed('task');
  const deps = await getDeps({ live });
  const run = startRun(deps.store, trimmed, deps.clock(), live ? undefined : OFFLINE_NOTICE);
  after(() => executeRun(deps, run.id)); // keeps running after the response; the page polls for progress
  return run.id;
}

export async function decideApproval(formData: FormData): Promise<void> {
  const deps = await getDeps();
  const id = String(formData.get('id'));
  const choice = formData.get('choice') === 'approve' ? 'approve' : 'decline';
  const approval = userDecides(deps.store, id, choice, deps.clock());
  if (approval.status === 'approved') await fulfil(deps, approval.id, deps.clock());
  revalidatePath('/', 'layout'); // refreshes the tab badge too
}

export async function toggleAgent(formData: FormData): Promise<void> {
  const deps = await getDeps();
  await setAgentEnabled(deps, formData.get('enabled') === 'true', deps.clock());
  revalidatePath('/', 'layout');
}

/** Demo only: pretend a merchant tries a charge that wasn't approved. */
export async function demoCharge(formData: FormData): Promise<void> {
  const deps = await getDeps();
  const approval = deps.store.read().approvals.find((a) => a.id === String(formData.get('id')));
  if (!approval?.payment) throw new Error('This purchase has no payment set up.');
  const kind = String(formData.get('kind'));
  const amount = kind === 'more' ? { ...approval.request.total, minor: approval.request.total.minor + 2000 } : approval.request.total;
  const merchant = kind === 'other_merchant' ? 'Totally Legit Electronics Ltd' : approval.request.merchant;
  await deps.rail.charge({ handle: approval.payment, amount, merchant });
  revalidatePath('/activity');
}

/** Starts saving the person's PayPal once: remembers the approval it waits for and gives back PayPal's approve link (opened in a new tab). */
export async function connectPayPal(): Promise<{ approveUrl: string } | { error: string }> {
  try {
    const deps = await getDeps();
    const { setupTokenId, approveUrl } = await startVaultSetup(payPalClientFromEnv(), process.env.APP_URL ?? 'http://localhost:3000');
    deps.store.update((db) => { db.settings.paypalPending = { setupTokenId, approveUrl }; });
    revalidatePath('/ask');
    return { approveUrl };
  } catch (err) {
    console.error(`PayPal connect failed: ${err instanceof Error ? err.message : String(err)}`);
    return { error: "PayPal didn't answer. Try again in a minute." };
  }
}

/** "Finish connecting": checks with PayPal that the person approved, then saves it. */
export async function finishPayPal(): Promise<void> {
  const deps = await getDeps();
  const result = await finishConnecting({ client: payPalClientFromEnv(), store: deps.store, clock: deps.clock });
  redirect(`/ask?paypal=${result}`);
}

/** Forgets this person's own PayPal, or the approval Connect was waiting for. The demo buyer (PAYPAL_VAULT_ID), if set, is used again. */
export async function disconnectPayPal(): Promise<void> {
  const deps = await getDeps();
  deps.store.update((db) => {
    db.settings.paypal = null;
    db.settings.paypalPending = null;
  });
  revalidatePath('/ask');
}
