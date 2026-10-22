# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (confirmed 17 Oct 2026):

- **Testers.** Five real people in a hands-on test, run on the builder's laptop in person or over a shared screen. Each writes their own spending rules in plain English, gives the agent a shopping task or two, and judges whether each decision (approve, ask, block) is the one they would want.
- **Video viewers.** Hiring managers and product people watching a roughly 90-second LinkedIn screen recording of the run-of-show in README.md. They must follow what happened at a glance, at video scale.

## Product Purpose

The Payer is the spending-control layer for a personal AI shopping agent. A person writes rules the way they'd tell a human ("Hotels up to £150 a night. Nothing non-refundable. Ask me about gifts."). When the agent wants to buy something, a checker decides approve, ask the person, or block, always with a plain-English reason. Approved purchases get a one-time card that only works for that shop and amount. Success means the person can skip approving routine purchases without ever being surprised by one, and the decisions are measurably right (wrong approvals and needless asks, measured in `evals/`).

## Positioning

It is the layer between "approve every purchase" and blunt spending caps. Code enforces hard limits; an AI only interprets fuzzy rules and can only make a decision stricter, never approve past a limit. Payment time is checked by code alone, against what was approved (mirrors AP2's open and closed mandates). It is designed as a feature for whoever issues the agent's payment credential (a wallet or a bank), not a standalone consumer app.

## Operating Context

- Presented as a phone-sized feature inside a wallet or banking app (confirmed): one narrow column with a bottom tab bar, centred in the desktop browser for demos and video.
- Screens: Rules (write rules, "Show me what you understood", save; an AP2 mandate view), Ask (send a task, watch the agent's progress live), Approvals (approve or decline what the checker asked about), Activity (decisions, one-time cards, charge log, agent on/off switch, demo buttons that try unapproved charges), Evals (checker scores against a keyword baseline).
- Runs locally (`npm run dev`); data lives in one local JSON file. Offline stand-ins by default; live Gemini, Firecrawl search and Stripe sandbox behind env switches.

## Capabilities and Constraints

- Next.js 16.4 (App Router, server actions), React, Tailwind CSS v4, TypeScript strict. Cache Components off.
- Decision vocabulary is fixed: Approved, Asking you, Blocked. Every decision carries its reason; reasons are shown, not hidden.
- Copy is plain English, UK spelling, first person from the app ("I'll show you how I read them").
- Not deployed: the JSON store doesn't persist on Vercel.

## Brand Commitments

- The product is called **The Payer** (renamed from Agent Mandates for the PayPal AI Hackathon, 21 Oct 2026). Visual identity borrows **The Product Kinship's colours and type only** (confirmed): no Product Kinship name, logo or claim anywhere in the app, so it isn't presented as a community project.
- Never name the builder's employer, its client bank or their products; write "a UK bank". Mock data and public sources only.

## Evidence on Hand

- Eval results: `evals/RESULTS.md` and saved runs under `evals/runs/` (67 cases; keyword baseline vs Gemini Flash-Lite).
- Canned listings for demos: `src/agent/fixtures.ts` (retail: a mug, a building-blocks present, refurbished headphones; plus Lisbon hotels and a book; generic products and fictional shops). Synthetic; must stay labelled as demo data where a viewer could mistake it.
- No real testimonials, customers or usage figures exist; never invent them.

## Product Principles

1. Every decision explains itself in plain English.
2. The AI can only tighten; the interface never implies it approved past a limit.
3. Show what was understood before anything is saved or spent.
4. The person stays in charge: one switch turns the agent off and cancels open cards.
5. Honest about what's simulated (the merchant charge is the only fake step).

## Accessibility & Inclusion

No product-specific requirement established beyond WCAG AA contrast and keyboard use, which the test sessions and video both depend on.
