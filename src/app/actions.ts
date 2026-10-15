'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDeps } from '@/deps';
import { Rule } from '@/domain/types';
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
