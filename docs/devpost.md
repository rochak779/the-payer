# The Payer: Devpost write-up

The text to paste into each Devpost field, one section per field. Two placeholders are left: `HOSTED_URL_TBD` (the Render address, once the service is live) and `VIDEO_URL_TBD` (the YouTube link, made last in Session 14). Replace both here and on Devpost before submitting. Every claim matches `README.md` and the code as built on 22 Oct 2026.

---

## Project name

The Payer

## Elevator pitch (200 characters at most)

PayPal made shops agent-ready. The Payer makes buyers agent-safe: your AI shopping agent pays with PayPal only within your plain-English rules, and never more than you approved.

## Links

- **Try it:** HOSTED_URL_TBD (no login, nothing to install)
- **Video:** VIDEO_URL_TBD
- **Code:** https://github.com/rochak779/the-payer (MIT licence)

---

## Inspiration

PayPal made shops agent-ready. The Payer makes buyers agent-safe.

This autumn, AI agents that shop and act for you went mainstream, and so did stories of agents acting without asking first. In an October 2026 survey of 11,000 consumers, only 3% were comfortable with AI making routine purchases without a final OK.

Most of the tools for agent payments so far serve the shop: they let a business accept an agent's payment and check who the agent is. The buyer gets two blunt options. They can approve every purchase, which defeats the point of an agent. Or they can set a spending cap, which can't say what people actually care about. In a small research pass before building, I collected 27 real spending rules that people say they'd give an agent, and 12 of them needed judgement, such as refund terms, hidden fees and gifts for other people.

So I built the buyer's side: rules in your own words, a checker that decides when it's safe not to ask you, and a payment step that can't pay a cent more than you approved.

## What it does

You write spending rules the way you'd tell a person. The demo starts with four:

- Up to $80 on any one item.
- Only new items: nothing used or refurbished.
- Ask me before buying anything that's a gift or for someone else.
- No gift cards.

Press **Show me what you understood** and the app reads your rules back before saving, so a misreading is caught before it costs money.

Then you give the shopping agent a task. It searches real products from US shops through Channel3, picks one and asks to buy it. A checker decides **approve**, **ask you** or **block**, with a plain-English reason:

- **Approve.** PayPal holds exactly the listing's price from your saved PayPal. When the shop asks to be paid, a code-only payment check compares the charge with the approval: the amount, the shop, used once, not expired, and the agent still on. Only then does the app capture the hold.
- **Ask.** The purchase waits on **Approvals** with the reason. Only your tap counts as consent. Then it's paid the same way.
- **Block.** Nothing is held and nothing is paid. The reason names the rule.

**Activity** lists every decision with its reason, and each paid purchase shows PayPal's capture id. Three demo buttons play a shop trying it on: **Shop asks for $20 more**, **Another shop asks** and **Shop asks again**. The payment check refuses each one before PayPal is even called. On its own, PayPal lets a shop take up to 15% more than was held (capped at $75). The Payer holds it to the penny.

The **off switch** stops everything: purchases waiting for you are cancelled, open PayPal holds are voided and new tasks are refused.

## How we built it

I built it solo with Claude Code, in short sessions from a written plan. Each session ended with passing tests and a pull request.

```
your rules → shopping agent → checker → (you, if it asks) → PayPal hold → payment check → PayPal capture
```

**PayPal (developer sandbox, REST APIs called directly):**

- **OAuth 2.0 client credentials** (`POST /v1/oauth2/token`). The token is reused until it expires.
- **Vault v3, to save the buyer's PayPal once.** "Connect PayPal" creates a setup token (`POST /v3/vault/setup-tokens`). After the buyer agrees, "Finish connecting" checks it (`GET /v3/vault/setup-tokens/{id}`) and saves a payment token (`POST /v3/vault/payment-tokens`).
- **Orders v2 with `intent: AUTHORIZE`**, paid from the saved PayPal (`vault_id`) with the buyer away. This holds exactly the approved total. The hold comes back in the order response, so no separate authorise call is needed.
- **Payments v2 capture** (final capture), called only after the code-only payment check approves the shop's charge. Only a `COMPLETED` capture counts as paid.
- **Payments v2 void**, for the off switch.
- Every call that moves money sends a fixed **`PayPal-Request-Id`** built from the purchase and the step, so a retried call can't pay twice.
- The sandbox address is fixed in code, so no setting can point the app at live PayPal. Refunds weren't built.

**AI tools:**

- **Gemini `gemini-3.5-flash-lite`** does three jobs: the shopping agent, the rule reader and the checker for fuzzy rules.
- **Channel3** is the agent's product search: real products from US shops in US dollars, each with its shop, price, condition and stock.
- **Built with Claude Code:** the code, tests and docs were written with Claude Code, session by session.

**Safe by design:**

- The agent has exactly two tools: search, and ask to buy. It never gets PayPal tools, tokens or ids, so it can't pay for anything itself.
- Code checks the hard limits (amount, shop, category, dates). The AI judges only the fuzzy rules. It reports facts (clear, breached or unsure, plus hidden costs and prompt-injection attempts), and code turns those facts into the decision. So the AI can only make a decision stricter. If it fails or returns junk, the answer is "ask".
- When the agent picks a Channel3 listing, the purchase uses that listing's own price and shop, whatever the agent wrote. The checker reads the listing's own text, condition included. Shop and listing text is treated as data, never as instructions.
- Money is whole cents everywhere, and every outside response (PayPal, Channel3, Gemini) is checked against a schema before it's used.

**Hosting on Render:** one web service from the Blueprint in `render.yaml`, with a health check. Hosted mode gives each visitor their own seeded copy of the demo and daily limits. Past the limits, a run uses the offline agent and says so in one line, and payments still go through PayPal's sandbox.

**Offline mode:** every service has an offline stand-in (canned listings at fictional shops, a keyword checker, a simple rule reader and offline test payments). So the app runs with no keys at all.

**Tests:** 249 automated tests, including PayPal's failure cases: a capture that fails after the check approved, a retry after that, and a void that fails.

## Challenges we ran into

- **UK sandbox shops couldn't save a buyer's PayPal.** I ran a PayPal sandbox spike first, as a go/no-go gate. Two UK sandbox business accounts were refused at the first vault step (`NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`). A US one worked first time, but it left pound payments pending until the shop accepted them by hand, and the shop's sandbox login was refused. So the demo moved to US dollars.
- **PayPal's sandbox never sends the buyer back after they agree.** It shows an error page instead, yet PayPal has already recorded the approval. It happened with a local and a public return address alike. So the app doesn't rely on the redirect. It remembers the setup token it's waiting for and opens PayPal in a new tab. Then "Finish connecting" asks PayPal whether the token was approved, and only then saves it. The return page does the same and never reads a token from the link, so a crafted link can't attach someone else's PayPal.
- **A double click said "wasn't connected".** A second click on "Finish connecting" during its two-second check found nothing left to finish and said "PayPal wasn't connected", though the first click had connected it. I fixed it test-first. The button now shows a spinner and can't be pressed twice.
- **The agent misread things in live runs.** It filed a wooden building blocks set for a nephew as a gift card, so "No gift cards" blocked it. It also added brand and shop names to its searches. Each was fixed test-first in the agent's instructions. Because rules only tighten, the first misread could only cause a wrong block that the person sees, never a wrong approval. A review also found that two of a listed item would have been priced as one, fixed the same way.
- **Pinning a fast-moving SDK.** Channel3's SDK was moving fast (a new version came out the day before I started), and the installed version differed from the docs: the client's name, where the price sits, where the country goes and the shape of a results page. I pinned one version, followed the installed code over the docs, and checked every response so that one malformed product is skipped instead of breaking the whole search.
- **Seeing PayPal's side.** The sandbox accounts couldn't log in to PayPal's sandbox website, so I checked every order through PayPal's API instead: each order lists its holds and captures.

## Accomplishments that we're proud of

- **It doesn't overpay.** In 24 live runs (Gemini, Channel3 and the PayPal sandbox), all 25 purchase requests used the listing's own price and shop. Each of the 17 paid purchases is one PayPal hold and one completed capture at exactly that price.
- **It's measured, not just demoed.** On 67 labelled purchase requests against a fixed set of 10 rules, the Gemini checker made 0 to 1 wrong approvals per run, against 17 for a keyword baseline (the way a simple guardrail works). On the 17 held-out cases it got 14 right in both runs with no wrong approvals; the baseline got 9 right with 5 wrong approvals.
- **It reads rules well.** On 22 plain-English rules, Gemini read 21 and 20 correctly over two runs, against 15 for the offline pattern reader.
- **The failure cases are pinned by tests.** A capture that fails after the check approved can't be retried into a second payment. A timeout is never reported as "nothing was charged", because PayPal may have taken it.
- **Judges need nothing.** No install and no login: each visitor gets their own copy of the demo, with a PayPal sandbox buyer already connected.

## What we learned

- **Where the AI sits matters more than how clever it is.** The AI only reports facts and code makes the decision, so the AI can only make things stricter. That's what makes it safe to let the agent buy without asking.
- **A PayPal hold is the right tool for an agent.** A hold for exactly the approved amount, captured only after a code check, gives one clear place to refuse an overcharge. On its own, PayPal allows a capture up to 15% over the hold. The check closes that gap.
- **Try the risky integration first.** The PayPal spike found the UK vaulting refusal and the missing redirect before any app code depended on them.
- **The listing's data beats the agent's words.** Taking price and shop from the search result itself, not from what the agent typed, removed a whole class of mistakes.

## What's next for The Payer

- **Undo with a PayPal refund.** It was planned and cut for time.
- **Paying many shops.** Today every payment goes to one sandbox business account, because a saved PayPal works only with the shop it was saved for. Paying real shops needs PayPal's partner setup.
- **Living inside a wallet.** In real use, this belongs with whoever holds the buyer's payment method, as a feature of a PayPal wallet rather than a separate app.
- **More evals:** retail cases (used and refurbished items, gift cards, prompt injection in listings), measured the same way as the current set.

---

## Built with

paypal, paypal-orders-v2, paypal-vault, gemini, channel3, render, claude-code

## AI tools used

- **Gemini `gemini-3.5-flash-lite`** (free tier): the shopping agent, the rule reader and the checker.
- **Channel3:** product search.
- **Claude Code:** the app was built with it.

## Partner tools used

Channel3 and Render.

---

## Testing instructions

**Open HOSTED_URL_TBD.** There's nothing to install and no login. Each visitor gets their own copy of the demo: four spending rules, and a PayPal sandbox buyer that's already connected (the Ask screen says "Using the demo PayPal buyer (sandbox)."). It's sandbox money in US dollars. The demo is free to use until judging ends (15 Dec 2026).

1. **Rules.** Read the four rules, or write your own and press **Show me what you understood**.
2. **Ask.** Press each suggested task in turn:
   - "Buy a plain white ceramic coffee mug, under $15": approved. PayPal holds exactly the listing's price, the payment check agrees, and PayPal takes it.
   - "Buy a wooden building blocks set for my nephew's birthday, about $40": the gift rule makes it ask first. Open **Approvals**, read why, and press **Approve**. It's paid the same way.
   - "Buy wireless headphones under $80": live listings are almost always new, so this one is usually approved and paid. The "blocked" scene (refurbished headphones, stopped by "Only new items") appears reliably only on the offline listings: run the app locally with no keys to see it (`npm install && npm run seed && npm run dev`).
3. **Activity.** Each paid purchase shows "PayPal took $… (capture …)". On a paid purchase, press **Shop asks for $20 more**, **Another shop asks** or **Shop asks again**. Each is refused by the payment check before PayPal is called. The button at the bottom shows the checker's measured scores.
4. **The off switch.** Turn the agent off on Activity. Anything waiting for you is cancelled, open PayPal holds are voided and new tasks are refused. Turn it back on to carry on.

**Good to know:**

- **Live results show real US shop names and products, but no shop is really paid** and nothing is ordered. It's PayPal's sandbox: every payment goes to one sandbox business account, and the shop's request to be paid is played by the app.
- **Please type nothing personal.** The demo runs on Gemini's free tier, whose prompts may be used to improve the service.
- **Daily limits.** Past them, a run uses the offline agent and says so in one line. Payments still go through PayPal's sandbox.
- **Optional: your own sandbox buyer.** If you have a personal account in PayPal's developer sandbox, press **Connect your own PayPal** on the Ask screen. PayPal opens in a new tab: log in and agree. PayPal's sandbox then shows an error page instead of sending you back, but it has recorded your approval. Close that tab and press **Finish connecting**.

## Updated during the hackathon

The Payer is new. The repository's first commit is 15 Oct 2026, two weeks after the submission period opened on 1 Oct 2026, and the repo holds the full commit history.

- **15 to 19 Oct:** the core. A research pass on the rules people give agents, the checker and its 67-case eval set, approvals, the code-only payment check and the four screens. Payments went through an earlier card-based sandbox rail, which is still in the code as an alternative.
- **From 21 Oct: everything PayPal, Channel3 and hosting.**
  - A PayPal sandbox spike (vault, hold, capture, void and refund), then the PayPal payment rail, "Connect PayPal" and live end-to-end runs.
  - Channel3 product search, with the listing's own price and shop taking priority over the agent's words.
  - A retail demo with fictional shops and generic products.
  - Hosted mode (each visitor's own data, daily limits with an offline fallback) and the Render deploy.
  - The rename to The Payer.

---

## How it meets the judging criteria

**Technological Implementation.** PayPal is the payment path, not a decoration: Vault v3 saves the buyer's PayPal once, Orders v2 with `intent: AUTHORIZE` holds exactly the approved amount, and Payments v2 captures it only after a code-only check, or voids it at the off switch. Fixed `PayPal-Request-Id`s stop double payments on retries. Gemini runs the agent, the rule reader and the checker. Channel3 gives real products, and its listing data overrides the agent's words. It works live: 17 paid purchases in 24 live runs, each one hold and one completed capture at the listing's price, with 249 automated tests behind it.

**Design.** It's a complete product, not a proof of concept: four screens (Rules, Ask, Approvals, Activity), plain-English rules read back before saving, a reason on every decision, one-tap approval and an off switch. Judges get their own seeded copy with a sandbox buyer already connected, so there's nothing to set up. Past a daily limit, runs switch to the offline agent and say so in one line. If an outside service is over its own limit, the run stops with a plain message and nothing is approved.

**Potential Impact.** Only 3% of consumers in an October 2026 survey were comfortable with AI buying routine items without a final OK. The Payer is for people who'd let an agent shop if they kept a say. It decides when it's safe not to ask them, and it can't overpay. It fits naturally inside a wallet, as a buyer-side feature: PayPal already holds the buyer's payment method, and the hold is where The Payer enforces the rules.

**Innovation/Idea.** Agent payment tools mostly verify agents for shops. This is the buyer's rules layer. Hard limits are code; fuzzy rules ("nothing refurbished", "ask me about gifts") are AI judgement that can only tighten. And the PayPal hold is the enforcement point, so a shop can't take even the 15% extra that PayPal allows by default. Rules also export as an AP2 open Payment Mandate (the open Agent Payments Protocol), which shows the gap: AP2 can carry caps and allowed shops, but has no field for "nothing refurbished".

**Presentation.** *(Depends on the video: check this paragraph against the final cut before pasting.)* The video (VIDEO_URL_TBD, under 3 minutes) shows it working end to end: the problem and who it's for, connecting PayPal, rules read back, the mug approved and paid, the present asking first, the refurbished headphones blocked, an overcharge refused, the off switch, and the eval numbers.
