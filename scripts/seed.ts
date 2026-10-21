import { seedDemo } from '@/demo/demoContent';
import { defaultStore, emptyDb } from '@/store/store';

async function main() {
  const seeded = emptyDb();
  await seedDemo(seeded);
  defaultStore().update((db) => { Object.assign(db, seeded); });
  console.log(`Reset local data and saved ${seeded.rules.length} demo rules:`);
  for (const r of seeded.rules) console.log(`  [${r.kind} → ${r.onBreach}] ${r.source}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
