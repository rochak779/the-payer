# The Payer: Devpost write-up

The text to paste into each Devpost field, one section per field. Every claim matches `README.md` and the code as built on 22 Oct 2026, and the hosted demo was smoke-tested the same day.

---

## Project name

The Payer

## Elevator pitch (200 characters at most)

PayPal made shops agent-ready. The Payer makes buyers agent-safe: your AI shopping agent pays with PayPal only within your plain-English rules, and never more than you approved.

## Links

- **Try it:** https://the-payer.onrender.com (no login, nothing to install)
- **Video:** https://youtu.be/6VWm8YpckTo
- **Code:** https://github.com/rochak779/the-payer (MIT licence)

---

## Try it out links

Add each one as its own link in Devpost's "Try it out" field.

- https://the-payer.onrender.com
- https://github.com/rochak779/the-payer

## About the project

Paste everything from "Inspiration" to the end of "What's next" into Devpost's **About the project** field. Dollar signs are written `\$` so Devpost doesn't read them as math; if a backslash shows in the preview, delete it.

### Inspiration

AI agents can shop for you now. But would you let one pay without asking? In an October 2026 survey of 11,000 people, only 3% said yes.

Today you have two choices. Approve every purchase yourself, which defeats the point of an agent. Or set a spending limit, which can't say what you really care about, like "nothing refurbished" or "ask me about gifts".

PayPal made shops ready for agents. I wanted to make buyers safe with them.

### What it does

The Payer lets your AI shopping agent pay with PayPal, but only within rules you write in plain English.

1. **You write rules** the way you'd tell a person: "Up to \$80 on any one item." "Ask me before buying a gift."
2. **The agent shops.** It searches real US shops and picks something.
3. **A checker decides:** approve, ask you, or block. It always says why.
4. **PayPal holds exactly the approved price.** The shop gets paid only if it asks for that exact amount.

Normally, PayPal lets a shop take up to 15% more than it held. The Payer doesn't:

$$\text{amount paid} = \text{amount you approved}$$

There's also an off switch. One tap cancels everything and releases every PayPal hold.

### How I built it

I built it on my own with Claude Code, in short sessions from a written plan.

- **PayPal** saves the buyer's account once, holds the money for each approved purchase, and takes it only after the final check.
- **Gemini** runs the shopping agent, reads the rules and judges the fuzzy ones.
- **Channel3** gives the agent real products from US shops.
- **Render** hosts the demo. Every visitor gets their own copy, with a test PayPal buyer already connected.

The key design choice: **the AI can only make things stricter.** Simple limits, like price, are checked by code. The AI only judges the fuzzy rules, and if it's unsure, the answer is "ask you". The agent itself can never touch PayPal.

### Challenges I ran into

- **UK accounts didn't work.** PayPal's test system wouldn't save a UK buyer's account. I tested PayPal on its own before connecting it to the app, so I caught this early and switched the demo to US dollars.
- **PayPal never sent the buyer back.** After agreeing, buyers saw an error page. So the app asks PayPal directly whether the buyer agreed instead of waiting for them to come back.
- **The agent thought a toy was a gift card,** so "No gift cards" blocked it. Because the AI can only make things stricter, the mistake was a visible block, not a wrong payment. I fixed it and added a test.

### Accomplishments that I'm proud of

- **It never overpaid.** In 24 live runs, 17 purchases were paid, each at exactly the listing's price.
- **It's measured.** On 67 sample purchases, the AI checker wrongly approved 0 or 1 per run. A simple keyword filter wrongly approved 17.

### What I learned

- **Where the AI sits matters more than how smart it is.** Let it flag problems, and let code make the final call.
- **Test the riskiest part first.** Testing PayPal on its own, before connecting it to the app, caught both PayPal surprises early.

### What's next

- Refunds, so a purchase can be undone.
- Paying many real shops, not just one test account.
- Building it into a PayPal wallet, where the buyer's payment method already lives.

---

## Built with

paypal, paypal-orders-v2, paypal-vault, gemini, channel3, next.js, react, typescript, tailwindcss, zod, vitest, render, claude-code

## AI tools used

- **Gemini `gemini-3.5-flash-lite`** (free tier): the shopping agent, the rule reader and the checker.
- **Channel3:** product search.
- **Claude Code:** the app was built with it.

## Partner tools used

Channel3 and Render.

---

## Testing instructions

**Open https://the-payer.onrender.com** in any browser. There's nothing to install and no login. Each visitor gets their own copy of the demo: four spending rules, and a PayPal sandbox buyer that's already connected (the Ask screen says "Using the demo PayPal buyer (sandbox)."). It's sandbox money in US dollars. The demo is free to use until judging ends (15 Dec 2026).

1. **Rules.** Read the four rules, or write your own and press **Show me what you understood**.
2. **Ask.** Press each suggested task in turn:
   - "Buy a plain white ceramic coffee mug, under $15": approved. PayPal holds exactly the listing's price, the payment check agrees, and PayPal takes it.
   - "Buy a wooden building blocks set for my nephew's birthday, about $40": the gift rule makes it ask first. Open **Approvals**, read why, and press **Approve**. It's paid the same way.
   - "Buy wireless headphones under $80": live listings are almost always new, so this one is usually approved and paid. The "blocked" scene (refurbished headphones, stopped by "Only new items") appears reliably only on the offline listings: run the app locally with no keys to see it (`npm install && npm run seed && npm run dev`).
3. **Activity.** Each paid purchase shows "PayPal took $… (capture …)". On a paid purchase, press **Shop asks for $20 more**, **Another shop asks** or **Shop asks again**. Each is refused by the payment check before PayPal is called. The button at the bottom shows the checker's measured scores.
4. **The off switch.** Turn the agent off on Activity. Anything waiting for you is cancelled, open PayPal holds are voided and a new task stops at once, without shopping. Turn it back on to carry on.

**Good to know:**

- **Live results show real US shop names and products, but no shop is really paid** and nothing is ordered. It's PayPal's sandbox: every payment goes to one sandbox business account, and the shop's request to be paid is played by the app.
- **Please type nothing personal.** The demo runs on Gemini's free tier, whose prompts may be used to improve the service.
- **Daily limits.** Past them, a run uses the offline agent and says so in one line. Payments still go through PayPal's sandbox.
- **Optional: your own sandbox buyer.** If you have a personal account in PayPal's developer sandbox, press **Connect your own PayPal sandbox account** on the Ask screen. PayPal opens in a new tab: log in and agree. PayPal's sandbox then shows an error page instead of sending you back, but it has recorded your approval. Close that tab and press **Finish connecting**.

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

**Technological Implementation.** PayPal is the payment path, not a decoration: Vault v3 saves the buyer's PayPal once, Orders v2 with `intent: AUTHORIZE` holds exactly the approved amount, and Payments v2 captures it only after a code-only check, or voids it at the off switch. Fixed `PayPal-Request-Id`s stop double payments on retries. Gemini runs the agent, the rule reader and the checker. Channel3 gives real products, and its listing data overrides the agent's words. It works live: 17 paid purchases in 24 live runs, each one hold and one completed capture at the listing's price, with 250 automated tests behind it.

**Design.** It's a complete product, not a proof of concept: four screens (Rules, Ask, Approvals, Activity), plain-English rules read back before saving, a reason on every decision, one-tap approval and an off switch. Judges get their own seeded copy with a sandbox buyer already connected, so there's nothing to set up. Past a daily limit, runs switch to the offline agent and say so in one line. If an outside service is over its own limit, the run stops with a plain message and nothing is approved.

**Potential Impact.** Only 3% of consumers in an October 2026 survey were comfortable with AI buying routine items without a final OK. The Payer is for people who'd let an agent shop if they kept a say. It decides when it's safe not to ask them, and it can't overpay. It fits naturally inside a wallet, as a buyer-side feature: PayPal already holds the buyer's payment method, and the hold is where The Payer enforces the rules.

**Innovation/Idea.** Agent payment tools mostly verify agents for shops. This is the buyer's rules layer. Hard limits are code; fuzzy rules ("nothing refurbished", "ask me about gifts") are AI judgement that can only tighten. And the PayPal hold is the enforcement point, so a shop can't take even the 15% extra that PayPal allows by default. Rules also export as an AP2 open Payment Mandate (the open Agent Payments Protocol), which shows the gap: AP2 can carry caps and allowed shops, but has no field for "nothing refurbished".

**Presentation.** The video (https://youtu.be/6VWm8YpckTo, 2:26) shows it working end to end: the problem and who it's for, rules read back, the mug approved and paid exactly, PayPal's own record of that payment, the present asking first, the refurbished headphones blocked, an overcharge refused, the off switch, a live run on real US shops, and the eval numbers. The music and sound are original, made in code for this video.
