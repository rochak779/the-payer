# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (updated 22 Oct 2026 for the PayPal AI Hackathon):

- **Judges and visitors.** They open the hosted demo with nothing to install and no login, each with their own seeded copy (four rules and a PayPal sandbox buyer already connected). They try the suggested tasks or write their own rules, and judge whether each decision (approve, ask, block) is the one they would want.
- **Video viewers.** Judges and product people watching a demo video of under 3 minutes. They must follow what happened at a glance, at video scale.

## Product Purpose

The Payer is the spending-control layer for a personal AI shopping agent. A person writes rules the way they'd tell a human ("Up to $80 on any one item. Only new items. Ask me about gifts."). When the agent wants to buy something, a checker decides approve, ask the person, or block, always with a plain-English reason. An approved purchase becomes a PayPal hold for exactly its price, captured only after a code-only payment check. Success means the person can skip approving routine purchases without ever being surprised by one, and the decisions are measurably right (wrong approvals and needless asks, measured in `evals/`).

## Positioning

It is the layer between "approve every purchase" and blunt spending caps. Code enforces hard limits; an AI only interprets fuzzy rules and can only make a decision stricter, never approve past a limit. Payment time is checked by code alone, against what was approved (mirrors AP2's open and closed mandates). It is designed as a feature for whoever issues the agent's payment credential (a wallet or a bank), not a standalone consumer app.

## Operating Context

- Presented as a phone-sized feature inside a wallet or banking app (confirmed): one narrow column with a bottom tab bar, centred in the desktop browser for demos and video.
- Screens: Rules (write rules, "Show me what you understood", save; an AP2 mandate view), Ask (send a task, watch the agent's progress live), Approvals (approve or decline what the checker asked about), Activity (decisions, PayPal holds and captures, charge log, agent on/off switch, demo buttons that try unapproved charges), Evals (checker scores against a keyword baseline).
- Hosted on Render (each visitor gets their own seeded data file and daily limits) and runs locally (`npm run dev`). Offline stand-ins by default; live Gemini, Channel3 search and the PayPal sandbox behind env switches (Firecrawl search and Stripe sandbox cards remain as alternatives).

## Capabilities and Constraints

- Next.js 16.4 (App Router, server actions), React, Tailwind CSS v4, TypeScript strict. Cache Components off.
- Decision vocabulary is fixed: Approved, Asking you, Blocked. Every decision carries its reason; reasons are shown, not hidden.
- Copy is plain English, UK spelling, first person from the app ("I'll show you how I read them").
- Hosted on Render: visitor data lives on the service's own disk and resets on each deploy.

## Brand Commitments

- The product is called **The Payer** (renamed from Agent Mandates for the PayPal AI Hackathon, 21 Oct 2026). The look follows **Rochak's portfolio design, site-dime** (reskinned 22 Oct 2026, replacing The Product Kinship's colours and type): golden yellow, cream and ink, Satoshi and Inter. Only the visual system carries over: none of Rochak's portrait, mascot or monogram, and none of the portfolio's layouts. Satoshi loads from Fontshare's CDN, because its licence doesn't allow committing the font file to this public repo.
- Never name the builder's employer, its client bank or their products; write "a UK bank". Mock data and public sources only.

## Evidence on Hand

- Eval results: `evals/RESULTS.md` and saved runs under `evals/results/` (67 cases; keyword baseline vs Gemini Flash-Lite).
- Canned listings for demos: `src/agent/fixtures.ts` (retail: a mug, a building-blocks present, refurbished headphones; plus Lisbon hotels and a cookbook; generic products and fictional shops). Synthetic; must stay labelled as demo data where a viewer could mistake it.
- No real testimonials, customers or usage figures exist; never invent them.

## Product Principles

1. Every decision explains itself in plain English.
2. The AI can only tighten; the interface never implies it approved past a limit.
3. Show what was understood before anything is saved or spent.
4. The person stays in charge: one switch turns the agent off, cancels waiting purchases and voids open PayPal holds.
5. Honest about what's simulated (the shop's request to be paid is the only simulated step).

## Accessibility & Inclusion

No product-specific requirement established beyond WCAG AA contrast and keyboard use, which the hosted demo and video both depend on.
