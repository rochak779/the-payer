import { createChannel3Search } from '@/integrations/channel3/search';

/** Live check of Channel3 search (one search, about one credit). Usage: npm run channel3:smoke "white ceramic mug" */
async function main() {
  const query = process.argv.slice(2).join(' ') || 'white ceramic mug';
  const results = await createChannel3Search().search(query);
  console.log(`"${query}": ${results.length} result(s)`);
  for (const r of results) {
    const o = r.offer;
    console.log(`- ${r.title}\n  ${o ? `${o.shop} · ${o.price.currency} ${(o.price.minor / 100).toFixed(2)} · ${o.condition}` : 'no offer'}`);
  }
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
