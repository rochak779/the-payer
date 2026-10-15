import { createFirecrawlSearch } from '@/integrations/firecrawl/search';

async function main() {
  const query = process.argv.slice(2).join(' ') || 'refundable hotels Lisbon under £150 a night';
  const results = await createFirecrawlSearch().search(query);
  for (const r of results) console.log(`- ${r.title}\n  ${r.url}\n  ${r.snippet.slice(0, 160).replace(/\s+/g, ' ')}…`);
}

main().catch((err) => { console.error(err); process.exit(1); });
