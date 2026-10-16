# Agent Mandates

Plain-English spending rules for a personal AI shopping agent, a checker that decides **approve / ask / block** with a reason, and one-time cards that only work for what was approved.

Shopping agents can now spend money for people. Today's options are "approve every purchase" or simple spending caps. This is the layer in between: it decides when it's safe to skip asking, and it measures how often that decision is right. It's designed as a feature for whoever issues the agent's payment credential (a wallet or a bank), not as a standalone app.

**Status (16 Oct 2026):** everything runs end to end on offline stand-ins, with 126 automated tests. Firecrawl search has been smoke-tested live (5 real results). As a free stopgap, the checker and rule reader can also run on Google Gemini with the same instructions (`CHECKER=gemini`, `PARSER=gemini`); the free tier is too small for a full eval run (see `evals/RESULTS.md`). The real Claude checker and agent and the Stripe sandbox cards are built behind switches but **have not been run live yet**, because their keys aren't on the build machine yet. The Claude eval numbers are pending for the same reason.

## Run it (offline, no keys)
Needs Node 22.9 or later.

```bash
npm install
npm run seed      # clean data and five demo rules
npm run dev       # http://localhost:3000
```

Offline, the agent picks from canned listings (a hotel in Lisbon, a present for a nephew, headphones, a book), the checker is a simple keyword baseline, and cards are fake. From the terminal: `npm run demo:flow -- "Book a hotel in Lisbon, 7–9 Nov"`.

## Run it for real
Copy `.env.example` to `.env.local`, then set:

```
CHECKER=claude  PARSER=claude  SEARCH=firecrawl  SHOPPER=claude  ISSUER=stripe
ANTHROPIC_API_KEY, FIRECRAWL_API_KEY, STRIPE_SECRET_KEY, STRIPE_CARDHOLDER_ID, STRIPE_WEBHOOK_SECRET
```

Each switch is separate, so you can turn on one service at a time. Smoke tests: `npm run claude:smoke`, `npm run gemini:smoke` and `npm run firecrawl:smoke`.

Stripe needs a **sandbox** account with Issuing turned on, a funded GBP Issuing balance and one cardholder (`ich_…`). The code refuses any key that doesn't start with `sk_test_`. Then run the Stripe CLI:

```bash
stripe listen --events issuing_authorization.request --forward-to localhost:3000/api/stripe/webhook
```

In Issuing settings, set the real-time authorisation timeout fallback to **decline**. Stripe waits only 2 seconds for the app's answer; if the app is slow (for example, `next dev` compiling the route on first use), the charge must fail safe.

## How it decides
1. **Code checks the hard limits:** amount, shop, category, dates. Limits are inclusive. Going over a limit means "ask", unless the rule says never / no / nothing / don't, which means "block". A price in another currency means "ask".
2. **Claude judges the fuzzy rules** ("nothing non-refundable", "ask me about gifts", "ask me if a shop might not be genuine") and flags hidden costs and prompt injection. It reports facts and code turns them into outcomes, so the AI can only make a decision stricter. If it fails, times out or returns junk, the answer is "ask".
3. **At payment time, code alone** checks the charge against the approval: amount, merchant, used once, not expired, agent still on.

The agent never holds payment details. After approval the app creates a one-time card for exactly that amount (the agent never sees it), and the payment check only lets it pay the approved merchant once, so a leaked card is useless. Listing and merchant text is data, never instructions, and only the user's tap approves an "ask".

## Evals
65 labelled purchase requests against one fixed set of 10 rules: 48 for tuning ("dev") and 17 held out ("test"). Categories: clearly within or against the rules, ambiguous, rule conflicts, price edge cases, refund wording, gifts and other people, prompt injection. Labelling policy: `evals/README.md`.

| Checker | Split | Correct | Wrong approvals | Needless asks |
|---|---|---|---|---|
| Keyword baseline | dev (48) | 27 (56%) | 12 | 8 |
| Keyword baseline | held out (17) | 9 (53%) | 5 | 3 |
| Claude (`claude-sonnet-5-5`) | both | pending | pending | pending |
| Gemini (`gemini-3.8-flash`), free tier, partial | 22 of 65 answered | 22 (keyword: 19) | 0 (keyword: 2) | 0 |

The baseline shows both failure modes the real checker has to beat. It asks needlessly on harmless words ("Hotel Chocolat" trips the hotel-rating rule) and misses paraphrases ("All sales final" passes "nothing non-refundable").

**Rule reading** ("here's what I understood"): 20 plain-English rules. The offline pattern reader gets 13/20; Claude is pending.

Commands: `npm run eval -- --checker claude --label v1` and `npm run eval:parse -- --parser claude`. Results are in `evals/RESULTS.md`, on the `/evals` page, and as saved runs in `evals/results/`.

## AP2 export
The Rules tab can show your saved rules as an **AP2 v0.2 open Payment Mandate** (the Agent Payments Protocol). Purchase caps, allow-only shop lists and date windows map to AP2 constraints. AP2 v0.2 has no field for judgement rules, blocked shops, categories or per-night caps, so those travel in an `x_agent_mandates` extension. Field names come from the AP2 repo (commit `e1ea56d`), not guesswork; see "Still to verify" in `BRIEF.md`. The export is unsigned content, not a signed mandate.

## Scope
- Spending only. Non-payment actions (sharing an address, reading email) can't be stopped at the payment step.
- One local user, no login, no deployment. Storage is one JSON file, `data/db.json`.

## Demo checklist
- `npm run seed` (clean data, demo rules)
- `.env.local` has all five switches and the keys; `npm run claude:smoke` and `npm run firecrawl:smoke` pass
- Stripe sandbox Issuing balance funded; timeout fallback set to decline
- `stripe listen …` running (or tunnel up), `STRIPE_WEBHOOK_SECRET` current
- `curl localhost:3000/api/stripe/webhook` (warm-up: `next dev` compiles the route on first use)
- One dry run of every step below

## Video run-of-show (about 90 seconds)
1. **Rules.** Type "Hotels up to £150 a night. Nothing non-refundable. Ask me about gifts." → "Show me what you understood" → Save.
2. **Ask.** "Book a hotel in Lisbon 7–9 Nov" → live search → approved → paid with a one-time card.
3. **Ask.** "Birthday present for my nephew" → "Asking you" → Approvals → Approve.
4. **Activity.** "charge £20 more" → declined by the card limit; "charge from another shop" → declined by the payment check.
5. **Turn off agent** → the next request is blocked.
6. **Evals.** Keyword baseline vs Claude v1 vs v2: wrong approvals and needless asks.

Notes:
- Steps 1–5 were dry-run offline on the stand-ins (16 Oct 2026) and behave as above. Offline, the fake card lists every reason for a decline ("already used" as well as "over the approved amount" or "not the approved merchant"). Step 6 needs the Claude rows.
- Live with Stripe, step 4 may look different: the card has already paid the full approved amount, so Stripe's own card limit will probably decline "charge from another shop" before our payment check is asked. The Activity log names whichever check declined it. Confirm this on the first live run (plan Session 33, step 6); if so, either say it that way in the video or show the merchant check offline.
- Live search results vary. If the agent picks a hotel that triggers an "ask" in step 2, show the reason and approve it: that is still the story.

## Tech notes
- Next.js 16.4, TypeScript (strict), Zod, Vitest. Cache Components is **off** in `next.config.ts`: every page reads the JSON file on each request, so `export const dynamic = 'force-dynamic'` is the simpler model.
- Money is whole pence everywhere and only formatted for display.
- Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Spec and decisions: `BRIEF.md`. Build plan: `docs/superpowers/plans/2026-10-15-agent-mandates.md`.
