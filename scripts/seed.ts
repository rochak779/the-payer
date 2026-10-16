import { patternParser } from '@/rules/patternParser';
import { defaultStore, emptyDb } from '@/store/store';

const DEMO_RULES = `Hotels up to £150 a night.
Never spend more than £400 on one purchase.
Nothing non-refundable.
Ask me before buying anything that's a gift or for someone else.
No gift cards.`;

async function main() {
  const rules = await patternParser.parse(DEMO_RULES);
  defaultStore().update((db) => { Object.assign(db, emptyDb(), { rules }); });
  console.log(`Reset local data and saved ${rules.length} demo rules:`);
  for (const r of rules) console.log(`  [${r.kind} → ${r.onBreach}] ${r.source}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
