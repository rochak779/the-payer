'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { getDeps } from '@/deps';
import { Rule } from '@/domain/types';
import { executeRun, startRun } from '@/flow/runs';
import { appendLog } from '@/log/log';
import { checkedBy, explainRule } from '@/rules/explain';

export type PreviewItem = { rule: Rule; explanation: string; checkedBy: string };

export async function previewRules(text: string): Promise<PreviewItem[]> {
  const rules = await getDeps().parser.parse(text);
  return rules.map((rule) => ({ rule, explanation: explainRule(rule), checkedBy: checkedBy(rule) }));
}

export async function saveRules(rules: Rule[]): Promise<void> {
  const parsed = z.array(Rule).parse(rules);
  const deps = getDeps();
  deps.store.update((db) => {
    db.rules = parsed;
    appendLog(db, deps.clock(), 'rules_saved', null, `Saved ${parsed.length} rule(s).`);
  });
  revalidatePath('/rules');
}

export async function startTask(task: string): Promise<string> {
  const trimmed = task.trim();
  if (!trimmed) throw new Error('Tell the agent what you want.');
  const deps = getDeps();
  const run = startRun(deps.store, trimmed, deps.clock());
  after(() => executeRun(deps, run.id)); // keeps running after the response; the page polls for progress
  return run.id;
}
