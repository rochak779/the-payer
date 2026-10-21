import { patternParser } from '@/rules/patternParser';
import type { Db } from '@/store/store';

/** The rules the demo starts with: a cap, two judgement rules and a category block, in US dollars. */
export const DEMO_RULES = `Up to $80 on any one item.
Only new items: nothing used or refurbished.
Ask me before buying anything that's a gift or for someone else.
No gift cards.`;

/**
 * One task per outcome, in this order: approved and paid, asks first, blocked (offline; live listings are all new).
 * The first two are the wordings that gave stable, unbranded live picks in Session 10 (BRIEF.md, "Video wordings").
 */
export const SUGGESTED_TASKS: readonly string[] = [
  'Buy a plain white ceramic coffee mug, under $15',
  "Buy a wooden building blocks set for my nephew's birthday, about $40",
  'Buy wireless headphones under $80',
];

/** Replaces the rules with the demo's and turns the agent on. Read with the offline parser, so it needs no keys. */
export async function seedDemo(db: Db): Promise<void> {
  db.rules = await patternParser.parse(DEMO_RULES);
  db.settings.agentEnabled = true;
}
