// Writes out/the-payer-demo.srt: every line of on-screen text, timed from the same story map the edit uses.
//   node scripts/srt.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, plain } from '../src/story.ts';
import { at, startBar, TOTAL_SECONDS } from '../src/timing.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const record = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/paypal-record.json'), 'utf8'));
const money = (a: { value: string; currency: string }) => `$${a.value} ${a.currency}`;
// The record card's rows show PayPal's ids next to their labels.
const ROWS: Record<string, string> = {
  'record.order': `Order ${record.order.id} · ${record.order.status}`,
  'record.hold': `Hold ${record.holds[0].id} · ${record.holds[0].status} · ${money(record.holds[0].amount)}`,
  'record.capture': `Capture ${record.captures[0].id} · ${record.captures[0].status} · ${money(record.captures[0].amount)}`,
};
const PREFIX: Record<string, string> = { 'mug.task': 'You ask the agent: ', 'nephew.task': 'You ask the agent: ', 'headphones.task': 'You ask the agent: ' };

const stamp = (s: number) => {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const cues = LINES.map((l) => {
  const start = at(startBar(l.section), l.from);
  const end = Math.min(at(startBar(l.section), l.to), TOTAL_SECONDS);
  const words = ROWS[l.key] ?? (PREFIX[l.key] ?? '') + plain(l.text) + (l.key.endsWith('.name') ? '.' : '');
  return { start, end, words };
}).sort((a, b) => a.start - b.start || a.end - b.end);

const srt = cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.words}\n`).join('\n');
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out/the-payer-demo.srt'), srt);
console.log(`wrote out/the-payer-demo.srt (${cues.length} captions)`);
