import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { keyOf, sameRules, type ExpectedRule } from '@/evals/parseEval';
import { getRuleParser } from '@/rules/registry';

type ParseCase = { id: string; text: string; expected: ExpectedRule[]; source?: string };

async function main() {
  const { values } = parseArgs({ options: { parser: { type: 'string', default: process.env.PARSER ?? 'pattern' } } });
  const parser = getRuleParser(values.parser!);
  const cases = JSON.parse(fs.readFileSync(path.join('evals', 'parse-cases.json'), 'utf8')) as ParseCase[];
  const results = [];
  for (const c of cases) {
    const rules = await parser.parse(c.text);
    results.push({ id: c.id, text: c.text, correct: sameRules(rules, c.expected), got: rules.map(keyOf), want: c.expected.map(keyOf) });
  }
  const correct = results.filter((r) => r.correct).length;
  console.log(`Parser: ${parser.name}\nRule-reading accuracy: ${correct}/${results.length}\n`);
  for (const r of results.filter((x) => !x.correct)) console.log(`  ${r.id} "${r.text}"\n    want ${r.want.join(' ')}\n    got  ${r.got.join(' ')}`);
  const dir = path.join('evals', 'results', 'parse');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}_${parser.name.replace(/[^a-z0-9.-]+/gi, '_')}.json`);
  fs.writeFileSync(file, JSON.stringify({ parser: parser.name, correct, total: results.length, results }, null, 2));
  console.log(`\nSaved ${file}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
