// Every line of on-screen text, with when it shows (beats from its section's start). The scenes read their
// words from here and scripts/srt.ts writes the captions file from here, so the two can't drift apart.
// In `text`, "|" is a line break and *word* sits on the yellow highlight band. Plain TypeScript, no imports
// beyond the timing map, so Node can run it.
import type { SectionId } from './timing.ts';

export type Line = { key: string; section: SectionId; from: number; to: number; text: string };

export const LINES: Line[] = [
  // 1. Hook
  { key: 'hook.shop', section: 'hook', from: 0, to: 8, text: 'AI agents|can *shop* for you.' },
  { key: 'hook.ask', section: 'hook', from: 8, to: 16, text: 'Would you let one|*pay* without asking?' },
  { key: 'hook.only', section: 'hook', from: 16, to: 30, text: 'Only 3% would.' },
  { key: 'hook.source', section: 'hook', from: 19, to: 30, text: 'An October 2026 survey of 11,000 consumers' },

  // 2. The promise
  { key: 'promise.paypal', section: 'promise', from: 0, to: 8, text: 'PayPal made shops|*agent-ready.*' },
  { key: 'promise.payer', section: 'promise', from: 8, to: 16, text: 'The Payer makes|buyers *agent-safe.*' },
  { key: 'promise.name', section: 'promise', from: 16, to: 24, text: 'The Payer' },
  { key: 'promise.what', section: 'promise', from: 17, to: 24, text: 'Spending rules for your AI shopping agent' },

  // 3. Rules
  { key: 'rules.head', section: 'rules', from: 0, to: 24, text: 'Rules in|*plain* English.' },
  { key: 'rules.sub', section: 'rules', from: 2, to: 12, text: 'Write them the way you’d tell a person. The AI reads them back before anything is saved.' },
  { key: 'rules.sub2', section: 'rules', from: 12, to: 24, text: 'Hard limits are checked by code. Judgement calls are checked by AI.' },

  // 4. The mug
  { key: 'mug.task', section: 'mug', from: 0, to: 24, text: 'Buy a plain white ceramic coffee mug, under $15' },
  { key: 'mug.stamp', section: 'mug', from: 8, to: 24, text: 'Approved' },
  { key: 'mug.head', section: 'mug', from: 9, to: 24, text: 'PayPal holds|exactly *$12*.' },
  { key: 'mug.paid', section: 'mug', from: 16, to: 24, text: 'Paid $12, once, for this purchase only.' },

  // 4b. PayPal's record
  { key: 'record.title', section: 'record', from: 0, to: 16, text: 'PayPal’s record' },
  { key: 'record.source', section: 'record', from: 0, to: 16, text: 'PayPal sandbox API' },
  { key: 'record.order', section: 'record', from: 2, to: 16, text: 'Order' },
  { key: 'record.hold', section: 'record', from: 4, to: 16, text: 'Hold' },
  { key: 'record.capture', section: 'record', from: 6, to: 16, text: 'Capture' },
  { key: 'record.sum', section: 'record', from: 9, to: 16, text: '1 hold · 1 capture · exactly $12.00' },
  { key: 'record.match', section: 'record', from: 11, to: 16, text: 'Same capture id in the app’s log' },

  // 5. The present
  { key: 'nephew.task', section: 'nephew', from: 0, to: 14, text: 'Buy a wooden building blocks set for my nephew’s birthday, about $40' },
  { key: 'nephew.head', section: 'nephew', from: 6, to: 14, text: 'A present?|It *asks* you first.' },
  { key: 'nephew.stamp', section: 'nephew', from: 6, to: 14, text: 'Asking you' },
  { key: 'nephew.tap', section: 'nephew', from: 14, to: 24, text: 'One tap|to *approve*.' },
  { key: 'nephew.approved', section: 'nephew', from: 19, to: 24, text: 'Approved' },
  { key: 'nephew.paid', section: 'nephew', from: 24, to: 32, text: 'Paid exactly|*$38*.' },

  // 6. The headphones
  { key: 'headphones.task', section: 'headphones', from: 0, to: 16, text: 'Buy wireless headphones under $80' },
  { key: 'headphones.head', section: 'headphones', from: 6, to: 16, text: 'Refurbished?|*Blocked.*' },
  { key: 'headphones.stamp', section: 'headphones', from: 6, to: 16, text: 'Blocked' },
  { key: 'headphones.sub', section: 'headphones', from: 7, to: 16, text: 'Your rule: only new items. The AI checker read the listing.' },

  // 7. The shop tries it on
  { key: 'shop.head', section: 'shop', from: 0, to: 22, text: 'Now the *shop*|tries it on.' },
  { key: 'shop.more', section: 'shop', from: 4, to: 22, text: 'Shop asks for $20 more' },
  { key: 'shop.other', section: 'shop', from: 10, to: 22, text: 'Another shop asks' },
  { key: 'shop.again', section: 'shop', from: 16, to: 22, text: 'Shop asks again' },
  { key: 'shop.refused', section: 'shop', from: 4, to: 22, text: 'Refused' },
  { key: 'shop.paypal', section: 'shop', from: 22, to: 32, text: 'On its own, PayPal lets a shop take up to 15% more than was held (capped at $75).' },
  { key: 'shop.penny', section: 'shop', from: 25, to: 32, text: 'Your mandate holds it|to the *penny*.' },

  // 8. The off switch
  { key: 'off.head', section: 'off', from: 0, to: 24, text: 'One switch.' },
  { key: 'off.waiting', section: 'off', from: 0, to: 4, text: 'A purchase is waiting for you.' },
  { key: 'off.stops', section: 'off', from: 4, to: 24, text: 'Everything *stops*.' },
  { key: 'off.cancelled', section: 'off', from: 6, to: 15, text: 'The waiting purchase is cancelled.' },
  { key: 'off.stamp', section: 'off', from: 6, to: 15, text: 'Cancelled' },
  { key: 'off.task', section: 'off', from: 15, to: 24, text: 'A new task stops at once.' },

  // 9. Live
  { key: 'live.head', section: 'live', from: 0, to: 24, text: 'Live, with|real US *shops*.' },
  { key: 'live.sub', section: 'live', from: 2, to: 24, text: 'A Gemini agent searches Channel3, the checker decides, and PayPal’s sandbox pays.' },
  { key: 'live.label', section: 'live', from: 0, to: 24, text: 'Live: Channel3 + PayPal sandbox · shop names blurred' },

  // 10. Evals
  { key: 'evals.head', section: 'evals', from: 0, to: 24, text: 'Measured,|not *guessed*.' },
  { key: 'evals.set', section: 'evals', from: 2, to: 24, text: '67 labelled purchase requests, one fixed set of 10 rules' },
  { key: 'evals.wrong', section: 'evals', from: 4, to: 24, text: 'Wrong approvals: money spent that shouldn’t have been' },
  { key: 'evals.keyword', section: 'evals', from: 5, to: 24, text: 'Keyword rules: 17' },
  { key: 'evals.payer', section: 'evals', from: 7, to: 24, text: 'The Payer’s AI checker: 0 to 1 per run' },
  { key: 'evals.heldout', section: 'evals', from: 13, to: 24, text: '17 held-out cases, never used for tuning: 14 of 17 right and 0 wrong approvals, in both runs. Keyword rules: 9 right, 5 wrong approvals.' },
  { key: 'evals.source', section: 'evals', from: 4, to: 24, text: 'Gemini 3.5 Flash-Lite, prompt v4, two runs · evals/RESULTS.md' },

  // 11. Outro
  { key: 'outro.name', section: 'outro', from: 0, to: 30, text: 'The Payer' },
  { key: 'outro.line', section: 'outro', from: 1, to: 16, text: 'Your rules, in plain English. Never a cent more than you approved.' },
  { key: 'outro.built', section: 'outro', from: 4, to: 30, text: 'Built on PayPal (Orders v2 + Vault, sandbox) · Gemini 3.5 Flash-Lite · Channel3 · Render' },
  { key: 'outro.claude', section: 'outro', from: 6, to: 30, text: 'Built with Claude Code' },
  { key: 'outro.try', section: 'outro', from: 16, to: 30, text: 'Try it: https://the-payer.onrender.com' },
  { key: 'outro.code', section: 'outro', from: 17, to: 30, text: 'Code: github.com/rochak779/the-payer' },
];

export function line(key: string): Line {
  const l = LINES.find((x) => x.key === key);
  if (!l) throw new Error(`No line ${key}`);
  return l;
}
export const text = (key: string) => line(key).text;
/** The words with the markup taken out, as a caption reads them. */
export const plain = (t: string) => t.replace(/\*/g, '').replace(/\|/g, ' ');
