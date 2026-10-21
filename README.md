# The Payer

**Let an AI shopping agent pay with PayPal, but only for what your plain-English rules allow, and never a cent more than you approved.**

PayPal made shops agent-ready. The Payer makes buyers agent-safe. You write spending rules the way you'd tell a person. When the agent wants to buy something, a checker decides **approve**, **ask you** or **block**, with a reason. An approved purchase becomes a PayPal hold for exactly its price, and code alone decides whether the shop gets paid.

Built for the PayPal AI Hackathon (October to November 2026), entirely on PayPal's developer sandbox.

## Try it

**HOSTED_URL_TBD**

- **Nothing to install, no login.** Each visitor gets their own copy of the demo: four spending rules, and a PayPal sandbox buyer that's already connected (the Ask screen says "Using the demo PayPal buyer (sandbox)").
- **Optional: use your own PayPal sandbox buyer.** If you have a personal account in PayPal's developer sandbox, press **Connect your own PayPal** on the Ask screen. PayPal opens in a new tab: log in and agree. PayPal's sandbox then shows an error page instead of sending you back, but it has recorded your approval. Close that tab and press **Finish connecting**; the app checks with PayPal before saving.
- **Please type nothing personal.** The demo uses Gemini's free tier, and Google may use free-tier prompts to improve its products.
- It's sandbox money in US dollars. Nothing real is bought or paid.

## A 3-minute tour

1. **Rules.** The demo starts with four rules:
   - Up to $80 on any one item.
   - Only new items: nothing used or refurbished.
   - Ask me before buying anything that's a gift or for someone else.
   - No gift cards.

   Write your own and press **Show me what you understood** to see how the app reads them before you save.
2. **Ask: the mug.** Press the suggestion "Buy a plain white ceramic coffee mug, under $15". The agent searches real US shops through Channel3, picks a listing and asks to buy it. The rules allow it, so PayPal holds exactly the listing's price, the payment check agrees, and PayPal takes it: "Paid $…, once, for this purchase only."
3. **Ask: the present.** "Buy a wooden building blocks set for my nephew's birthday, about $40". The gift rule means it asks you first. Open **Approvals**, see why, and press **Approve**. It's paid the same way.
4. **Ask: the headphones.** "Buy wireless headphones under $80". Live listings are almost always new, so this one is usually approved and paid. On the offline listings the headphones are refurbished, and "Only new items" blocks them: run it locally to see that.
5. **Activity.** Every decision is listed with its reason, and each paid purchase shows "PayPal took $… (capture …)". On a paid purchase, play the shop trying it on: **Shop asks for $20 more**, **Another shop asks** or **Shop asks again**. The payment check refuses each one before PayPal is even called. (On its own, PayPal lets a shop take up to 15% more than was held, capped at $75. Your rules hold it to the penny.)
6. **The off switch.** Turn the agent off on Activity: anything waiting for you is cancelled, open PayPal holds are voided, and new tasks are refused. Turn it back on to carry on.
7. **How well does it decide?** The button at the bottom of Activity shows the checker's measured scores against a keyword baseline (see Evals below).

## How it works

```
your rules → shopping agent → checker → (you, if it asks) → PayPal hold → payment check → PayPal capture
```

1. **Rules in plain English.** The rule reader turns each sentence into a structured rule and shows it back ("here's what I understood") before anything is saved. Hard limits (amount, shop, category, dates) become rules that code checks. Fuzzy ones ("only new items", "ask me about gifts") become judgement rules.
2. **The shopping agent** has exactly two tools: search, and ask to buy. It never gets PayPal tools, tokens or ids, so it can't pay for anything itself.
3. **The checker decides approve, ask or block.** Code checks the hard limits. The AI judges only the fuzzy rules, and reports facts (clear, breached or unsure, plus hidden costs and prompt-injection attempts); code turns those facts into the decision. So the AI can only make a decision stricter: it can never approve something a hard limit stops. If the AI fails or returns junk, the answer is "ask". Shop and listing text is treated as data, never as instructions.
4. **An approved purchase becomes a PayPal hold** for exactly its total, paid from the buyer's saved PayPal. An "ask" waits for your tap on Approvals; only your tap counts as consent.
5. **When the shop asks to be paid, code alone checks the charge** against the approval: the amount, the shop, used once, not expired, and the agent still on. Only then does the app capture the hold. A refused charge never reaches PayPal, and a failed or retried capture can never pay twice.
6. **The off switch** cancels everything waiting and voids open holds.

The Rules tab can also export your rules as an **AP2 v0.2 open Payment Mandate** (the Agent Payments Protocol). Rules AP2 has no field for travel in an extension.

## PayPal APIs used

All calls go to `https://api-m.sandbox.paypal.com`. The address is fixed in code, so no setting can point the app at live PayPal.

| What | API | When |
|---|---|---|
| Sign in as the app | OAuth 2.0 client credentials, `POST /v1/oauth2/token` | Before other calls. The token is reused until it expires. |
| Save the buyer's PayPal once | Vault v3: `POST /v3/vault/setup-tokens`, then `GET /v3/vault/setup-tokens/{id}` and `POST /v3/vault/payment-tokens` | "Connect PayPal", then "Finish connecting" |
| Hold exactly the approved amount | Orders v2: `POST /v2/checkout/orders` with `intent: AUTHORIZE` and the saved PayPal (`vault_id`), with the buyer away | When a purchase is approved |
| Take the money | Payments v2: `POST /v2/payments/authorizations/{id}/capture` (final capture) | Only after the payment check approves the shop's charge |
| Cancel a hold | Payments v2: `POST /v2/payments/authorizations/{id}/void` | The off switch |

Every call that moves money sends a fixed `PayPal-Request-Id` built from the purchase and the step, so a retried call can't pay twice. Only a `COMPLETED` capture counts as paid. **Refunds aren't built:** an undo button was planned as optional and cut for time.

## AI used

- **Gemini `gemini-3.5-flash-lite`** (Google, free tier, through `@google/genai`) does three jobs: the **shopping agent**, the **rule reader** and the **checker** for fuzzy rules. Each job can be switched to Claude, which is built but unmeasured (no Anthropic key).
- **Built with Claude Code.** The code, tests and docs were written with Claude Code, session by session, from the plan in `docs/superpowers/plans/`.

## Channel3 and Render

- **Channel3** is the agent's product search: real products from US shops, in US dollars (`@channel3/sdk`). Each offer gives the shop, price, condition and stock. When the agent picks a Channel3 listing, the purchase uses that listing's own price and shop, whatever the agent wrote, and the checker reads the listing's own text, including its condition.
- **Render** hosts the demo from the Blueprint in `render.yaml`: one web service on Node 24, with a health check at `/api/health`. Hosted mode gives each visitor their own seeded data and daily limits. The keys are typed into Render's dashboard and never committed.

## Evals

The checker was measured against a keyword baseline (the way a simple guardrail works) on **67 labelled purchase requests** against one fixed set of 10 rules: 50 used for tuning ("dev") and 17 held back ("held out"). The categories are clearly within or against the rules, ambiguous, rule conflicts, price edge cases, refund wording, gifts and other people, and prompt injection. Labelling policy: `evals/README.md`.

| Checker | Split | Correct | Wrong approvals | Needless asks |
|---|---|---|---|---|
| Keyword baseline | dev (50) | 28 (56%) | 12 | 8 |
| Keyword baseline | held out (17) | 9 (53%) | 5 | 3 |
| Gemini 3.5 Flash-Lite, prompt v4, two runs | dev (50) | 48, 47 | 0, 1 | 1, 1 |
| Gemini 3.5 Flash-Lite, prompt v4, two runs | held out (17) | 14, 14 (82%) | 0, 0 | 2, 2 |

- **Wrong approvals** (money spent that shouldn't have been) are the worst failure: 0 to 1 per run across all 67 cases, against 17 for the baseline.
- **Needless asks** are the annoyance. The baseline shows both failures: it asks about harmless words, and it approves paraphrases it has no keyword for, such as "All sales final" against "nothing non-refundable".
- **Read the zero with care:** across prompt versions it's 0 to 1 held-out wrong approvals per run, and one run moves by a case or two.
- **Rule reading** ("here's what I understood"), 22 plain-English rules: Gemini 21/22 and 20/22 over two runs; the offline pattern reader 15/22.
- **Live retail runs:** the demo tasks were run 24 times live (Gemini, Channel3 and the PayPal sandbox). All 25 purchase requests used the listing's own price and shop, and each of the 17 paid purchases is one PayPal hold and one completed capture at that price. Two misreads were found and fixed, test first: a toy set filed as a gift card, and brand names added to searches.

The eval set predates the retail demo (it uses hotels, gifts and refund terms, mostly in pounds). Full results: `evals/RESULTS.md` and the saved runs in `evals/results/`. Commands: `npm run eval -- --checker gemini --concurrency 1` and `npm run eval:parse -- --parser gemini`.

## Run it locally

Needs Node 22.9 or later.

**Offline, no keys:**

```bash
npm install
npm run seed      # fresh data with the four demo rules
npm run dev       # http://localhost:3000
```

Offline, the agent picks from canned listings at fictional shops, the checker is the keyword baseline, the rule reader is a simple pattern reader, and payments are offline test payments. The three suggested tasks give the three outcomes: the mug is approved and paid ($12), the present asks, and the refurbished headphones are blocked. From the terminal: `npm run demo:flow -- 'Buy a plain white ceramic coffee mug, under $15'`.

**With the live services:** copy `.env.example` to `.env.local` and set:

```
CHECKER=gemini  PARSER=gemini  SHOPPER=gemini  SEARCH=channel3  PAYMENTS=paypal
GEMINI_API_KEY, CHANNEL3_API_KEY, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
PAYPAL_VAULT_ID   # optional: a demo buyer's saved PayPal, used until you connect your own
APP_URL           # optional locally (defaults to http://localhost:3000)
```

Each switch is separate, so you can turn on one service at a time. PayPal needs a sandbox app of the **Merchant** type with **Save payment methods** ticked, linked to a **US** sandbox business account (UK sandbox shops can't save a buyer's PayPal), plus a personal sandbox account as the buyer. Smoke tests: `npm run gemini:smoke` and `npm run channel3:smoke "white ceramic mug"`.

Other switches: `SEARCH=firecrawl` searches the web with Firecrawl instead, and `CHECKER=claude PARSER=claude SHOPPER=claude` uses Claude (`ANTHROPIC_API_KEY`), built but unmeasured.

**Deploy your own:** in Render, choose **New → Blueprint** and pick this repo. Render reads `render.yaml` and asks for `GEMINI_API_KEY`, `CHANNEL3_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_VAULT_ID` (the demo buyer, so visitors start connected) and `APP_URL` (the service's own address, shown on its Render page). Don't set `NODE_ENV`: Render sets it when the app runs, and at build time it would make `npm ci` skip the build tools. Daily limits default to 8 tasks per visitor, 30 tasks a day and 20 rule previews per visitor; change them with `LIMIT_TASKS_PER_VISITOR`, `LIMIT_TASKS_PER_DAY` and `LIMIT_PREVIEWS_PER_VISITOR`.

**Checks:** `npm test` (249 tests), `npm run typecheck`, `npm run lint`, `npm run build`. The stack is Next.js 16 (App Router), TypeScript (strict), Zod, Tailwind CSS 4 and Vitest. Money is whole cents (or pence) everywhere and only formatted for display.

## Stripe as an alternative rail

`PAYMENTS=stripe` pays with Stripe Issuing instead: each approved purchase gets a single-use virtual card limited to the approved amount, and Stripe's real-time authorisation webhook asks the app's payment check to approve or decline each charge. It was tested live in Stripe's sandbox in October 2026, in pounds. It needs `STRIPE_SECRET_KEY` (only `sk_test_` keys are accepted), `STRIPE_CARDHOLDER_ID` and `STRIPE_WEBHOOK_SECRET`, plus the Stripe CLI forwarding webhooks:

```bash
stripe listen --events issuing_authorization.request --forward-to localhost:3000/api/stripe/webhook
```

In Stripe's Issuing settings, set the real-time authorisation timeout fallback to **decline**: Stripe waits only 2 seconds for the app's answer, so a slow answer must fail safe. Stripe isn't part of the hosted demo.

## Limits of the demo

- **Sandbox only.** No real money moves, and the code can only call PayPal's sandbox.
- **One shop receives every payment.** A saved PayPal works only with the shop it was saved for, and paying many different shops needs PayPal partner status. So every payment goes to one sandbox business account; the shop's name goes in the order description, and the payment check still checks it.
- **Live results show real US shop names and products, but no shop is really paid,** and nothing is ordered. The shop's request to be paid is played by the app.
- **Visitor data resets on each deploy.** It lives on the service's own disk, so the next visit starts from the seeded demo again.
- **Daily limits fall back to the offline agent.** Past the limits above, a run uses the offline agent and says so in one line; payments still go through PayPal's sandbox. If Google's own free allowance runs out first, a run stops with a message saying Gemini is over its usage limit, and nothing is approved.
- **PayPal's sandbox doesn't send you back after you agree.** It shows an error page instead, so the app has a **Finish connecting** button that asks PayPal whether you agreed.
- **The "blocked" headphones need the offline listings.** Live search hasn't returned a used or refurbished listing, so live, the headphones are usually approved.
- **Spending only.** The app can't stop an agent's non-payment actions, such as sharing an address.
- **No refunds yet.** An undo button was planned as optional and cut for time.

## Licence and credits

MIT, see `LICENSE`. Payments: PayPal developer sandbox. Product data: Channel3. Hosting: Render. AI: Google Gemini. Colours and type follow The Product Kinship (its name and logo aren't used), built with Impeccable. Product brief and decisions: `BRIEF.md`. Build plan: `docs/superpowers/plans/2026-10-21-paypal-hackathon.md`.
