'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { userDecides } from '@/approvals/approvals';
import { getDeps } from '@/deps';
import { Rule } from '@/domain/types';
import { executeRun, startRun } from '@/flow/runs';
import { appendLog } from '@/log/log';
import { setAgentEnabled } from '@/payments/agentSwitch';
import { fulfil } from '@/payments/fulfil';
import { checkedBy, explainRule } from '@/rules/explain';

export type PreviewItem = { rule: Rule; explanation: string; checkedBy: string };

export async function previewRules(text: string): Promise<PreviewItem[]> {
  const rules = await (await getDeps()).parser.parse(text);
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
  const deps = await getDeps();
  const run = startRun(deps.store, trimmed, deps.clock());
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
