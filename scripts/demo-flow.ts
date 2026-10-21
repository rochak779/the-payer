import { getDeps } from '@/deps';
import { executeRun, startRun, viewRun } from '@/flow/runs';

async function main() {
  const deps = await getDeps();
  const task = process.argv.slice(2).join(' ') || 'Book a hotel in Lisbon, 7–9 Nov';
  console.log(`Task: ${task}\n`);
  const run = startRun(deps.store, task, deps.clock());
  await executeRun(deps, run.id);
  const view = viewRun(deps.store.read(), run.id)!;
  for (const e of view.events) console.log(`[${e.kind}] ${e.text}`);
  const purchases = view.approvals.map((a) => `${a.id} ${a.outcome}/${a.status}`).join(', ') || 'none';
  console.log(`\nRun ${view.status}. Purchases: ${purchases}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
