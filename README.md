# Agent Mandates

Plain-English spending rules for a personal AI shopping agent, a checker that decides **approve / ask / block** with a reason, and one-time cards that only work for what was approved.

Shopping agents can now spend money for people. Today's options are "approve every purchase" or simple spending caps. This is the layer in between: it decides when it's safe to skip asking, and it measures how often that decision is right. It's designed as a feature for whoever issues the agent's payment credential (a wallet or a bank), not as a standalone app.

**Status (19 Oct 2026):** everything runs end to end on offline stand-ins, with 166 automated tests. The AI parts (checker, rule reader and shopper agent) are **measured on Google's free `gemini-3.5-flash-lite`**, using the instructions written for Claude (`CHECKER=gemini`, `PARSER=gemini`, `SHOPPER=gemini`). The checker scores 14/17 on the held-out cases (9/17 for the keyword baseline) with 0–1 wrong approvals per run across all 67 cases (keyword: 17). The rule reader gets 21/22 and 20/22 (pattern reader: 14/22). See `evals/RESULTS.md`. The AI agent has run both demo tasks on the canned search and on live Firecrawl search. Firecrawl search has been smoke-tested live (5 real results). Stripe sandbox cards have been tested live: our webhook's answer is honoured, and a slow or missing answer is declined. **The Claude versions are built behind the same switches but unmeasured**, because there's no Anthropic key.

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
CHECKER=gemini  PARSER=gemini  SEARCH=firecrawl  SHOPPER=gemini  PAYMENTS=stripe
GEMINI_API_KEY, FIRECRAWL_API_KEY, STRIPE_SECRET_KEY, STRIPE_CARDHOLDER_ID, STRIPE_WEBHOOK_SECRET
```

Each switch is separate, so you can turn on one service at a time. For Claude instead, set `CHECKER=claude PARSER=claude SHOPPER=claude` and `ANTHROPIC_API_KEY`; that version is built but not yet measured. Smoke tests: `npm run gemini:smoke`, `npm run claude:smoke` and `npm run firecrawl:smoke`.

Gemini uses the free `gemini-3.5-flash-lite` unless `GEMINI_MODEL` says otherwise. Its free tier allows **500 requests a day**: one eval run uses 67 and one agent task up to 12. The bigger `gemini-3.8-flash` allows only 20 free calls a day, too few for one eval run. Google may use free-tier prompts to improve its products, so use mock data only.

Stripe needs a **sandbox** account with Issuing turned on, a funded GBP Issuing balance and one cardholder (`ich_…`). The code refuses any key that doesn't start with `sk_test_`. Then run the Stripe CLI:

```bash
stripe listen --events issuing_authorization.request --forward-to localhost:3000/api/stripe/webhook
```

In Issuing settings, set the real-time authorisation timeout fallback to **decline**. Stripe waits only 2 seconds for the app's answer; if the app is slow (for example, `next dev` compiling the route on first use), the charge must fail safe.

## Run it with PayPal (sandbox)
Needs a PayPal developer sandbox app (Merchant type, with **Save payment methods** ticked) linked to a **US** sandbox business account, plus a personal sandbox account as the buyer. Payments are in US dollars. The code only ever calls `api-m.sandbox.paypal.com`.

In `.env.local`:

```
PAYMENTS=paypal
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
PAYPAL_VAULT_ID   # optional: a demo buyer's saved PayPal, used until you connect your own
APP_URL           # optional locally (defaults to http://localhost:3000); the hosted URL when deployed
```

Then `npm run seed` and `npm run dev`:

1. **Connect PayPal** on the Ask screen (or **Connect your own PayPal** if a demo buyer is set). PayPal opens in a new tab: log in as the sandbox buyer and agree. PayPal's sandbox then shows an error page instead of sending you back, but it has recorded your approval. Close that tab and press **Finish connecting**: the app checks with PayPal before saving.
2. **Run the three suggested tasks:**
   - **Mug, $12:** approved by your rules and paid at once. PayPal holds exactly $12, and the app takes it only after the payment check agrees.
   - **Nephew's present, $38:** the checker asks you. Approve it on the Approvals screen and it's paid the same way.
   - **Headphones:** blocked, because they're refurbished.
3. **On Activity,** each paid purchase shows "PayPal took $12 (capture …)". Press **Shop asks for $20 more**, **Another shop asks** or **Shop asks again**: the payment check refuses each one before PayPal is called.
4. **Turn the agent off:** anything waiting for you is cancelled, and open PayPal holds are voided.

**What to look for in the sandbox:** log in as the buyer at sandbox.paypal.com and open Activity. You should see one payment of exactly $12.00 and one of $38.00, and nothing from the demo buttons. Check from the buyer's side: the shop's own sandbox login was refused in testing.

## Deploy on Render
`render.yaml` is a Render Blueprint for one web service: Node 24 (from `.node-version`), the Starter plan, in Frankfurt. Render builds with `npm ci && npm run build`, starts with `npm start`, and checks `/api/health`, which answers `{ "ok": true }` without reading any data, key or outside service. The build needs no keys.

The Blueprint turns on hosted mode (`HOSTED=1`): each visitor gets their own seeded data file and daily limits, and the agent, checker and rule reader use Gemini, with Channel3 search and PayPal payments. It holds no secrets. Render asks for these when you create the Blueprint:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini key (the free one is fine). Past the app's own daily limits (below), runs use the offline agent with a one-line notice. If Google's allowance runs out first, a run stops and says Gemini is over its usage limit; nothing is approved. |
| `CHANNEL3_API_KEY` | Your Channel3 key. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | The PayPal sandbox app's keys. |
| `PAYPAL_VAULT_ID` | The demo buyer's saved PayPal, so visitors start connected. |
| `APP_URL` | The service's own address, such as `https://the-payer.onrender.com`. It's shown at the top of the service's page after the first deploy; if it differs, change it under **Environment**. |

1. In Render, choose **New → Blueprint** and pick this repo. Render reads `render.yaml`.
2. Type in the values above, then deploy.
3. Once it's live, check `APP_URL` matches the service's address.

Good to know:
- **Don't set `NODE_ENV` yourself.** Render sets it to `production` when the app runs. Set at build time, it would make `npm ci` skip the build tools.
- **Visitor data is temporary.** It lives on the service's own disk, and every deploy wipes it, so the next visit starts seeded again.
- **Every merge to `main` redeploys** (Render's default).
- **Daily limits** default to 8 tasks per visitor, 30 tasks a day and 20 rule previews per visitor. To change them, add `LIMIT_TASKS_PER_VISITOR`, `LIMIT_TASKS_PER_DAY` or `LIMIT_PREVIEWS_PER_VISITOR` under **Environment**.

## How it decides
1. **Code checks the hard limits:** amount, shop, category, dates. Limits are inclusive. Going over a limit means "ask", unless the rule says never / no / nothing / don't, which means "block". A price in another currency means "ask".
2. **An AI checker judges the fuzzy rules** ("nothing non-refundable", "ask me about gifts", "ask me if a shop might not be genuine") and flags hidden costs and prompt injection. It's measured on Gemini Flash-Lite; the Claude version runs the same instructions behind a switch. It reports facts and code turns them into outcomes, so the AI can only make a decision stricter. If it fails, times out or returns junk, the answer is "ask".
3. **At payment time, code alone** checks the charge against the approval: amount, merchant, used once, not expired, agent still on.

**No double booking:** within one task, the agent can make up to two different purchases, but a repeat request at the same shop for the same price as one that's waiting, approved or paid is refused, even if worded differently (e.g. a retry after a charge failed part-way).

The agent never holds payment details. After approval the app creates a one-time card for exactly that amount (the agent never sees it), and the payment check only lets it pay the approved merchant once, so a leaked card is useless. Listing and merchant text is data, never instructions, and only the user's tap approves an "ask".

## Evals
67 labelled purchase requests against one fixed set of 10 rules: 50 for tuning ("dev") and 17 held out ("test"). Categories: clearly within or against the rules, ambiguous, rule conflicts, price edge cases, refund wording, gifts and other people, prompt injection. Labelling policy: `evals/README.md`.

| Checker | Split | Correct | Wrong approvals | Needless asks |
|---|---|---|---|---|
| Keyword baseline | dev (50) | 28 (56%) | 12 | 8 |
| Keyword baseline | held out (17) | 9 (53%) | 5 | 3 |
| Claude (`claude-sonnet-5-5`) | both | not measured (no key) | – | – |
| Gemini 3.5 Flash-Lite (free), prompt v4, two runs | dev (50)* | 48, 47 | 0, 1 | 1, 1 |
| Gemini 3.5 Flash-Lite (free), prompt v4, two runs | held out (17) | 14, 14 (82%) | 0, 0 | 2, 2 |

*Dev includes two cases written alongside the relabelling change; on the original 48 dev cases v4 scores 46 and 45. Held-out wrong approvals are 0–1 per run across v3 and v4 (v3's first run wrongly approved `ambiguous-07`, two ratings that disagree), so v4's two clean runs may be partly luck. One run moves by a case or two.

The baseline shows both failure modes the real checker has to beat. It asks needlessly on harmless words ("Hotel Chocolat" trips the hotel-rating rule) and misses paraphrases ("All sales final" passes "nothing non-refundable").

**Rule reading** ("here's what I understood"): 22 plain-English rules. The offline pattern reader gets 15/22 (14/22 before it read `$` and `€`, 21 Oct). Gemini Flash-Lite gets 21/22 and 20/22 over two runs with reader prompt v2, which fixed "Ask me about gifts." being read as "only gift cards". Claude is unmeasured (no key).

Commands: `npm run eval -- --checker gemini --concurrency 1 --label v4` and `npm run eval:parse -- --parser gemini` (or `claude` once there's a key). Results are in `evals/RESULTS.md`, on the `/evals` page, and as saved runs in `evals/results/`.

## AP2 export
The Rules tab can show your saved rules as an **AP2 v0.2 open Payment Mandate** (the Agent Payments Protocol). Purchase caps, allow-only shop lists and date windows map to AP2 constraints. AP2 v0.2 has no field for judgement rules, blocked shops, categories or per-night caps, so those travel in an `x_agent_mandates` extension. Field names come from the AP2 repo (commit `e1ea56d`), not guesswork; see "Still to verify" in `BRIEF.md`. The export is unsigned content, not a signed mandate.

## Scope
- Spending only. Non-payment actions (sharing an address, reading email) can't be stopped at the payment step.
- One local user, no login, no deployment. Storage is one JSON file, `data/db.json`.

## Demo checklist
- `npm run seed` (clean data, demo rules)
- `.env.local` has all five switches and the keys; `npm run gemini:smoke` and `npm run firecrawl:smoke` pass
- Gemini's free daily limit (500 requests) not used up: don't run evals on demo day
- Stripe sandbox Issuing balance funded; timeout fallback set to decline
- `stripe listen …` running (or tunnel up), `STRIPE_WEBHOOK_SECRET` current
- `curl localhost:3000/api/stripe/webhook` (warm-up: `next dev` compiles the route on first use)
- One dry run of every step below

## Video run-of-show (about 90 seconds)
1. **Rules.** Type "Hotels up to £150 a night. Nothing non-refundable. Ask me about gifts." → "Show me what you understood" → Save.
2. **Approve.** "Book a hotel in Lisbon 7–9 Nov" → search → approved → paid with a one-time card.
3. **Ask.** "Birthday present for my nephew" → "Asking you" → Approvals → Approve.
4. **Activity.** "charge £20 more" → declined by the card limit; "charge from another shop" → declined by the payment check.
5. **Turn off agent** → the next request is blocked.
6. **Evals.** Keyword baseline vs the AI checker (Gemini Flash-Lite, prompt v1 vs v4): wrong approvals and needless asks.

Notes:
- Steps 1–5 were dry-run offline on the stand-ins (16 Oct 2026) and behave as above. Offline, the fake card lists every reason for a decline ("already used" as well as "over the approved amount" or "not the approved merchant"). Step 6's rows are in `evals/RESULTS.md`; there are no Claude rows yet (no key).
- **Live with Stripe (checked 16 Oct 2026), step 4 looks different:** the card has already paid the full approved amount, so Stripe's own card limit declines "charge from another shop" (and "charge again") before our payment check is asked. Activity says "Declined by the card's own spending limit at Stripe" for all three. In the video, say it that way ("the card itself refuses anything beyond what you approved"), or show the merchant check offline, where Activity names the shop.
- **Sandbox balance for the video:** Stripe checks the Issuing balance *before* the card's limit. For the Activity buttons to show "declined by the card's own spending limit", the balance left after the booking must still cover the attack charge: at least **£500 per Lisbon take** (£240 booking + £260 "charge £20 more"). Otherwise Activity shows "balance is too low" instead. Top up about £1,000 before recording a few takes, or use the £35 book, which needs only about £90.
- **Record steps 2–3 on the canned search** (leave `SEARCH` unset), with the AI agent and checker on (`SHOPPER=gemini CHECKER=gemini`). Checked 17 Oct 2026: Lisbon → Hotel Lisboa Plaza, £240, approved and paid; nephew → LEGO Technic, £60, "Asking you". Same result every take, and in pounds.
- **Live search (`SEARCH=firecrawl`) is less predictable.** Checked 17 Oct 2026: the nephew task found a real LEGO set at John Lewis for £64.98 and asked, which works well. The Lisbon task picked a hotel from a "from €214 a night" line on a guide site, and the checker asked because the price was in euros and the refund policy unclear. Approving that on the Stripe card is untested: Stripe may refuse a euro card, and then Activity shows "Couldn't create a card" and nothing is charged. If you want live search in the video, use it for the nephew step only.

## Tech notes
- Look: The Product Kinship's colours and type (Manrope, with Ephesis for one word per screen), built with Impeccable. Product context is in `PRODUCT.md`, the design system in `DESIGN.md`.
- Next.js 16.4, TypeScript (strict), Zod, Vitest. Cache Components is **off** in `next.config.ts`: every page reads the JSON file on each request, so `export const dynamic = 'force-dynamic'` is the simpler model.
- Money is whole pence everywhere and only formatted for display.
- Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Spec and decisions: `BRIEF.md`. Build plan: `docs/superpowers/plans/2026-10-15-agent-mandates.md`.
