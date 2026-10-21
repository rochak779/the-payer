# The Payer: PayPal AI Hackathon Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each "Session" below is one task. Read "Global Constraints" and the session you are on before writing anything.

**Goal:** Enter the Agent Mandates product in the PayPal AI Hackathon (Devpost) as "The Payer". Payments move to the PayPal sandbox, product search comes from Channel3, and the app is hosted on Render so judges can try it with no setup. Submit by 10 Nov 2026; the hard deadline is 12 Nov 2026, 12:00 PT (20:00 UK).

**Architecture:** The same Next.js app. A `PaymentRail` interface replaces `CardIssuer`, with three versions: offline fake, Stripe (kept as an alternative) and PayPal (new, the default for the demo). PayPal works like this: the buyer saves their PayPal once (PayPal "vault"). For each approved purchase the app holds exactly the approved amount (Orders v2, `intent: AUTHORIZE`). When the shop asks to be paid, our code-only payment check runs first, and only then is the hold captured. The off switch voids open holds. Search gets a fourth version (Channel3). A hosted mode (`HOSTED=1`) gives each visitor their own seeded data file and daily usage limits.

**Tech Stack:** Next.js 16.4.2 (App Router), TypeScript, Tailwind v4, Zod 4, Vitest, tsx. AI: Gemini `gemini-3.5-flash-lite` via `@google/genai`. New: PayPal REST API v2/v3 called with `fetch`, `@channel3/sdk`, Render (Starter web service).

**Spec:** `BRIEF.md` (the product), plus the "Hackathon requirements" section below (the competition). Read both before any session. BRIEF.md's confidentiality rules apply to every file, commit and video frame.

---

## For Rochak: how to read this plan

**Session map.** Each session is 20–45 minutes of Claude Code time. It ends with green tests, a commit and a PR that you merge, and leaves the app working.

| # | Session | Phase | Needs from you | Target date |
|---|---|---|---|---|
| 0 | Prerequisites (you, about 60 min, no code) | 0 · Before code | Everything in "What I need from you" | 22 Oct |
| 1 | PayPal sandbox spike (**go/no-go gate**) | 0 · Before code | PayPal keys; you log in to the sandbox buyer once | 23 Oct |
| 2 | Rename "card" to "payment" (fakes only) | A · On fakes | — | 24 Oct |
| 3 | Retail demo on fakes: rules, products, suggested tasks | A · On fakes | — | 25 Oct |
| 4 | Hosted mode 1: one data file per visitor | A · On fakes | — | 26 Oct |
| 5 | Hosted mode 2: daily usage limits, offline fallback | A · On fakes | — | 27 Oct |
| 6 | PayPal client and payment rail (offline tests) | B · Integrations | — | 28 Oct |
| 7 | "Connect PayPal" (save the buyer's PayPal once) | B · Integrations | PayPal keys; sandbox buyer login | 29 Oct |
| 8 | PayPal live end to end + the overcharge scene | B · Integrations | PayPal sandbox dashboard open | 30 Oct |
| 9 | Channel3 product search | B · Integrations | Channel3 key | 1 Nov |
| 10 | Live retail run: Gemini + Channel3 + PayPal | B · Integrations | Gemini key | 2 Nov |
| 11 | Deploy on Render | B · Integrations | Render account; you paste the keys into Render | 4 Nov |
| 12 | Public-repo prep: licence, judge README, clean-up | C · Submission | Your review; you make the repo public | 6 Nov |
| 13 | 5-person test kit (optional, cut first) | C · Submission | You run 5 short tests | 7 Nov |
| 14 | Demo video (under 3 minutes) | C · Submission | You upload to YouTube | 8 Nov |
| 15 | Devpost write-up + submit | C · Submission | You submit on Devpost | 10 Nov |

The PayPal spike goes first, against the usual "integrations last" rule. If PayPal can't save a payment method for our app, the plan changes shape, so we find out before building on it.

**Cut order if time runs short:** Session 13, then 8b (refund), then 10b (retail eval cases), then the suggested-task buttons in Session 3. Never cut Sessions 1, 6–8, 11, 12, 14 or 15. Those are the hackathon's hard requirements.

### What I need from you (prerequisites)

Do these in order. Each one names the session that's blocked without it. Only you can create accounts and type passwords. Put every key in `/Users/rochakagarwal/orca/projects/The Payer/.env.local` (already created, copied from Agent Mandates, and ignored by git). Never paste a key into chat.

1. **Eligibility and IP check** (blocks everything). The rules exclude employees, representatives and agents of the sponsor (PayPal), the administrator (Devpost) and their parent companies, subsidiaries and affiliates. They also exclude anyone whose employer employs a judge, and anyone whose entry would be a conflict of interest. Your entry must be your own work and solely owned by you. Check your employment contract's IP and side-project terms. Tell me "eligible" before Session 1.
2. **Product name** (blocks Session 12). The repo is `the-payer`. Should the app, video and Devpost entry also be called "The Payer", or stay "Agent Mandates"? Until you say, the app keeps "Agent Mandates" and Session 12 does the rename if you want it.
3. **Devpost** (blocks Session 15). Register for the hackathon at paypalaihackathon.devpost.com and start a draft project. A draft can be edited until the deadline.
4. **PayPal developer sandbox** (blocks Session 1).
   1. Sign in at developer.paypal.com with your personal PayPal account, or create one with your personal email.
   2. Go to **Apps & Credentials**, make sure **Sandbox** is selected, and choose **Create App**. Pick the **Merchant** type, not Platform: a platform app was refused vaulting in forum thread 45483.
   3. In the app's settings, tick **Save payment methods** (sometimes labelled "Vault"). Leave everything else as it is.
   4. Go to **Sandbox accounts**. You need one **Business** account in the **United States** (the shop; PayPal's default one works) and one **Personal** account (the buyer; ours is UK). Link the app to the US shop when you create it. UK sandbox shops can't save a buyer's PayPal (Session 1, 21 Oct).
   5. Add to `.env.local`: `PAYPAL_CLIENT_ID=…` and `PAYPAL_CLIENT_SECRET=…` (from the app page).
   6. Keep the sandbox buyer's email and password handy. You'll type them into PayPal's login page in Sessions 1 and 7. I never see them.
5. **PayPal Discord** (optional, recommended). Join discord.gg/sJ2G6DyvSK. If Session 1 fails on vaulting, you post the question I draft there. PayPal and Channel3 staff answer in it.
6. **Channel3** (blocks Session 9). Sign up at trychannel3.com/developers, create an API key, and apply promo code `PAYPAL-HACKATHON-2026` (20,000 free searches). Add `CHANNEL3_API_KEY=…` to `.env.local`.
7. **Gemini key** (blocks Session 10). Your current key was copied across. Decide by Session 11: keep the free key (500 calls a day, and Google may use free-tier prompts, so mock data only) or switch to a paid key with a spending cap of about £10 for the judging period (1–15 Dec). The usage limits in Session 5 keep either one safe.
8. **Render** (blocks Session 11). Sign up at render.com with your GitHub account, then claim the $50 hackathon credits at credits-portal-mmdm.onrender.com/claim/paypal-ai-hackathon. When Session 11 asks, give Render access to the `rochak779/the-payer` repo. The Starter plan is $7 a month, so the credits cover it through judging.
9. **Later, when a session asks:**
   - review the repo before it goes public, then make it public (Session 12);
   - create a second sandbox buyer for judges and put its login in the README (Session 12);
   - run the 5-person test (Session 13, optional);
   - upload the video to YouTube as Public (Session 14);
   - paste the write-up into Devpost and submit (Session 15).

### Decisions I made (tell me if any is wrong)

- **Hold, then capture.** Each approved purchase becomes a PayPal hold for exactly its total. The money moves only when the shop asks and our payment check agrees. This keeps the "shop tries to charge $20 more" scene and lets the off switch void holds. Capturing at once would be simpler but loses both.
- **One sandbox shop receives every payment.** Paying several different shops needs PayPal partner status (Session 1 confirms this). The shop's name goes in the order description, and our code checks it as before.
- **The AI agent gets no PayPal tools.** It can only ask to buy. Only the payment check's code path can move money, and the write-up says so as a deliberate design choice.
- **PayPal through plain `fetch`, no SDK.** That's fewer moving parts, and each call matches PayPal's docs one to one.
- **The hosted demo is pre-connected to a sandbox buyer,** so judges try it with zero logins. Connecting their own sandbox PayPal is an option, not a step.
- **Hosted data is temporary.** Render wipes visitor files on each deploy, which is fine for a demo: the next visit starts seeded again.
- **Offline mode stays** as the video backup and as the fallback when a daily limit is reached.
- **The demo is retail, not hotels,** because Channel3 is retail only. The hotel scenario stays in the offline fixtures and the evals.
- **Fixture products and shop names become generic and fictional,** because the hackathon bans third-party trademarks in the video. Today's fixtures name real brands.
- **Stripe stays** as `PAYMENTS=stripe`, out of the demo and the README lead.
- **`ISSUER` is renamed `PAYMENTS`.** The old name is still read, so your `.env.local` keeps working.
- **The demo charges in US dollars** (Rochak, 21 Oct). UK sandbox shops can't save a buyer's PayPal, and the US shop leaves £ payments pending. UK spelling stays. See BRIEF.md, "PayPal: verified in sandbox".

### Risks flagged

1. **PayPal refuses vaulting for our sandbox app.** This is Session 1's gate. **Resolved 21 Oct: works with a US shop; UK shops are refused.**
   - If it fails: check the app type and the "Save payment methods" setting, then ask on Discord.
   - Fallback: one PayPal approval per task. The buyer approves a hold for the task's budget, and we capture exact amounts within it. Sessions 6–8 change; the rest don't.
2. **Resolved 21 Oct: the line holds** ($65 on a $60 hold, and £65 on £60, were taken with no buyer action). Was: **the "PayPal lets shops take up to 15% more" line may not hold for UK accounts.** PayPal's docs say the extra may need the buyer's action in some regions. The video's wording waits for Session 1's answer.
3. **Moot since the demo moved to USD (21 Oct).** Was: **Channel3's UK coverage is "still growing"** (their docs). Session 9's smoke test decides. If UK results are thin, switch the demo to `country: 'US'` with rules in dollars.
4. **Live search returns branded products.** The video must show generic results. Session 14 checks every frame and records the live search on a generic query.
5. **Timeline.** It's 15 sessions in about 20 days. Keep to the cut order above.

---

## Hackathon requirements (the spec)

These come from the official rules (paypalaihackathon.devpost.com/rules), read 20 Oct 2026. Each line names the session that meets it.

- **Build** an app that integrates the PayPal developer platform (free sandbox) with an AI tool. PayPal must be central. Stage One of judging is pass/fail on "reasonably applies the required APIs". → Sessions 1, 6–8.
- **New or significantly updated** after the start of the submission period (1 Oct 2026), with an explanation of how. The first commit is 15 Oct 2026. → Session 15.
- **Text description** of features and functionality. → Session 15.
- **Functional demo:** a hosted URL or complete run instructions. Judges must be able to interact with a working build. A mockup is not enough. → Sessions 11, 12.
- **Public repo** on GitHub, with all source and instructions and an open-source licence file that shows in the repo's About section. → Session 12.
- **Video** under 3 minutes, on YouTube and public. It must show the project working, with no third-party trademarks or copyrighted music without permission. → Session 14.
- **Testing access:** free and unrestricted until judging ends (15 Dec 2026), with any sandbox logins in the testing instructions. → Sessions 11, 12.
- **Third-party APIs** may only be used within their terms. → Sessions 9, 12 (Channel3 and PayPal attribution in the README).
- **English.** Copy is already English, in UK spelling.
- **Judging** has five criteria, weighted equally:
  - Technological Implementation (thorough use of PayPal and AI, non-trivial and working);
  - Design (a complete, coherent product, not a proof of concept);
  - Potential Impact (a credible case for a real problem and audience, backed by the demo);
  - Innovation/Idea (novel, and different from existing concepts);
  - Presentation (the video shows it working end to end, and the pitch says the problem, who it's for and why it matters).
- **Prizes we aim for:** Best Use of Agentic Commerce ($5,000 honourable mention) plus Best Use of Channel3 ($1,500 sponsor prize). A project can win at most one grand or honourable-mention prize plus one sponsor prize.

---

## Global Constraints

- Everything in the old plan's Global Constraints (`docs/superpowers/plans/2026-10-15-agent-mandates.md`) still holds, with three exceptions: hosting is now allowed (Session 11, only with `HOSTED=1`); the default model is Gemini; and payments default to PayPal.
- Next.js 16 is not the Next.js in your training data. Before writing Next code, read the matching guide in `node_modules/next/dist/docs/`. `proxy.ts` replaces `middleware.ts`.
- Node ≥ 22.9. Render runs Node 24 (set in Session 11).
- TypeScript strict. Validate every outside response with Zod: PayPal, Channel3 and Gemini.
- Money is integer minor units (pence) everywhere. `formatMoney` is for display only. Converting to PayPal amount strings goes only through `toPayPalAmount`. Converting from Channel3 decimal prices goes only through `money()`.
- Outcomes stay `'approve' | 'ask' | 'block'`, and rules can only tighten. The AI never turns a code ask or block into an approve.
- Only the payment check (`checkCharge`) decides whether money moves. PayPal capture is called only after `checkCharge` approves, and only from `src/integrations/paypal/rail.ts`.
- The shopping agent never receives PayPal tools, tokens, vault ids or hold ids. Its tools stay `searchWeb` and `requestPurchase`.
- PayPal is sandbox only. The base URL is hard-coded to `https://api-m.sandbox.paypal.com`, and no setting can change it.
- Every PayPal POST that moves money sends a `PayPal-Request-Id` derived from the approval id plus the step (`<approvalId>-open`, `<approvalId>-capture`, `<holdId>-void`, `<captureId>-refund`). A retried call then can't pay twice.
- Secrets live only in `.env.local` (locally) and in Render's environment settings (hosted). Never print, `cat` or regex-mask their values. Check only variable names or `[ -n "$VAR" ]`. Never commit a key.
- Merchant, listing, Channel3 and agent-written text is untrusted data. It goes into prompts only inside the untrusted-data wrapper.
- Demo content (fixtures, seed rules, suggested tasks, video) uses generic products and fictional shop names: no third-party trademarks. PayPal, Channel3 and Render are the hackathon's sponsors and may be named.
- Confidentiality (from BRIEF.md): never name Rochak's employer, client bank or their products anywhere. Say "a UK bank".
- Env switches, all defaulting to offline fakes:
  - `CHECKER=keyword|claude|claude-haiku|gemini`
  - `PARSER=pattern|claude|gemini`
  - `SEARCH=fixtures|firecrawl|channel3`
  - `SHOPPER=scripted|claude|gemini`
  - `PAYMENTS=fake|stripe|paypal` (`ISSUER` is still read when `PAYMENTS` is unset)
  - `HOSTED=1` turns on per-visitor data and limits.
- Copy uses plain English and UK spelling. Demo money is US dollars (decided 21 Oct); `money()` still defaults to GBP for old fixtures and evals. The word "card" appears in the UI only on the Stripe rail.
- Every session ends with `npm test` and `npm run typecheck` passing. Then commit on a branch, push, and open a PR. Rochak merges; never merge yourself.
- After each session:
  - tick its steps in this file and add an "As built" note under its heading, as in the old plan;
  - update `BRIEF.md` when a decision lands or a question is answered;
  - at about 50% context, write a handoff and continue in a fresh session.

## Review Focus

Five failure modes that the requirements imply but no happy-path test covers. They're the ones most likely to hurt a judge or a real user. Each has a pinned test in the session named.

1. **A PayPal call fails or is retried mid-payment** (timeout, 5xx, a decline after our check approved). The person must never pay twice and must never be told "Paid" when nothing was taken. Tests: Session 6 ("capture fails after the check approved", "a retry after a failed capture is refused, and capture is not called again", "requests carry the fixed PayPal-Request-Id").
2. **The off switch with open PayPal holds.** Every open hold is voided. If a void call fails, the purchase is still revoked and any later charge is refused. Tests: Session 6 ("off switch voids PayPal holds", "a void failure is logged, not thrown").
3. **Money conversion at the edges.** Channel3 sends `19.99`, `0.3`, `395` or a currency we don't support. PayPal needs `"19.99"` and `"0.05"`. A wrong conversion is a wrong charge. Tests: Session 6 (`toPayPalAmount`) and Session 9 (Channel3 prices, unsupported currency skipped).
4. **A tampered visitor cookie** (`../../etc`, very long, uppercase, empty). It must never reach the file system as a path. The visitor gets a fresh id and never sees someone else's data. Tests: Session 4.
5. **The daily limit or the AI quota runs out mid-judging.** The demo must keep working: the run falls back to the offline agent with a clear one-line notice, and never crashes or auto-approves. Tests: Session 5.

---

## File map (new and changed in this plan)

```
docs/superpowers/plans/2026-10-21-paypal-hackathon.md   this plan
docs/devpost.md                    write-up to paste into Devpost (S15)
docs/user-test.md                  5-person test kit (S13, optional)
docs/video-run-of-show.md          video script (S14)
LICENSE                            MIT (S12)
render.yaml                        Render blueprint (S11)
scripts/
  paypal-spike.ts                  S1, kept as a reference
  channel3-smoke.ts                S9
  video/record.mjs  video/post.mjs S14, adapted from the Agent Mandates video scripts
src/
  proxy.ts                         S4: issues the visitor cookie (hosted only)
  demo/demoContent.ts              S3: DEMO_RULES, SUGGESTED_TASKS, seedDemo()
  hosted/usage.ts                  S5: daily limits
  store/visitor.ts                 S4: per-visitor stores
  payments/rail.ts                 S2: PaymentRail (was cardIssuer.ts)
  payments/fakeRail.ts             S2: (was fakeIssuer.ts)
  integrations/paypal/
    client.ts                      S6: OAuth token + request + errors + toPayPalAmount
    rail.ts                        S6: hold / capture / void
    vault.ts                       S7: save the buyer's PayPal
  integrations/channel3/search.ts  S9
  app/paypal/return/route.ts       S7: PayPal sends the buyer back here
  app/api/health/route.ts          S11
```

---

## Phase 0: Before code

### Session 0: Prerequisites (Rochak, about 60 minutes, no code)

Work through "What I need from you", items 1–8. Session 1 needs items 1 and 4. The others can wait until the session that needs them.

- [x] Eligible: confirmed (21 Oct)
- [ ] Product name decided
- [ ] Devpost registered
- [x] PayPal sandbox app (Merchant type, Save payment methods ticked) linked to a US shop, UK buyer, keys in `.env.local`
- [ ] Channel3 key with promo code, in `.env.local`
- [ ] Gemini: free or paid decided
- [ ] Render account and credits claimed

### Session 1: PayPal sandbox spike (go/no-go gate)

> **As built (21 Oct 2026): Go, in US dollars.** Answers are in BRIEF.md, "PayPal: verified in sandbox". Holds come back in the order response, so no `/authorize` call is needed. Overcharges above 115% are refused, a capture after a final capture or a void is refused, a second shop is refused and a repeated request id doesn't double-charge. PayPal itself allows +15% (so the Session 8 explainer uses its first version). Two UK sandbox shops were refused vaulting (`NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`); the US default shop works, but leaves £ payments `PENDING` and its login is refused. **Ruling (Rochak): the demo charges in USD.** The spike script gained `SPIKE_CURRENCY=USD` and a read-only `get <path>` command; `payee` reads `THE_SECOND_SHOP` from `.env.local`. Step 4.11's screenshot comes from the buyer's activity page (Rochak, before Session 14).

**Needs:** `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env.local`. Rochak at the keyboard for about 5 minutes to log in as the sandbox buyer.

No app code and no tests. One throwaway script answers the questions everything else depends on. Answers go in `BRIEF.md` under a new heading, "PayPal: verified in sandbox".

**Files:**
- Create: `scripts/paypal-spike.ts`
- Modify: `package.json` (script `"paypal:spike": "node --env-file-if-exists=.env.local --import tsx scripts/paypal-spike.ts"`), `.env.example` (names only: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_VAULT_ID`, `# PAYMENTS=paypal`), `BRIEF.md`

- [x] **Step 1: Read the current docs.** The saved copies are in `/Users/rochakagarwal/orca/projects/Agent Mandates/.firecrawl/`:
  - `pp-platforms-checkout-save-payment-methods-purchase-later-payment-tokens-api-paypal.md` (vault);
  - `pp-payment-methods-auth-honor.md` (hold lifetime and the 115% rule);
  - `pp-platforms-checkout-standard-customize-overcharge-handling.md`;
  - `pp-orders-v2.md`.

  Also fetch (append `.md` to developer.paypal.com URLs) the Orders v2 API reference sections for create order and authorize order, and the Payments v2 reference for capture authorization, void authorization and refund capture. Write down the exact request body, the success status and the error `name`/`issue` for each, and the `usage_pattern` values that setup tokens accept.

- [x] **Step 2: Write `scripts/paypal-spike.ts`** with these subcommands. Each prints statuses, ids and error names, never the access token or the client secret. The base URL is the constant `https://api-m.sandbox.paypal.com`.
  - `token`: gets an OAuth token (`POST /v1/oauth2/token`, Basic auth, `grant_type=client_credentials`). Prints `ok, expires in <n>s`.
  - `vault-start`: `POST /v3/vault/setup-tokens` with `payment_source.paypal` = `{ description: 'The Payer: lets your agent pay for purchases you approve', usage_type: 'MERCHANT', customer_type: 'CONSUMER', permit_multiple_payment_tokens: false, usage_pattern: <the doc's pattern for merchant-initiated, unscheduled payments, falling back to 'IMMEDIATE' as in the doc sample>, experience_context: { return_url: 'http://localhost:3000/paypal/return', cancel_url: 'http://localhost:3000/paypal/cancel', brand_name: 'The Payer', shipping_preference: 'NO_SHIPPING' } }`. Prints the setup token id and the `rel: approve` link.
  - `vault-finish <setupTokenId>`: `POST /v3/vault/payment-tokens` with `payment_source.token = { id, type: 'SETUP_TOKEN' }`. It appends `PAYPAL_VAULT_ID=<id>` to `.env.local` itself and prints only `saved vault id ending <last 4>`.
  - `hold <pounds>`: `POST /v2/checkout/orders`, `intent: 'AUTHORIZE'`, one purchase unit (GBP, the given amount, `description: 'Spike test at Example Shop'`), `payment_source.paypal.vault_id`. Prints the order status and the authorisation id and status. If there is no authorisation, it calls `POST /v2/checkout/orders/{id}/authorize` and prints that result.
  - `capture <authId> <pounds> [--partial]`: `POST /v2/payments/authorizations/{id}/capture` with the amount and `final_capture: !partial`.
  - `void <authId>`, `refund <captureId>`.
  - `payee <pounds> <secondShopEmail>`: like `hold`, but with `purchase_units[0].payee.email_address` set to a second sandbox business account.
  - `repeat <pounds>`: sends the same order twice with the same `PayPal-Request-Id` and prints both order ids.

- [x] **Step 3: Save the buyer's PayPal.** Run `npm run paypal:spike token` and expect `ok`. Run `vault-start`. Rochak opens the approve link, logs in as the sandbox buyer and approves. Rochak types the password; Claude never does. The browser then lands on a localhost page that doesn't exist yet, which is fine. Run `vault-finish <id>`.
  Expected: `saved vault id ending ….` If you get `NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE` or a permission error, stop. Rochak checks the app type (Merchant) and "Save payment methods", then retry once. If it still fails, draft the Discord question for Rochak and go to Step 6's fallback.

- [x] **Step 4: Answer the questions**, one command each. Write each answer in BRIEF.md with the exact status or error name:
  1. Hold £60 with no buyer present: does it work? Is the authorisation returned at once, or does it need `/authorize`?
  2. Capture exactly £60: `COMPLETED`?
  3. On a new £60 hold, capture £80 (+33%): refused? With what error?
  4. On a new £60 hold, capture £65 (+8%): allowed, refused, or `PAYER_ACTION_REQUIRED`? This decides the "15%" line in the video.
  5. A second capture after a final capture: refused?
  6. Void a fresh hold, then try to capture it: refused?
  7. Refund a capture: `COMPLETED`?
  8. `payee` to a second shop: allowed? (Expected: refused without partner setup.)
  9. `repeat`: same order id both times?
  10. Partial captures: hold £100, capture £30 `--partial`, then £40 `--partial`, then try £40 more. Is the third refused? This is only needed for the fallback.
  11. Where these show up in the sandbox (buyer's and shop's activity pages at sandbox.paypal.com). Rochak takes one screenshot for the video.

- [x] **Step 5: Run `npm test` and `npm run typecheck`.** Expected: all pass (no app code changed).

- [x] **Step 6: Decide, and record the decision in BRIEF.md.**
  - **Go**, if Questions 1–3 behave as expected: continue with Session 2 as written.
  - **Fallback**, if vaulting is refused: rewrite Sessions 6–8 here before continuing. The buyer approves one hold per task (an approve link opened from the Ask screen) for the task's budget, and approved purchases are partial captures within it (Question 10). Session 7 becomes "approve this task's budget in PayPal".
  - **Stop and talk to Rochak**, if neither works.

- [x] **Step 7: Commit, push, open a PR.**

```bash
git add scripts/paypal-spike.ts package.json .env.example BRIEF.md docs/superpowers/plans/2026-10-21-paypal-hackathon.md
git commit -m "spike: PayPal sandbox vault, hold, capture, void and refund answers"
```

---

## Phase A: Product changes on fakes (no keys)

### Session 2: Rename "card" to "payment" (fakes only, no behaviour change)

> **As built (21 Oct 2026):** done as written, 166 tests still passing. Also changed, though not in the file list: the payment check's two "card" messages (`paymentGate.ts`: "No approved purchase matches this payment.", "This one-time payment has already been used."), because Step 5 forbids user-facing "card" on the fake rail. `RailName` and `PaymentRef` live in `src/domain/types.ts` (re-exported from `rail.ts`) so the domain doesn't import from payments. The Stripe webhook needed no lookup change: it finds the purchase through the card's `approval_id` tag. `createStripeIssuer` keeps its name. Step 6 was checked without a browser (the Chrome extension wasn't connected): a task through `npm run demo:flow`, then the Ask screen's run data and the rendered Activity and Ask pages.

PayPal has no cards. The code and screens should say what really happens: a one-time payment for exactly the approved amount. This is a rename with copy changes; behaviour stays the same and every existing test stays green.

**Files:**
- Rename: `src/payments/cardIssuer.ts` → `src/payments/rail.ts`; `src/payments/fakeIssuer.ts` → `src/payments/fakeRail.ts`
- Modify:
  - `src/domain/types.ts`
  - `src/payments/fulfil.ts`, `src/payments/agentSwitch.ts`
  - `src/flow/runs.ts`, `src/deps.ts`
  - `src/integrations/stripe/issuer.ts`
  - `src/app/api/stripe/webhook/route.ts`, `src/app/actions.ts`
  - `src/app/activity/page.tsx`, `src/app/ask/AskAgent.tsx`, `src/app/ask/page.tsx`
  - `src/domain/labels.ts` (if it labels log types)
  - `.env.example`, `README.md` (env names only)
- Test: every `*.test.ts` that uses `card`, `issuer`, `createFakeIssuer` or `card_issued`

**Interfaces (Produces):**

```ts
// src/payments/rail.ts
export type PaymentHandle = { id: string; label: string };
export type ChargeResult = GateResult & { providerRef?: string };
export type RailName = 'fake' | 'stripe' | 'paypal';
export interface PaymentRail {
  readonly name: RailName;
  /** Sets up a one-time payment for exactly the approved total. The agent never sees it. */
  open(approval: Approval): Promise<PaymentHandle>;
  /** The shop asks to be paid. The payment check decides; the rail only moves money it approves. */
  charge(input: { handle: PaymentHandle; amount: Money; merchant: string }): Promise<ChargeResult>;
  cancel(handleId: string): Promise<void>;
}
// src/payments/fakeRail.ts
export function createFakeRail(store: Store, clock?: () => Date): PaymentRail;
// src/domain/types.ts
export type PaymentRef = PaymentHandle & { provider: RailName };   // replaces CardRef
// Approval.payment: PaymentRef | null                               // replaces Approval.card
// LogType: 'payment_opened' replaces 'card_issued'; add 'paid' and 'refunded' (used from Session 6)
// src/flow/runs.ts
// FlowDeps.rail: PaymentRail (was issuer); RunPurchase.paymentLabel: string | null (was last4)
```

**Copy (exact):**

| Where | Now | New |
|---|---|---|
| `ask/page.tsx` | "It never sees your card." | "It never sees how you pay." |
| `runs.ts` status after payment | "Paid with a one-time card." | `` `Paid ${formatMoney(req.total)}, once, for this purchase only.` `` |
| `fulfil.ts` log on open | "One-time card •••• 1234 created for up to …" | `` `${handle.label}: set up for exactly ${formatMoney(total)} at ${merchant}.` `` |
| `fulfil.ts` error | "Couldn't create a card: …" | "Couldn't set up the payment: …" |
| `activity/page.tsx` | "One-time card •••• 1234 (fake)" | the payment's `label` |
| `activity/page.tsx` | "Turning it off cancels every open approval and card." | "Turning it off cancels every open approval and payment." |
| `actions.ts` | "This purchase has no card." | "This purchase has no payment set up." |
| Labels | — | fake: `Offline test payment`; Stripe: `` `One-time card •••• ${last4}` `` |

- [x] **Step 1: Update the tests first.** Rename the identifiers in the test files: `createFakeIssuer` → `createFakeRail`, `issuer` → `rail`, `.card` → `.payment`, `'card_issued'` → `'payment_opened'`, `issueCard` → `open`, `simulateCharge` → `charge`, `cancelCard` → `cancel`. Add one assertion to the fulfil test: `expect(saved.payment).toMatchObject({ provider: 'fake', label: 'Offline test payment' })`.
- [x] **Step 2: Run `npm run typecheck`.** Expected: FAIL. The tests reference names that don't exist yet.
- [x] **Step 3: Do the renames and copy changes** in the files listed. `getDeps()` reads `process.env.PAYMENTS ?? process.env.ISSUER`. The Stripe rail keeps its file and its behaviour; only its method names, `label` and type change. The Stripe webhook looks the approval up by `a.payment?.id`.
- [x] **Step 4: Run `npm test && npm run typecheck`.** Expected: all pass, same count as before plus nothing removed (166 at the start of this plan).
- [x] **Step 5: Check for stray "card" wording.** Run `git grep -n -i -E "card" -- src/app src/flow src/payments`. Expected: hits only in `CardIcon`, gift-card rules or category names, and the Stripe label. No user-facing sentence says "card" for the fake or PayPal rail.
- [x] **Step 6: Run the app.** Run `npm run seed && npm run dev`, then do one task from the Ask screen. Expected: the receipt and the activity entry say "Offline test payment" and "Paid $…, once, for this purchase only." (or £ for an old fixture)
- [x] **Step 7: Commit, push, open a PR.** Message: `refactor: card issuer becomes a payment rail, ready for PayPal`.

### Session 3: Retail demo on fakes (rules, products, suggested tasks)

Channel3 is retail only, so the demo story moves from a hotel to shopping. Offline mode must tell the same story with no keys. It's the video backup and the fallback when the daily limit is reached. Today's fixtures name real brands, which the video rules forbid.

**Files:**
- Create: `src/demo/demoContent.ts`, `src/demo/demoContent.test.ts`
- Modify:
  - `src/agent/fixtures.ts` (new retail scenarios; the hotel one stays; replace brand names in all scenarios);
  - `scripts/seed.ts` (uses `seedDemo`);
  - `src/app/ask/AskAgent.tsx` (suggested-task buttons);
  - `src/flow/runs.test.ts` or a new `src/demo/demoFlow.test.ts`.

**Interfaces (Produces):**

```ts
// src/demo/demoContent.ts
export const DEMO_RULES: string;            // exact text below
export const SUGGESTED_TASKS: readonly string[];   // exact text below, in this order
export async function seedDemo(db: Db): Promise<void>; // replaces rules with DEMO_RULES parsed by patternParser; agentEnabled = true
```

**Exact demo content:**

```
DEMO_RULES =
Up to $80 on any one item.
Only new items: nothing used or refurbished.
Ask me before buying anything that's a gift or for someone else.
No gift cards.

SUGGESTED_TASKS =
1. Buy a plain white ceramic mug, under $15
2. Buy a birthday present for my nephew, about $40
3. Buy wireless headphones under $80
```

| Task | Fixture pick (fictional shop, generic product) | Expected outcome |
|---|---|---|
| Mug | "White stoneware mug, 350 ml", shop **Hearth & Kiln**, $12.00, category `home`, condition new, "Returns within 30 days." | Approve → paid $12 |
| Nephew | "Building blocks race car set, ages 9+", shop **Brick & Bolt Toys**, $38.00, category `other`, "Free returns within 60 days." | Ask (gift rule) |
| Headphones | "Wireless over-ear headphones (refurbished)", shop **Second Spin Audio**, $55.00, category `electronics`, listing text "Condition: refurbished. 90-day warranty." | Block (new-only rule) |

The three new retail scenarios are priced in USD (`money(12, 'USD')`); the older scenarios keep their currency. The offline rule reader (`src/rules/patternParser.ts`) only reads `£` today and hard-codes GBP, so "Up to $80" would become a judgement rule: teach it `$` → USD and `€` → EUR (test first: "Up to $80 on any one item." gives `amount_cap` with `{ minor: 8000, currency: 'USD' }`; the `£` cases stay as they are). Also change the old `£` strings in `src/app/activity/page.tsx` ("charge £20 more") and `AskAgent.tsx` to dollars.

In the existing scenarios, replace "LEGO" with the building-blocks set and "Bose" with generic headphones. Replace the "Waterstones" fallback with **Paper Lane Books**. The existing `match` regexes keep matching "lego" and "toy" so old habits still work.

- [ ] **Step 1: Write the failing tests** in `src/demo/demoContent.test.ts`:

```ts
it('parses the demo rules into the four expected rules', async () => {
  const db = emptyDb(); await seedDemo(db);
  expect(db.rules.map((r) => [r.kind, r.onBreach])).toEqual([
    ['amount_cap', 'ask'], ['judgement', 'block'], ['judgement', 'ask'], ['category', 'block'],
  ]); // checked 21 Oct 2026: patternParser already reads DEMO_RULES this way
  expect(db.settings.agentEnabled).toBe(true);
});
it('the three suggested tasks reach the mug, gift and headphones scenarios', () => {
  expect(SUGGESTED_TASKS.map((t) => scenarioFor(t).pick.merchant)).toEqual(['Hearth & Kiln', 'Brick & Bolt Toys', 'Second Spin Audio']);
});
it('no fixture names a real brand', () => {
  const text = JSON.stringify([...SCENARIOS, FALLBACK]);
  for (const brand of ['LEGO', 'Bose', 'Waterstones']) expect(text).not.toContain(brand);
});
```

  And a flow test, using the scripted shopper, the keyword checker, the fake rail and `seedDemo`: the mug task ends `used` with log types including `payment_opened` and `charge_approved`; the nephew task ends `pending`; the headphones task ends `blocked` with a reason quoting "nothing used or refurbished".
- [ ] **Step 2: Run `npx vitest run src/demo`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `demoContent.ts` and the fixture changes. If the keyword checker doesn't block the headphones (the listing contains "refurbished", and the judgement rule names it), change the fixture's listing text first. Change the checker only if no plain wording works, and add a keyword-checker test if you do.
- [ ] **Step 4: Add the suggested tasks to `AskAgent.tsx`.** Show three small buttons under the task box that fill it in, without sending. Follow the existing button styles in `src/components/ui.tsx`.
- [ ] **Step 5: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 6: Run `npm run seed && npm run demo:flow`, then do the three tasks in the browser.** Expected: approve and paid, ask, block, in that order.
- [ ] **Step 7: Commit, push, open a PR.** Message: `feat: retail demo with generic products and suggested tasks`.

### Session 4: Hosted mode 1, one data file per visitor

Judges share one URL. Each must start from the same seeded demo and never see another visitor's purchases. This is off unless `HOSTED=1`, so local use is unchanged.

**Read first:**
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (where `proxy.ts` lives in a `src/` project, and how to set a cookie that the same request can already read);
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`;
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md` (request APIs can't be used inside `after`, so resolve the store before it).

**Files:**
- Create: `src/store/visitor.ts`, `src/store/visitor.test.ts`, `src/proxy.ts` (or wherever the docs say)
- Modify:
  - `src/deps.ts` (`getDeps` becomes async);
  - `src/app/actions.ts`;
  - `src/app/layout.tsx`, `src/app/rules/page.tsx`, `src/app/approvals/page.tsx`, `src/app/activity/page.tsx` (use `await currentStore()`);
  - `src/app/api/runs/[id]/route.ts`;
  - `scripts/demo-flow.ts`;
  - `.env.example` (`# HOSTED=1`).

**Interfaces (Produces):**

```ts
// src/store/visitor.ts
export const VISITOR_COOKIE = 'payer_visitor';
export function newVisitorId(): string;                       // 24 chars, [a-z0-9], from node:crypto
export function isValidVisitorId(id: string | undefined): id is string;  // exactly /^[a-z0-9]{24}$/
export function visitorStorePath(dataDir: string, id: string): string; // throws on an invalid id
export async function openVisitorStore(dataDir: string, id: string): Promise<Store>; // first open: seedDemo
export function pruneVisitors(dataDir: string, keep: number): void;     // deletes the oldest files beyond `keep` (by mtime)
export async function currentStore(): Promise<Store>;  // HOSTED unset → defaultStore(); set → this visitor's store
// src/deps.ts
export async function getDeps(): Promise<Deps>;
```

The visitor data folder is `path.join(process.cwd(), 'data', 'visitors')`. `currentStore()` calls `pruneVisitors(dir, 300)` when it creates a new visitor file. If the cookie is missing or invalid in a request (it shouldn't be, after the proxy), `currentStore()` uses a new visitor id for that request only, never a shared file. Pruning removes the orphan file later.

- [ ] **Step 1: Write the failing tests** in `src/store/visitor.test.ts`:
  - `isValidVisitorId` rejects `undefined`, `''`, `'../../etc/passwd'`, `'A'.repeat(24)`, `'a'.repeat(23)`, `'a'.repeat(25)` and `'a'.repeat(23) + '/'`, and accepts `newVisitorId()` 100 times out of 100;
  - `visitorStorePath(dir, '../x')` throws, and a valid id gives a path inside `dir`;
  - the first `openVisitorStore` creates a file seeded with 4 rules and `agentEnabled: true`;
  - after saving 1 rule, a second open still has 1 rule (no re-seed);
  - two ids have separate data;
  - `pruneVisitors(dir, 2)` with 3 files leaves the 2 newest.
- [ ] **Step 2: Run `npx vitest run src/store/visitor.test.ts`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement `visitor.ts`.**
- [ ] **Step 4: Implement `proxy.ts`.** When `HOSTED=1` and the cookie is missing or invalid, set it to `newVisitorId()` with `httpOnly`, `sameSite: 'lax'`, `secure` in production, `path: '/'` and `maxAge` 30 days. Make it visible to the same request, as the proxy doc shows. Skip static assets.
- [ ] **Step 5: Make `getDeps()` async and switch every caller to `await getDeps()` or `await currentStore()`.** In `startTask`, resolve deps before `after(...)`.
- [ ] **Step 6: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 7: Manual check.** Run `HOSTED=1 npm run dev`. Open the app in a normal window and a private window. Edit the rules in one; the other still shows the four demo rules. Run a task in one; the other's Activity is empty. Without `HOSTED`, the app uses `data/db.json` as before.
- [ ] **Step 8: Commit, push, open a PR.** Message: `feat: hosted mode gives each visitor their own seeded demo`.

### Session 5: Hosted mode 2, daily usage limits with offline fallback

The Gemini free tier allows 500 calls a day, and one live task uses up to 12. Channel3 credits are finite. Judges may come on any day from 1 to 15 Dec. When a limit is reached, the demo must keep working on the offline agent and say so plainly.

**Files:**
- Create: `src/hosted/usage.ts`, `src/hosted/usage.test.ts`
- Modify: `src/deps.ts`, `src/app/actions.ts`, `src/app/ask/AskAgent.tsx` (shows the notice event like other status events), `.env.example`

**Interfaces (Produces):**

```ts
// src/hosted/usage.ts
export type Limits = { tasksPerVisitorPerDay: number; tasksPerDay: number; previewsPerVisitorPerDay: number };
export const DEFAULT_LIMITS: Limits = { tasksPerVisitorPerDay: 8, tasksPerDay: 30, previewsPerVisitorPerDay: 20 };
export function limitsFromEnv(env?: NodeJS.ProcessEnv): Limits;  // LIMIT_TASKS_PER_VISITOR, LIMIT_TASKS_PER_DAY, LIMIT_PREVIEWS_PER_VISITOR
/** Counts one use if allowed. Days are UTC. File: data/usage.json. A missing or unreadable file counts as zero. */
export function takeAllowance(file: string, kind: 'task' | 'preview', visitorId: string, now: Date, limits: Limits): boolean;
export const OFFLINE_NOTICE = "Today's live AI limit is used up, so this run uses the offline demo agent. Payments still go through PayPal's sandbox.";
// src/deps.ts
export async function getDeps(opts?: { live?: boolean }): Promise<Deps>; // live: false → keyword checker, pattern parser, fixtures, scripted shopper; payment rail unchanged
```

`startTask` (when hosted): if `takeAllowance(…, 'task', …)` is false, the run uses `getDeps({ live: false })` and its first event is `{ kind: 'status', text: OFFLINE_NOTICE }`. `previewRules` (when hosted): if a preview isn't allowed, it uses the pattern parser. The pattern parser is offline already, so nothing is shown.

- [ ] **Step 1: Write the failing tests:**
  - a visitor's 8 tasks are allowed and the 9th is refused, while another visitor is still allowed;
  - the 31st task of the day across visitors is refused;
  - counts reset on the next UTC day;
  - preview counts are separate from task counts;
  - a file containing `not json` counts as zero and is rewritten, with no throw;
  - `limitsFromEnv({ LIMIT_TASKS_PER_DAY: '2' })` gives `tasksPerDay: 2`, and a non-number value falls back to the default;
  - `getDeps({ live: false })` with `SHOPPER=gemini` set still returns the scripted shopper.
- [ ] **Step 2: Run `npx vitest run src/hosted`.** Expected: FAIL.
- [ ] **Step 3: Implement**, writing the file the same way `store.ts` does (write a temp file, then rename).
- [ ] **Step 4: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 5: Manual check.** Run `HOSTED=1 LIMIT_TASKS_PER_VISITOR=1 npm run dev`. The second task shows the offline notice and still completes.
- [ ] **Step 6: Commit, push, open a PR.** Message: `feat: daily usage limits fall back to the offline agent`.

---

## Phase B: Integrations

### Session 6: PayPal client and payment rail (offline tests, no keys)

Use the request shapes and answers recorded in BRIEF.md by Session 1. Where this session and BRIEF.md differ, BRIEF.md wins: write a `Ruling:` line in the ledger.

**Files:**
- Create: `src/integrations/paypal/client.ts`, `client.test.ts`, `src/integrations/paypal/rail.ts`, `rail.test.ts`
- Modify: `src/deps.ts` (`PAYMENTS=paypal` → `createPayPalRail`), `src/payments/agentSwitch.test.ts` (adds a PayPal case), `.env.example`

**Interfaces (Produces):**

```ts
// src/integrations/paypal/client.ts
export const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com'; // sandbox only, by design
export type PayPalAmount = { currency_code: Currency; value: string };
export function toPayPalAmount(m: Money): PayPalAmount;          // 1999 → "19.99"
export class PayPalError extends Error { status: number; issue: string | null; debugId: string | null }
export type PayPalClient = { request<T>(method: 'GET' | 'POST', path: string, opts?: { body?: unknown; requestId?: string }): Promise<T> };
export function createPayPalClient(opts: { clientId: string; clientSecret: string; fetch?: typeof fetch; now?: () => number }): PayPalClient;
export function payPalClientFromEnv(): PayPalClient;             // throws 'PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set'
// src/integrations/paypal/rail.ts
export function createPayPalRail(deps: { store: Store; client: PayPalClient; vaultId: () => string | null; clock: () => Date }): PaymentRail;
```

**Rail behaviour:**
- **`open(approval)`:**
  - With no vault id, throw `Error('PayPal is not connected yet.')`. `fulfil` already turns that into a logged "Couldn't set up the payment: …".
  - Otherwise `POST /v2/checkout/orders` with `requestId: <approval.id>-open` and this body:

    ```
    {
      intent: 'AUTHORIZE',
      purchase_units: [{
        reference_id: approval.id,
        custom_id: approval.id,
        description: `${item} at ${merchant}` (cut to 127 chars),
        amount: toPayPalAmount(total),
      }],
      payment_source: { paypal: { vault_id } },
    }
    ```

  - The hold id is `purchase_units[0].payments.authorizations[0].id`, or the result of `/authorize` if Session 1 found it's needed.
  - Returns `{ id: holdId, label: \`PayPal, held ${formatMoney(total)}\` }`.
- **`charge({ handle, amount, merchant })`:**
  - Find the approval by `payment.id === handle.id`, then run `checkCharge(store, …)`.
  - If the check declines, return its result without calling PayPal.
  - If it approves, `POST /v2/payments/authorizations/{handle.id}/capture` with `requestId: <approvalId>-capture` and body `{ amount: toPayPalAmount(amount), final_capture: true, invoice_id: approvalId }`.
  - Only a `COMPLETED` capture counts as paid. A `PENDING` capture (seen with £ on a US shop) logs `error` with "PayPal is holding the payment for the shop to accept." and returns `approved: false`; with USD it doesn't happen.
  - On success, log `paid`: `` `PayPal took ${formatMoney(amount)} (capture ${id}).` `` Return `{ approved: true, reasons: [], providerRef: id }`.
  - On failure, log `error`: `` `PayPal didn't take the payment: ${issue ?? message}. Nothing was charged.` `` Return `{ approved: false, reasons: [that text] }`. The approval stays `used`, so it can never be retried into a double payment.
- **`cancel(holdId)`:** `POST /v2/payments/authorizations/{holdId}/void` with `requestId: <holdId>-void`. Errors are caught and logged as `error`, never thrown.

- [ ] **Step 1: Write the failing client tests.** Use a fake `fetch` that records the calls.
  - `toPayPalAmount`: 1200 gives "12.00", 1999 gives "19.99", 5 gives "0.05", 24000 gives "240.00", and the currency is copied across.
  - Two requests fetch one token; after expiry a new token is fetched; a 401 is retried once with a new token, and a second 401 throws.
  - Every URL starts with `PAYPAL_BASE`.
  - `requestId` is sent as the `PayPal-Request-Id` header.
  - An error body `{ name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'AUTHORIZATION_ALREADY_CAPTURED' }], debug_id: 'abc' }` with status 422 throws a `PayPalError` with `issue: 'AUTHORIZATION_ALREADY_CAPTURED'` and `status: 422`.
  - The client secret never appears in any thrown message.
- [ ] **Step 2: Write the failing rail tests.**
  - `open` sends `intent: 'AUTHORIZE'`, the exact `toPayPalAmount(total)`, the `vault_id` and `requestId` `<id>-open`, and returns the label "PayPal, held $12".
  - `open` with no vault id throws "PayPal is not connected yet.", and `fulfil` logs "Couldn't set up the payment".
  - `charge` for the exact amount calls capture once with `final_capture: true` and `requestId` `<id>-capture`. The approval is `used`, and the log ends with `charge_approved` then `paid`.
  - `charge` for $20 more makes no capture call and is declined with the "more than the approved" reason.
  - `charge` from another shop makes no capture call.
  - `charge` a second time makes no capture call ("already been used").
  - **Capture fails after the check approved:** capture throws a `PayPalError`. The result is `approved: false` with the reason "PayPal didn't take the payment", the status stays `used`, and the log has an `error` entry.
  - **A retry after a failed capture is refused, and capture is not called again.**
  - `cancel` calls void once. **A void failure is logged, not thrown.**
  - In `agentSwitch.test.ts`, **the off switch voids PayPal holds**: one approved purchase with a PayPal hold gives one void call, and the status is `revoked`.
- [ ] **Step 3: Run `npx vitest run src/integrations/paypal src/payments`.** Expected: FAIL (module not found).
- [ ] **Step 4: Implement `client.ts`, then `rail.ts`.** Validate PayPal responses with Zod schemas that keep only the fields we read.
- [ ] **Step 5: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 6: Commit, push, open a PR.** Message: `feat: PayPal payment rail (hold, capture after the payment check, void)`.

### Session 7: "Connect PayPal" (save the buyer's PayPal once)

**Needs:** PayPal keys. Rochak logs in as the sandbox buyer once (Rochak types the password).

**Files:**
- Create: `src/integrations/paypal/vault.ts`, `vault.test.ts`, `src/app/paypal/return/route.ts`, `src/app/paypal/return/route.test.ts` (or test the handler as a plain function)
- Modify:
  - `src/domain/types.ts` (`Settings`), `src/store/store.ts` (`emptyDb`);
  - `src/app/actions.ts` (`connectPayPal`, `disconnectPayPal`);
  - `src/app/ask/page.tsx` (connection strip at the top);
  - `src/deps.ts` (the rail's `vaultId` reads `vaultIdFor(db)`);
  - `.env.example` (`APP_URL`, `PAYPAL_VAULT_ID`).

**Interfaces (Produces):**

```ts
// src/domain/types.ts
export type Settings = { agentEnabled: boolean; paypal: { vaultId: string; connectedAt: string } | null };
// src/integrations/paypal/vault.ts
export async function startVaultSetup(client: PayPalClient, appUrl: string): Promise<{ setupTokenId: string; approveUrl: string }>;
export async function finishVaultSetup(client: PayPalClient, setupTokenId: string): Promise<{ vaultId: string }>;
export function vaultIdFor(db: Db, env?: NodeJS.ProcessEnv): string | null; // db.settings.paypal?.vaultId ?? env.PAYPAL_VAULT_ID ?? null
export function isValidSetupTokenId(id: string | null): id is string;      // /^[A-Z0-9]{10,30}$/
```

**Flow:**
1. On the Ask screen, a strip shows either "PayPal connected" (with "Disconnect"), "Using the demo PayPal buyer (sandbox)" (when only `PAYPAL_VAULT_ID` is set), or a "Connect PayPal" button.
2. The button calls `connectPayPal`, which redirects to PayPal's approve link. The return URL is `${APP_URL}/paypal/return` (`APP_URL` defaults to `http://localhost:3000`).
3. The return route reads the setup token id from the query, using the parameter name recorded in Session 1, and validates it. Only then does it call `finishVaultSetup`, save `settings.paypal` and redirect to `/ask?paypal=connected`.
4. A cancel or an invalid token redirects to `/ask?paypal=cancelled` without calling PayPal.

The setup-token body is the one from Session 1's `vault-start`, with URLs from `APP_URL`.

- [ ] **Step 1: Write the failing tests:**
  - `startVaultSetup` posts to `/v3/vault/setup-tokens` with `usage_type: 'MERCHANT'`, `customer_type: 'CONSUMER'` and the two URLs, and returns the `rel: 'approve'` link;
  - it throws "PayPal didn't return an approval link" when that link is missing;
  - `finishVaultSetup` posts `{ payment_source: { token: { id, type: 'SETUP_TOKEN' } } }`;
  - `vaultIdFor` prefers the visitor's own vault id over the env one, and returns null when neither is set;
  - an old db file with no `settings.paypal` gives null, not a crash;
  - the return handler with `token=../../x` or no token makes no PayPal call and redirects to `cancelled`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Read the Next docs for route handlers and `redirect` in server actions first.
- [ ] **Step 4: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 5: Live check.** Run `PAYMENTS=paypal npm run dev` and click "Connect PayPal". Rochak logs in as the sandbox buyer and approves. The Ask strip shows "PayPal connected".
- [ ] **Step 6: Commit, push, open a PR.** Message: `feat: connect PayPal once so the agent can pay approved purchases`.

### Session 8: PayPal live end to end + the overcharge scene

**Needs:** PayPal keys and a connected buyer (Session 7). Rochak has the sandbox shop's activity page open.

**Files:**
- Modify:
  - `src/app/activity/page.tsx` (shows the PayPal capture id from the `paid` log entry; explainer line under the demo buttons);
  - `src/app/actions.ts` (demo button labels);
  - `README.md` ("Run it with PayPal" section);
  - `BRIEF.md` (as-built results).
- Test: `src/app/actions.test.ts` only if `demoCharge` logic changes (labels alone need none).

**Demo buttons (exact labels):**
- "Shop asks for $20 more"
- "Another shop asks"
- "Shop asks again"

**Explainer line** (use the first version if Session 1, Question 4 showed a $65 capture on a $60 hold being allowed; otherwise the second). Session 1 showed it allowed, so use the first:
1. "On its own, PayPal lets a shop take up to 15% more than was held (capped at $75). Your mandate holds it to the penny."
2. "Your mandate holds every payment to the penny: a shop gets exactly what you approved, once."

- [ ] **Step 1: Run `npm run seed`, then `PAYMENTS=paypal npm run dev`,** with the offline agent and checker. Do the three suggested tasks and approve the nephew present on the Approvals screen.
  Expected: two `paid` entries ($12 and $38) with capture ids, each `COMPLETED`. The sandbox buyer's activity shows two payments of exactly $12.00 and $38.00 (the shop's page can't be opened; see BRIEF.md).
- [ ] **Step 2: Press each demo button** on the mug purchase.
  Expected: all three are declined by the payment check, with the reason shown, and no new capture appears in the sandbox.
- [ ] **Step 3: Check the off switch.** Send the nephew task again and leave it waiting on Approvals. Turn the agent off.
  Expected: the waiting purchase is cancelled and can't be approved, and a new task is blocked.
  In the normal flow a hold is captured straight away, so an open hold is rare. Voiding one is covered by Session 6's tests, not by this live check.
- [ ] **Step 4: Copy and README.** Add the explainer line and the button labels. Write the README section: env vars, connect, the three tasks, what to look for in the sandbox.
- [ ] **Step 5: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 6: Record the as-built note** with the sandbox order, hold and capture ids, and the screenshot for the video.
- [ ] **Step 7: Commit, push, open a PR.** Message: `feat: PayPal end to end; overcharge, other shop and repeat charges refused`.

#### Session 8b (optional, cut first): Undo with a PayPal refund

A "Refund" button on a paid purchase in Activity, shown for 30 minutes after payment. It calls `POST /v2/payments/captures/{id}/refund` with `requestId: <captureId>-refund`, logs `refunded` and shows "Refunded $12 to your PayPal." Tests:
- the refund is called once;
- a second press makes no call ("already refunded");
- after 30 minutes the button is gone and the action refuses.

### Session 9: Channel3 product search

**Needs:** none for the tests. `CHANNEL3_API_KEY` for Step 6.

**Files:**
- Create: `src/integrations/channel3/search.ts`, `search.test.ts`, `scripts/channel3-smoke.ts`
- Modify:
  - `src/agent/types.ts` (`SearchResult` gains `offer?`);
  - `src/deps.ts` (`SEARCH=channel3`);
  - `package.json` (dependency `@channel3/sdk`, script `"channel3:smoke": "node --env-file-if-exists=.env.local --import tsx scripts/channel3-smoke.ts"`);
  - `.env.example`.

**Interfaces (Produces):**

```ts
// src/agent/types.ts
export type Offer = { shop: string; price: Money; condition: 'new' | 'used' | 'refurbished' | 'unknown'; inStock: boolean };
export type SearchResult = { title: string; url: string; snippet: string; offer?: Offer };
// src/integrations/channel3/search.ts
export function toSearchResults(product: Channel3Product): SearchResult[];  // one per in-stock offer in a supported currency
export function createChannel3Search(opts?: { apiKey?: string; client?: { products: { search(req: object): Promise<{ products: Channel3Product[] }> } } }): WebSearch;
```

**Behaviour:**
- Request: `{ query, country: 'US', language: 'en', currency: 'USD', limit: 5 }`. Return at most 8 results.
- Each offer becomes one result:
  - `title`: the product title;
  - `url`: the offer's url;
  - `offer.shop`: the offer's `domain`;
  - `offer.price`: `money(price.amount, price.currency)`;
  - `condition`: as given, otherwise `'unknown'`;
  - `inStock`: true for `InStock` and `LimitedAvailability`.
- Skip offers whose currency isn't in `Currency`, and offers that are out of stock.
- `snippet`, which is what the agent reads, has these lines, then up to 1,500 characters of the product description:

  ```
  Shop: <domain>
  Price: <formatMoney>
  Condition: <condition>
  Availability: <availability>
  Refund policy: not stated by the shop
  ```

Before writing the code, check the SDK's real method and type names in `node_modules/@channel3/sdk`. The docs show `new Channel3({ apiKey })` and `client.products.search({ query, country, currency })`. If the installed version differs, follow the installed one.

- [ ] **Step 1: Write the failing tests.** Use a fake client.
  - A product with offers at `{amount: 19.99}`, `{amount: 0.3}` and `{amount: 395}`, all USD, gives prices 1999, 30 and 39500.
  - A SEK offer is skipped.
  - An `OutOfStock` offer is skipped.
  - The condition `refurbished` appears in both `offer` and `snippet`.
  - The request sent has `country: 'US'`, `currency: 'USD'` and the query.
  - There are at most 8 results.
  - With no key, it throws "CHANNEL3_API_KEY is not set".
  - An SDK error with `status: 429` passes through so that `serviceProblem` gives "is over its usage limit".
- [ ] **Step 2: Run `npx vitest run src/integrations/channel3`.** Expected: FAIL.
- [ ] **Step 3: Implement.** Validate the SDK response with Zod, keeping only the fields we read.
- [ ] **Step 4: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 5: Write `scripts/channel3-smoke.ts`.** It takes the query from `argv` and prints title, shop, price and condition for each result.
- [ ] **Step 6: Run the smoke test live** (3 searches, about 3 credits): `npm run channel3:smoke "white ceramic mug"`, `"building blocks set for kids"`, `"wireless headphones"`.
  Expected: USD results from US shops. If fewer than 3 usable results come back for two of the queries, record that and tell Rochak before going on.
- [ ] **Step 7: Commit, push, open a PR.** Message: `feat: Channel3 product search with shop, price and condition`.

### Session 10: Live retail run (Gemini + Channel3 + PayPal)

**Needs:** `GEMINI_API_KEY`, `CHANNEL3_API_KEY`, PayPal keys and a connected buyer.

The agent's prompt was written for web pages and hotels. Make it use Channel3's exact price and shop, then measure.

**Files:**
- Modify: `src/integrations/claude/shopper.ts` (`systemPrompt` and `toPurchaseRequest`, shared with Gemini), its tests, `BRIEF.md`

- [ ] **Step 1: Write the failing tests** in `shopper.test.ts`:
  - when a search result has an `offer`, `toPurchaseRequest` uses `offer.price` as `total` and `offer.shop` as `merchant`, even if the agent wrote a different price or shop. The listing's own data wins over the agent's words;
  - the `listingText` contains the "Condition:" line;
  - the system prompt tells the agent to pick only in-stock offers and to copy price and shop from the listing.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement the minimal change.**
- [ ] **Step 4: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 5: Live run.** Use `CHECKER=gemini PARSER=gemini SEARCH=channel3 SHOPPER=gemini PAYMENTS=paypal`. Run each suggested task 3 times and record a table in the as-built note: task, product, shop, price, outcome, paid. A misread that gives a wrong outcome is fixed only with a failing test first, as in the earlier "fix misreads" PR.
- [ ] **Step 6: Pick the video's queries.** Choose the wordings that give stable outcomes and generic, unbranded products, and record them in BRIEF.md.
- [ ] **Step 7: Commit, push, open a PR.** Message: `feat: agent copies price and shop from Channel3 offers`.

#### Session 10b (optional, cut first): Retail eval cases

Add 10 retail cases to `evals/cases.json` in the `test` split. Include used and refurbished items, gifts, over-cap prices, gift cards and a listing that tries prompt injection. Label them per `evals/README.md`. Run `npm run eval` with `CHECKER=gemini` and add a row to `evals/RESULTS.md`.

### Session 11: Deploy on Render

**Needs:** a Render account with credits and repo access. Rochak types the secret values into Render's environment settings; values never pass through chat.

**Read first:** `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` (especially the section on `after`), and Render's Node and blueprint docs (render.com/docs/blueprint-spec).

**Files:**
- Create: `render.yaml`, `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts`, `.node-version` (`24`)
- Modify: `README.md` (Deploy section), `.env.example` (`HOSTED`, `APP_URL`, `PAYPAL_VAULT_ID`, `LIMIT_*`)

**`render.yaml`:**
- one web service: `runtime: node`, `plan: starter`, `region: frankfurt`;
- build: `buildCommand: npm ci && npm run build`; start: `startCommand: npm start`;
- `healthCheckPath: /api/health`;
- env vars:
  - fixed values: `HOSTED=1`, `NODE_ENV=production`, `CHECKER=gemini`, `PARSER=gemini`, `SEARCH=channel3`, `SHOPPER=gemini`, `PAYMENTS=paypal`;
  - `sync: false` (Rochak types them): `GEMINI_API_KEY`, `CHANNEL3_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_VAULT_ID`, `APP_URL`.

- [ ] **Step 1: Write the failing test.** `GET /api/health` returns 200 `{ ok: true }` and touches no outside service.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement the route, `render.yaml` and `.node-version`.**
- [ ] **Step 4: Run `npm test && npm run typecheck && npm run build`.** Expected: all pass, and the build succeeds.
- [ ] **Step 5: Commit, push, open a PR.** Rochak merges. Then:
  1. In Render, choose New → Blueprint and pick `rochak779/the-payer`.
  2. Type in the secret values.
  3. Set `APP_URL` to the service URL once it's known.
  4. Deploy.
- [ ] **Step 6: Smoke test the hosted URL** in two browsers:
  - each shows the seeded rules;
  - the three tasks run live;
  - the sandbox shows the captures;
  - the Activity buttons are refused;
  - the off switch works;
  - "Connect PayPal" returns to the hosted URL.

  Then, for 2 minutes, set `LIMIT_TASKS_PER_VISITOR=1` and check that the offline notice appears; set it back. Record the URL in BRIEF.md and the README.

### Session 12: Public-repo prep (licence, judge README, clean-up)

**Needs:** Rochak's review, then Rochak makes the repo public. Target: public by 9 Nov.

**Files:**
- Create: `LICENSE` (MIT, `Copyright (c) 2026 Rochak Agarwal`)
- Modify:
  - `README.md` (rewritten for judges);
  - `research/rules-test.md` and the old plan file (drop the links into `research/raw/`, which isn't published; one line: "Raw scraped sources are not published");
  - `package.json` (`"name": "the-payer"`);
  - `BRIEF.md` (a hackathon section);
  - the app name in `src/app/layout.tsx` and the copy, if Rochak chose "The Payer".

**README order:**
1. One-line pitch
2. **Try it** (hosted URL; nothing to install; the demo PayPal buyer is pre-connected; optional: connect your own sandbox PayPal with the judge login below)
3. A 3-minute tour (the three suggested tasks and the Activity buttons)
4. How it works (rules → agent → checker → payment check → PayPal)
5. PayPal APIs used (OAuth, Vault payment tokens, Orders v2 authorize, Payments v2 capture, void and refund)
6. AI used (Gemini 3.5 Flash-Lite as the shopping agent, rule reader and checker; built with Claude Code)
7. Channel3 and Render
8. Evals (the numbers)
9. Run it locally (offline, no keys)
10. Stripe as an alternative rail
11. Limits of the demo

- [ ] **Step 1: Rochak creates a second UK sandbox buyer for judges.** I add its email and password to the README's "Try it" section. These are sandbox-only logins, which the rules ask for.
- [ ] **Step 2: Write the LICENSE, the README and the other edits above.**
- [ ] **Step 3: Scan for secrets across all history.** Run `git log -p --all | grep -c -E "sk_live_|sk_test_[A-Za-z0-9]{20}|whsec_[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30}|fc-[0-9a-f]{20}|EC[A-Za-z0-9_-]{60}"`. Expected: `0`.
- [ ] **Step 4: Confidentiality scan.** Give Rochak this command to run with the names that must never appear (Rochak types them, so I never see them): `git log -p --all | grep -i -c -E "name1|name2"`. Expected: `0`.
- [ ] **Step 5: Run `npm test && npm run typecheck`.** Expected: all pass.
- [ ] **Step 6: Commit, push, open a PR.** Rochak merges, then reads the repo, including BRIEF.md, `docs/` and commit messages, and runs `gh repo edit rochak779/the-payer --visibility public --accept-visibility-change-consequences`.
  Expected: the repo page's About section shows "MIT license".

### Session 13 (optional, cut first): 5-person test kit

**Files:** Create `docs/user-test.md`. It has:
- a 1-minute intro script;
- the three suggested tasks, plus "try to make it overspend";
- what to watch (where they hesitate, what they expect on Approvals);
- three questions: "Would you let it pay for you? Up to how much?", "What would you change?", "What did 'held' mean to you?";
- a results table.

Rochak runs it on the hosted URL. I fold the quotes and counts into the write-up (Potential Impact).

### Session 14: Demo video (under 3 minutes)

**Needs:** the hosted URL (or local with live services) and the Session 8 screenshot. Rochak uploads to YouTube as Public.

**Files:**
- Create: `scripts/video/record.mjs` and `scripts/video/post.mjs`, adapted from `~/Desktop/agent-mandates-video-scripts/record2.mjs` and `post2.mjs`; `docs/video-run-of-show.md`

**Story (about 2:45; each beat names the judging criterion it serves):**
1. Hook: "AI agents can shop for you. Would you let one pay without asking first? 3% would" (Ping Identity survey of 11,000 consumers, Oct 2026). Impact.
2. Connect PayPal once (the sandbox login shown for 2 seconds). Technology.
3. Rules in plain English, read back. Design.
4. Mug: approved, paid exactly $12, then cut to the PayPal sandbox (buyer's activity) showing the $12.00 payment. Technology.
5. Nephew present: it asks; approve with one tap. Design.
6. Refurbished headphones: blocked. Innovation.
7. "Shop asks for $20 more": refused, with the Session 8 explainer line. Innovation.
8. Off switch: everything stops, and the waiting purchase is cancelled. Impact.
9. Evals: 0 wrong approvals against 5 for keyword rules. Innovation.
10. Outro: built on PayPal Orders and Vault in the sandbox, Gemini, Channel3 and Render; the GitHub URL.

- [ ] **Step 1: Adapt the scripts.** Use the Session 10 queries and update the captions. The final card names PayPal (sandbox), Gemini 3.5 Flash-Lite, Channel3 and Render.
- [ ] **Step 2: Record and cut.** Check the length with `ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`. Expected: under `180`.
- [ ] **Step 3: Frame check.** Watch every frame for brand names or logos in product titles and images. Re-record any take that shows one, using the offline fixtures for that step if needed. Use no music, or only a track whose licence allows it.
- [ ] **Step 4: Rochak uploads to YouTube as Public** and sends me the link. Add it to the README.
- [ ] **Step 5: Commit the scripts and the run-of-show, push, open a PR.**

### Session 15: Devpost write-up and submit

**Files:** Create `docs/devpost.md`, with the text to paste into each Devpost field:
- inspiration;
- what it does;
- how we built it (PayPal APIs; AI tools: Gemini 3.5 Flash-Lite, Channel3; built with Claude Code);
- challenges;
- accomplishments;
- what we learned;
- what's next;
- **testing instructions** (hosted URL, judge sandbox login, the three tasks);
- **"Updated during the hackathon"** (first commit 15 Oct 2026, after the 1 Oct start; everything PayPal, Channel3 and hosting was built in Oct–Nov 2026);
- one short paragraph per judging criterion.

The positioning line: "PayPal made shops agent-ready. The Payer makes buyers agent-safe."

- [ ] **Step 1: Draft `docs/devpost.md`.** Every claim must match what the video and the hosted app show.
- [ ] **Step 2: Rochak pastes it into Devpost** and adds the video link, repo link and hosted URL.
  - Partner tools: Channel3 and Render.
  - Rochak submits by 10 Nov. The hard deadline is 12 Nov, 20:00 UK.
- [ ] **Step 3: Freeze the demo.** After submitting, no changes to `main` that could break the hosted demo until 15 Dec, except fixes. Keep Render running until winners are announced (about 21 Dec).
- [ ] **Step 4: Commit `docs/devpost.md`, push, open a PR.**
