import { CHECKER_MODEL, claude } from '@/integrations/claude/client';

async function main() {
  const res = await claude().messages.create({
    model: CHECKER_MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: 'Reply with exactly one word: ready' }],
  });
  let text = '';
  for (const block of res.content) if (block.type === 'text') text += block.text;
  console.log(`${CHECKER_MODEL}: "${text.trim()}" (${res.usage.input_tokens} in / ${res.usage.output_tokens} out tokens)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
