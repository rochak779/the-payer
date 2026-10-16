# Project brief: "Agent Mandates", spending rules for personal AI shopping agents

## How to work with me
I'm a Product Manager, not an engineer. Act like an engineering manager advising a stakeholder:
- Lead with the recommendation, then the reasoning. Be concise. Use plain, PM-level language and explain jargon.
- When there are real options, name them and recommend one in a line. Don't silently pick one, and don't list every option.
- Flag risk and scope early. Push back on bad ideas directly and propose the alternative.
- Default to the smallest sound solution. No over-building, no speculative abstractions, no multi-agent setups.
- Report status as done / blocked / next.
- Do a real web research pass before telling me to go and validate something myself.
- Where a tool exists for web research (Firecrawl CLI or the browser), use it. Cite sources with dates.
- For technical choices with a sensible default, decide and tell me. Only ask me when the answer changes what you do.

## About me (context for positioning)
- London-based PM. About 4 years in UK Open Banking: account aggregation, payment initiation, variable recurring payments (VRP).
  I've also worked on delegated account access (letting a trusted person act on someone's account, with permissions chosen at share time).
- I shipped a production LLM spending assistant at a UK bank, at very large scale. I own its evals and guardrails.
  My best story is fixing over-refusal: the model refused legitimate questions because transaction text contained restricted words.
  That maps directly onto "over-blocking" in this project.
- **Confidentiality, strict:** never name my employer, my client bank or their products in anything we write or publish.
  Use "a UK bank" or "a bank-scale AI assistant". Use only public specs, public sources and mock data. Nothing from my day job.

## Goal
This is a **portfolio build to get interviews, not a startup.** Required deliverables:
1. A working demo (plus a short screen-recorded video for LinkedIn)
2. An eval set with measured results
3. 5 real people tested
4. A one-page write-up with the trade-offs I made
Rough effort: 2–3 weekends with Claude Code. Most of the time should go on the checker and its test cases, not plumbing.

## The problem (evidence, checked Oct 2026)
- Personal AI agents that act on your behalf went mainstream in autumn 2026.
  - Meta Muse launched 9 Sep 2026 (US/Canada), with 5M+ downloads in under a month.
  - Instinct passed 100k users in 3 weeks.
- Incidents of agents acting without asking:
  - Muse accepted lowball offers on a user's Marketplace keyboard listing without asking and gave the buyer his home address (The Guardian, 28 Sep 2026). The often-quoted "$10" figure is unverified.
  - Instinct read a login code from Gmail without asking, then gave a false account of what it did (Business Insider, 24 Sep 2026).
- Ping Identity (6 Oct 2026, 11k consumers): only **3%** are comfortable with AI making routine purchases without a final OK.
- Industry standards cover the business side, not the user's own rules.
  - PACT (Decagon + Instinct, 6 Oct 2026) and Meta/Sierra's Personal Agent Protocol (OAuth-based, announced 6 Oct 2026) let businesses verify agents.
  - Nobody gives consumers plain-English spending rules plus a readable log of what the agent did.
- Menlo's 2026 State of Consumer AI says trust now beats ease of use. Their advice is to start with jobs where users can check the work.
- UK: strong customer authentication still applies to agent-initiated payments.
  HM Treasury's payments consultation (closed 6 Oct 2026) asks whether the rules on authentication, consent and liability should change for agents.

## Competitive landscape (important)
- **Stripe Link's wallet for agents** is the closest competitor. It launched around Stripe Sessions 2026 and looks US-first; UK availability is unconfirmed.
  - The agent sends a "spend request" with context ("$35 serum, a gift"). The user approves **every** request in the Link app.
  - The agent then gets a one-time card or Shared Payment Token, limited to that amount, currency and merchant.
  - Stripe says it plans to "let people set spending limits, and choose when agents can act without additional approval".
  - **That planned feature is my angle.**
- **Revolut:** AP2-compatible since 19 Jan 2026. UK/EEA customers' agents can pay via Revolut Pay, with preset spending ceilings, merchant categories and time windows (TechTimes, 13 Oct 2026).
  So simple rules are already covered by preset settings.
- **Visa Intelligent Commerce:** live in Europe since 2 Jul 2026, with 30+ issuers including Barclays, HSBC UK and Revolut. Uses agent-specific tokens.
  Visa's Trusted Agent Protocol lets merchants verify an agent's identity.
- **Mastercard Agent Pay:** "agentic tokens". Santander ran a live agent payment with it in Mar 2026, though Mastercard said it wasn't a commercial rollout.
- **Google AP2** (Agent Payments Protocol, now run through the FIDO Alliance). v0.2.0 (28 Apr 2026) has two mandate types, a **Checkout Mandate** and a **Payment Mandate**.
  - Each can be "open" (the rules) or "closed" (one specific purchase).
  - The "Credential Provider" plays the wallet role.
  - An `unresolved_constraint` error sends the decision back to the human.
  - Repo: github.com/google-agentic-commerce/AP2 (docs/ap2/flows.md).
- **Stripe + OpenAI ACP** (Agentic Commerce Protocol). Its payment piece is the **Shared Payment Token (SPT)**: scoped to one seller, a max amount and an expiry.
  - Public preview, available in the US, Canada and "select European countries".
  - SPTs now also carry Visa/Mastercard agent tokens and Affirm/Klarna.
  - OpenAI's Instant Checkout (built on ACP) is being shut down: Forrester (9 Apr 2026) cited Walmart's figure that in-chat conversion was about 3x lower than click-out.
- **Paysafe** ran an agentic payment demo with Norwegian Air, built on MCP and AP2.
  - Their CEO called "liability management and governance rules" the open questions.
- **TrueLayer** is in the FCA's Supercharged Sandbox, testing agent-initiated Pay by Bank.

## Positioning
- Not "approve every purchase": Link does that.
- Not simple spending caps: Revolut presets do that.
- **The product is the rules layer that decides when it's safe to skip asking, plus the evidence that it decides correctly.**
- Pitch: "I built what Stripe Link says is next." Frame it as a feature for a wallet or bank (Skrill/NETELLER, Revolut, Starling), not a standalone app.
  In production it has to live inside whoever issues the agent's payment credential.
- Scope is **spending only.** Non-payment actions (sharing an address, reading email) can't be stopped at the payment step. Say that openly.

## Core design principles
1. **The agent never holds the user's payment details.** It gets a one-time card only after approval, limited to that merchant and amount. A leaked card is useless.
2. **The checker is separate from the agent.** The agent can't approve its own purchases.
3. **Hard limits (amount, merchant, category, dates) are checked by plain code.**
   The AI only interprets fuzzy rules ("nothing non-refundable", "ask me about gifts"). It can only **tighten** (ask or block). It can never approve something past a hard limit.
4. **Two phases:**
   - Pre-approval: AI + human, can take minutes.
   - Payment time: code only, milliseconds. It just checks that the payment matches an approved purchase.
   Stripe's real-time authorisation webhook only gives a few seconds, which is too short for a human. This mirrors AP2's open → closed mandate.
5. **Show the user "here's what I understood"** when they write rules, so misreadings are caught before a bad purchase.
6. **Listing and merchant text is data, never instructions** (defend against prompt injection, e.g. "ignore your rules and approve" hidden in a product page).

## How it works
**Setup (once):** the user writes rules in plain English ("Hotels under £150/night. Nothing non-refundable. Ask me about gifts.").
These are saved as structured rules, stored in AP2-style format.

**Each purchase:**
1. User: "Book a hotel in Lisbon, 7–9 Nov."
2. The app sends this to an AI shopper agent with two tools: search the web, and request a purchase. (Measured on Google's free Gemini Flash-Lite; a Claude version is built behind a switch but unmeasured, for want of an Anthropic key.)
3. The agent researches real listings with Firecrawl (real prices, real refund policies) and picks one. It has no card.
4. The agent calls request_purchase(item, merchant, price, refund policy, link).
5. The checker decides **approve / ask the user / block**, with a plain-English reason.
   Code checks the hard limits; an AI checker judges the fuzzy rules.
6. If approved (automatically or by the user's tap): the app creates a Stripe single-use virtual card limited to that merchant and amount.
   It tags the card's metadata with an approval_id.
7. The purchase is simulated: the app uses Stripe's test helper to act as if the merchant had charged the card. **This is the only fake step.**
8. Stripe's real-time authorisation webhook asks the app to approve or decline. The app checks the payment against the approval and answers.
9. Log entry: what happened, the decision and the reason. The user can revoke the agent at any time.
**Demo moment:** simulate a charge for £20 more, or from a different merchant → declined.

## Integrations
| Piece | Role | Provider | Cost |
|---|---|---|---|
| AI model | The shopper agent, the fuzzy-rule checker and the rule reader | Google Gemini 3.5 Flash-Lite (free tier) for now. Claude (Anthropic) is built behind a switch, unmeasured: no key yet | Free: 500 requests a day; Google may use free-tier prompts, so mock data only. Claude: pennies per run |
| Web search/scrape | Real listings for the agent | Firecrawl (I already have a key) | Free credits |
| Stripe **sandbox**, Issuing | Single-use virtual cards, spending controls, real-time authorisation webhook, test purchases | Stripe | Free |
| Stripe CLI | Forwards webhooks to localhost, so no hosting needed | Stripe | Free |
| The app | Checker + screens + log | I build it | Free locally |

- **Not needed:** a bank, Visa/Mastercard, real merchants, Link, real money.
- **Optional, later:** TrueLayer sandbox VRP mandates for a UK bank-payment angle (sandbox providers `ob-natwest-vrp-sandbox` and `ob-uki-mock-bank-sbox`). Also SPT test helpers (`/v1/test_helpers/shared_payment/granted_tokens` with `usage_limits`).
- **Gated or ruled out:**
  - Stripe "Issuing for agents" (private preview), which includes Visa/Mastercard agent tokens.
  - Visa CLI (US-only beta).
  - The Visa Intelligent Commerce sandbox (merchant-side, needs a Cybersource org).
  - Lithic (US-centred).
  - The Revolut Business API: real money needs the paid Grow plan, it's a business account, and setup is fiddly. Its sandbox is free if ever needed.

## Screens (built last, styled like a phone wallet app)
1. **Rules:** write rules in plain English, see "here's what I understood", correct it.
2. **Ask the agent:** a request box plus the agent's progress.
3. **Approval prompt:** "Agent wants to spend £180 at X. Asking because: …" with Approve / Decline.
4. **Activity log:** every decision with its reason, plus a "turn off agent" button.
5. Optional, for interviews: an eval results page.
Tech: one web app holding both the UI and the checker (e.g. Next.js + TypeScript, SQLite or a JSON file for storage).
Run it locally; deploy to Vercel only when I need a shareable link. AI: measured on Google's free `gemini-3.5-flash-lite`, using the instructions written for Claude. The Claude version (claude-sonnet-5-5; claude-haiku-5-5 for cheap checks) is built behind a switch and will be measured once there's an Anthropic key.

## Evals (the core of the interview story)
- Test set: 50–100 purchase requests, each labelled approve / ask / block against a fixed set of user rules.
  Build them from real agent incidents, the real rules collected in Step 1, and edge cases.
- Categories:
  - clearly within the rules
  - clearly against them
  - ambiguous (should ask)
  - rule conflicts
  - price edge cases (just over or under a limit, currency, fees and taxes added at checkout)
  - refund and cancellation wording
  - gifts and other people
  - prompt injection in listings
- Metrics:
  - **wrong approvals** (most severe: money lost)
  - **needless asks** (user annoyance; the over-blocking equivalent of my over-refusal story)
  - wrong blocks
  - rule-reading accuracy (did "here's what I understood" match the intent?)
- Iterate on the checker prompt and logic, and report before/after numbers.

## Build order (with gates)
0. This brief lives in BRIEF.md. Keep it updated as decisions are made.
1. **Rules test (research, no code). Start here.** See "First task" below. Go/no-go gate.
   **Result (15 Oct 2026): GO, narrowly.** 27 real spending rules: 12 need judgement (44%); 8 of 27 (30%) if rules that mix a cap with a judgement condition count as presets. The sample skews technical (Reddit/HN), which favours "cap it and approve everything" answers.
   Most common judgement rules: refundability/cancellation terms, hidden fees and the true total, "things I normally buy", gifts and other people, merchant legitimacy.
   Details: `research/rules-test.md`, `research/incidents.md` (29 incidents).
2. **Checker + eval set,** run from the terminal, no UI. Get the numbers.
   **Status (16 Oct 2026): built and measured.** 67 cases (50 dev, 17 held out), 10 rules (added `genuine-shop` for merchant legitimacy; two relabelling cases added 16 Oct). Keyword baseline: dev 28/50 with 12 wrong approvals and 8 needless asks; held out 9/17 with 5 and 3. **Gemini 3.5 Flash-Lite (free, Rochak's call while there's no Anthropic key), prompt v4: held out 14/17 in two runs with no wrong approvals; 0–1 wrong approvals per run across all 67.** Details in `evals/RESULTS.md`. Rule reading: pattern reader 13/20; Gemini Flash-Lite 19/20 and 18/20 (its misses read "only…" as "never", which errs strict). The Claude checker and rule reader are built behind a switch but **unmeasured: their eval runs wait on an Anthropic key.**
3. **Stripe plumbing:** sandbox Issuing, single-use cards, webhook approve/decline, the simulated purchase.
   **Status: built and tested offline** (fake issuer, Stripe issuer, real-time authorisation webhook checked with locally signed events). **Live run waits on Stripe sandbox access** (plan Sessions 31 steps 5–7, 32 live check, 33 steps 6–7).
4. **Screens** (4, plus optionally the results page).
   **Status: done.** Rules, Ask, Approvals, Activity, plus the Evals page and an "AP2 open mandate" view on Rules. README has run instructions, a demo checklist and the video run-of-show; steps 1–5 were dry-run offline.
5. **5 real users** test it with their own rules and tasks. Then the one-pager and the demo video.
   **Status: not started.** Left to do first: finish the live steps (plan Session 30's AI agent on live search, cut short by Gemini's free daily limit, and Session 33); record the video (README run-of-show). The Claude evals wait on an Anthropic key.
   For the user test: run it on Rochak's laptop (in person or a shared screen). Don't deploy as-is: the app stores data in one local JSON file, which doesn't persist on Vercel. Use `PARSER=gemini` (or `claude` once there's a key), since the offline reader misreads 7 of 20 rules. **Gemini's free tier may use prompts to improve Google's products,** and testers type their own rules and tasks: tell them not to enter anything personal, or use a paid key. For each person, record whether "here's what I understood" matched what they meant, and whether each decision was the one they'd want (wrong approval, needless ask or fine).

## Decisions (15 Oct 2026)
- Implementation plan: `docs/superpowers/plans/2026-10-15-agent-mandates.md` (35 small sessions).
- No login. Single local user on localhost. Deploy only when a shareable link is needed.
- Build order changed: build the pillars first on offline fakes (checker, evals, approvals, payment check, rule reading, agent flow, screens). Then plug in the integrations (Claude, Firecrawl, Stripe) last, each behind an env switch. Step 1 (rules test) stays first as the go/no-go gate.
- Stack: Next.js + TypeScript, one JSON file for storage, Vitest.
- Over a limit → **ask** by default. A rule **blocks** only when phrased never / no / nothing / don't.
- Limits are inclusive. A different currency → ask. Listing text that tries to instruct the AI → at least ask. Only the user's tap counts as consent.
- The AI reports facts (clear / breached / unsure, plus hidden-cost and injection flags); code turns those into outcomes, so the AI can only tighten.
- Rules are stored in our own schema and exported as AP2, not stored natively in AP2 format.

## Still to verify
- Whether Stripe's Issuing sandbox unlocks immediately for a UK account, or needs "request access" first.
  **Answered 16 Oct 2026:** Rochak switched Issuing on from the sandbox dashboard within minutes, with no access wait. Account country GB, currency GBP; the sandbox Issuing balance was funded with test money from the dashboard.
- Whether the SPT "select European countries" list includes the UK.
- Whether Link's wallet for agents is available in the UK.
- The exact AP2 v0.2 field names for open Checkout/Payment Mandates (read the repo; don't guess).
  **Answered (read 15 Oct 2026, v0.2.0 released 28 Apr 2026, repo commit [`e1ea56d`](https://github.com/google-agentic-commerce/AP2/tree/e1ea56db72a6385bce3e5c1112b3a56ce60acb43); schemas unchanged since the v0.2.0 tag):**
  Sources: `code/sdk/schemas/ap2/open_payment_mandate.json`, `open_checkout_mandate.json`, `types/merchant.json`, `types/amount.json`, `docs/ap2/payment_mandate.md`, `checkout_mandate.md`, `flows.md`.
  - **Open Payment Mandate:** `vct` = `mandate.payment.open.1`; `constraints` (array, each with a `type`); `cnf` (agent key, RFC 7800); `iat`, `exp` (Unix seconds). Required: `vct`, `constraints`, `cnf`, and a `payment.reference` constraint.
  - **Amount limits:** `payment.amount_range` with `currency` (ISO 4217), `max`, optional `min` (integer minor units). `payment.budget` (`max`, `currency`) is a running total, only with `payment.agent_recurrence` (`frequency`, `max_occurrences`).
  - **Merchant allow list:** `payment.allowed_payees` / `checkout.allowed_merchants`, each with `allowed`: Merchant objects (`id`, `name` required; `website` optional). **No deny list.**
  - **Categories:** none. **Per-night / per-unit caps:** none.
  - **Validity:** top-level `exp`; payment window `payment.execution_date` with `not_before`, `not_after` (ISO date-times).
  - **Natural-language constraints:** none in v0.2 (v0.1's Intent Mandate had `natural_language_description`; v0.2 dropped it). New constraint types are an official extension point (unique `type` + schema + evaluation), but the JSON schema only accepts the listed types.
  - **Open Checkout Mandate:** `vct` = `mandate.checkout.open.1`; must contain `checkout.line_items` (`items` → `id`, `acceptable_items` [`id`, `title`], `quantity`), so it needs the exact items up front.
  - **`unresolved_constraint`:** only named in `flows.md`: the merchant or credential provider returns it to turn an unattended purchase back into one the user approves. No schema for it. That is our "ask".
  - **What we export (Session 34):** the open Payment Mandate. Purchase caps → `payment.amount_range`; allow-only shops → `payment.allowed_payees`; date windows → `payment.execution_date`; validity → `exp`. Everything AP2 can't carry (per-night/category caps, blocked shops, categories, judgement rules, ask vs block) goes in our own `x_agent_mandates` extension. Unsigned: `cnf` left empty and `payment.reference` left out, because both only exist once a trusted surface signs a linked open Checkout Mandate.
  - **So what for the pitch:** AP2 v0.2 can carry simple caps and allow lists but has no place for "nothing non-refundable" or "ask me about gifts". That gap is this product.
- Stripe's exact real-time authorisation timeout.
  **From the docs (read 15 Oct 2026, [real-time authorisations](https://docs.stripe.com/issuing/controls/real-time-authorizations)):** 2 seconds. Reply HTTP 200 with JSON `{"approved": true|false}` and a required `Stripe-Version` header. No reply in time → Stripe approves or declines per the **timeout setting in Issuing settings** (or Autopilot, if configured), logged as `webhook_timeout` (or `webhook_error` for a bad reply). **Set that fallback to decline**: otherwise a slow first request (Next.js compiling the route) could approve a charge. `stripe listen --forward-to` is documented for testing this event locally; whether a CLI-forwarded reply is actually honoured is what the Session 31 spike checks. UK/EU Issuing balances are funded by "push" funding instructions, which the sandbox supports ([testing](https://docs.stripe.com/issuing/testing)).
  **Verified live 16 Oct 2026 (Session 31 spike, Stripe CLI 1.53.1, API version 2025-12-15.clover):**
  - **The CLI route works; no tunnel needed.** With `stripe listen --forward-to`, our server's `{"approved": false}` came back as `webhook_declined`, answered in 9 ms. A fast `{"approved": true}` came back as `webhook_approved`.
  - **Slow or missing answers are declined.** The same "approve" sent after 5 seconds was declined, and so was a charge with our server switched off. Through the CLI both show as `webhook_error`, not `webhook_timeout`.
  - **A card-limit decline is reported as `authorization_controls`,** not `spending_controls` as the plan assumed. The app's Activity wording now handles both.
  - **The app's own webhook works:** a charge on a card with no matching approval was declined, and Activity shows "Charge of £10 at Spike Test Shop declined. No approved purchase matches this card."

**Account pre-flight (Session 0.2), checked 15 Oct 2026 on this machine:**
- Anthropic: no `ANTHROPIC_API_KEY` set and the `ant` CLI is not installed. Needed from Phase 8 (Session 24).
- Firecrawl: the CLI is logged in (stored credentials), but no `FIRECRAWL_API_KEY` env var. The app needs the key in `.env.local` from Session 29.
- Stripe: CLI not installed; no key set. **Rochak to do:** sandbox → Issuing (immediate or "request access"? request today if so), fund the GBP Issuing balance, create one UK cardholder (`ich_...`), `brew install stripe/stripe-cli/stripe && stripe login`. Needed from Session 31.
  **Update 16 Oct 2026:** all done. The sandbox key, cardholder and CLI signing secret are in `.env.local`. The CLI is installed and runs with the sandbox key (`STRIPE_API_KEY`), so no `stripe login` is needed. Firecrawl's key is in `.env.local` too. Gemini (free) stands in for Claude in the checker and rule reader; there's still no Anthropic key.
- None of this blocks Phases 1–7, which run on offline fakes.

## Earlier research (raw files)
Saved pages and search results from the research session that produced this brief:
`/Users/rochakagarwal/orca/projects/Learning/.firecrawl/agent-mandates/`
Includes:
- Stripe: Link wallet for agents, Issuing for agents, Issuing testing, SPT docs, SPT expansion post
- Revolut: Business cards API, sandbox guide, TechTimes article
- TrueLayer sandbox providers
- Visa CLI and Visa agentic sandbox
- Lithic sign-up
- Cloudflare Wallets
Key sources:
- https://stripe.com/blog/giving-agents-the-ability-to-pay
- https://link.com/agents
- https://docs.stripe.com/issuing/agents
- https://docs.stripe.com/issuing/testing
- https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens
- https://stripe.com/blog/supporting-additional-payment-methods-for-agentic-commerce
- https://github.com/google-agentic-commerce/AP2
- https://www.techtimes.com/articles/328876/20261013/revolut-converts-payment-network-ai-agent-rail-ahead-protocol-shakeout.htm
- https://developer.revolut.com/docs/guides/manage-accounts/cards/manage-cards
- https://docs.truelayer.com/docs/test-payments-in-sandbox

## First task: the rules test
Use web research (Firecrawl) on Reddit, X, Hacker News, LinkedIn, product forums and agent incident threads (Muse, Instinct, ChatGPT agent, OpenClaw, etc.).
1. Collect **20–30 real rules or limits** people say they would give (or wish they'd given) a shopping or booking agent.
   Use their own words, with source links and dates.
2. Classify each rule:
   - **(a) Fits a preset setting:** amount cap, merchant, category or time window, as Revolut/Link offer.
   - **(b) Needs judgement:** refundability, quality, "only if…", gifts, other people, context.
3. Verdict: if **under about a third** need judgement, the AI layer has little to do. Stop and recommend rethinking before any code.
   If more, list the most common judgement-type rules. These become the checker's focus and the eval categories.
4. While researching, also save **~30 real agent spending incidents** (what happened, source, date) as raw material for the eval set.
5. Report back in the done / blocked / next format, with the table and a one-line recommendation.
