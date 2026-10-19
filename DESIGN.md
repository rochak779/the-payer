---
name: Agent Mandates
description: Spending rules for your AI shopping agent; every checker decision is printed as a receipt.
colors:
  forest: "#173f35"
  forest-deep: "#0f2e26"
  cream: "#f7f2e8"
  paper: "#fffdf8"
  line: "#e4dccd"
  sage: "#c6cbc1"
  gold: "#e9a51a"
  orange: "#d96a32"
  orange-ink: "#b4511f"
  orange-soft: "#ecb898"
  peach: "#f8e1d2"
  slate: "#24333b"
  ink-soft: "#4a5a55"
  muted: "#5c6a64"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  script:
    fontFamily: "Ephesis, Snell Roundhand, cursive"
    fontSize: "2.6rem"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "normal"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  amount:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.333
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" on"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "\"ss01\" on"
  body-sm:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  caption:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.375
  label-stamp:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.08em"
  label-tag:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.05em"
rounded:
  stamp: "10px"
  tab: "16px"
  card: "20px"
  frame: "44px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  screen: "20px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.cream}"
  button-needs:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-quiet:
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-warn:
    textColor: "{colors.orange-ink}"
    rounded: "{rounded.pill}"
  receipt:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "20px 20px 24px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.slate}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-selected:
    backgroundColor: "{colors.peach}"
  stamp:
    typography: "{typography.label-stamp}"
    rounded: "{rounded.stamp}"
    padding: "6px 12px"
  reason-tag:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label-tag}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  app-header:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    padding: "28px 20px 20px"
  tab-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
  tab-active:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    height: "32px"
    width: "56px"
  pending-badge:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.pill}"
    height: "18px"
---

# Design System: Agent Mandates

## Overview

**Creative North Star: "The Decision Receipt"**

Every checker decision is printed, not displayed. A purchase arrives as a sheet of warm paper with a torn bottom edge; the decision comes down on it as a tilted rubber stamp (Approved, Asking you, Blocked); the reasons are its line items, each tagged with who checked it. The rest of the app is the counter the receipts sit on: a cream ground, a forest header, forest pills for the one thing to do next, and a single hand-written word per screen.

The app is a phone-sized shell (max 420px), dense but calm. Manrope carries everything, heavy and tight at display sizes, relaxed at reading sizes. Colour is semantic before it is decorative: forest is the product's voice and the primary action, gold means "needs you" and nothing else, orange-ink is Blocked and errors. Motion is one ease, `cubic-bezier(0.16, 1, 0.3, 1)`: steps slide in, the stamp lands with an overshoot, buttons press down, and reduced motion collapses all of it to an instant.

Colours and type are The Product Kinship's; the name, logo and blob mark are not used. The product is always called Agent Mandates.

**Key Characteristics:**
- Decisions live on receipts: paper, torn edge, dashed rules between sections, a stamp, line-item reasons.
- One accent per meaning: forest acts, gold waits on the person, orange-ink refuses.
- Manrope only, except one Ephesis script word per screen title with a hand-drawn soft-orange stroke.
- Pills for every control; 20px corners for every surface.
- Soft, forest-tinted shadows; depth comes mostly from paper on cream.
- One easing curve for all motion; reduced motion turns it off.

## Colors

A warm paper-and-forest palette where each accent carries exactly one meaning.

### Primary
- **Kinship Forest** (forest): header, primary pill buttons, the active tab, focus rings, headings, Approved stamps, caret. The product's voice.
- **Deep Forest** (forest-deep): primary hover, text on gold and soft orange, selection text, the tint base of every shadow.

### Secondary
- **Needs-You Gold** (gold): the "Review in Approvals" button, the pending count badge on the Approvals tab, and the Asking you stamp's fill (at 30%). Nothing else.

### Tertiary
- **Refusal Orange** (orange): the Ephesis script word on screen titles, and as a 8-10% tint behind Blocked stamps and warn-button hover.
- **Refusal Ink** (orange-ink): Blocked stamp text, error notes, error steps, the remove-rule action, alarming eval numbers. The legible form of orange; use it for any orange text below display size.
- **Soft Orange** (orange-soft): the hand-drawn stroke under the script word, the selected chip ring, and the "Agent is turned off" pill.
- **Peach** (peach): selected chip fill, chip hover, error-step icon disc, text selection.

### Neutral
- **Counter Cream** (cream): the app ground; reason-tag fill; ring colour that cuts the step timeline behind icons.
- **Receipt Paper** (paper): receipts, panels, fields, chips, secondary buttons, the tab bar.
- **Ruled Line** (line): hairline rings, borders, dashed receipt rules, the step timeline, dotted eval leaders, scrollbars.
- **Sage** (sage): the agent switch's off track.
- **Slate Ink** (slate): body text; also the page backdrop behind the phone frame on wide screens.
- **Soft Ink** (ink-soft): supporting copy under titles, receipt meta, reason tags, Declined and Cancelled stamps.
- **Muted** (muted): captions, timestamps, inactive tabs, placeholders, empty states.

### Named Rules
**The Gold Means You Rule.** Gold appears only where the person must act on a pending purchase: the needs button, the pending badge, the Asking you stamp. Never as decoration, never as a highlight, never under the script word.

**The Three Stamps Rule.** Approved is forest, Asking you is forest-deep on gold, Blocked is orange-ink on orange; a person's own Declined or Cancelled is ink-soft. The decision words never change.

## Typography

**Display Font:** Manrope (with system-ui, sans-serif), stylistic set 1 on
**Script Font:** Ephesis (with Snell Roundhand, cursive)

**Character:** A sturdy, friendly grotesque set heavy and tight for titles and amounts, paired with one loose hand-written word that makes each screen feel signed.

### Hierarchy
- **Display** (800, 1.75rem, 1.15, -0.03em): the screen title, forest, balanced.
- **Script** (400, 2.6rem, 0.8): one word inside the screen title, orange, with the drawn stroke.
- **Headline** (800, 1.375rem, -0.02em): the product name in the header. The amount on a receipt uses the same weight at 1.5rem with tabular figures.
- **Title** (700, 1.0625rem, snug): receipt titles and panel headings (section headings drop to 0.875-1rem bold forest).
- **Body** (400, 0.9375rem, 1.625): field text and screen intros (capped at 34ch). Reason lines and steps use 0.875rem at the same leading.
- **Caption** (500, 0.8125rem): receipt meta, card rows, links, tab labels at 0.75rem.
- **Label** (800, 0.8125rem, 0.08em, uppercase): stamp text only. Reason tags use 700, 0.6875rem, 0.05em uppercase.

### Named Rules
**The One Signature Rule.** At most one word per screen is set in Ephesis, inside the screen title, with its soft-orange stroke drawn in. Screens may have none (Rules does not).

**The Tabular Money Rule.** Amounts, card digits, counts and eval figures use tabular numerals.

## Layout

A single phone column, max 420px. On wide screens the column becomes a 880px-tall device with 44px corners on a slate backdrop, scrolling inside. Structure top to bottom: forest header (28px top, 20px sides and bottom), a scrolling main area (20px sides, 24px top, 32px bottom), a four-tab bar pinned at the foot.

Rhythm is 4px-based: 12px inside control groups, 16px between receipt sections (dashed rule plus 16px above and below), 20-24px between blocks on a screen. Primary actions are full width. Agent steps form a vertical timeline: a 1px line-coloured rule at 13px from the left, 28px icon discs ringed in cream sitting on it, search results indented 40px; a receipt drops into the timeline at full width when a decision arrives.

## Elevation & Depth

Mostly tonal: paper sits on cream with a 1px line ring. Shadows are soft, low and tinted forest-deep, never grey and never hard-edged. The receipt is the only surface lifted by default.

### Shadow Vocabulary
- **Receipt lift** (`filter: drop-shadow(0 1px 1px rgb(15 46 38 / 0.08)) drop-shadow(0 10px 18px rgb(15 46 38 / 0.09))`): on the receipt's wrapper, because the torn-edge mask would clip a box-shadow.
- **Primary press-ready** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08), 0 8px 16px -10px rgb(15 46 38 / 0.75)`): primary pill buttons; removed when disabled.
- **Needs glow** (`box-shadow: 0 8px 16px -10px rgb(150 100 0 / 0.8)`): the gold needs button.
- **Field inset** (`box-shadow: inset 0 1px 2px rgb(15 46 38 / 0.05)`): text areas, plus a 4px forest/10% ring on focus.
- **Switch knob** (`box-shadow: 0 2px 6px rgb(15 46 38 / 0.3)`): the agent switch thumb.

### Named Rules
**The Paper Lifts Rule.** Only receipts float. Panels, chips and fields stay flat with a line ring.

## Shapes

Two radii do almost all the work: full pills for controls (buttons, chips, tags, tab indicators, status pill, switch, badges) and 20px for surfaces (receipts, panels, fields, dashed empty states). The receipt rounds its top corners only; its bottom is an irregular torn edge, a 120x10 SVG tear repeated across the width. The stamp is the one squared form: 10px corners, a 2px border plus a 1.5px outline offset 2.5px, rotated -4deg. Icons are one line set on a 24px grid, 1.75 stroke (2-2.5 inside small discs and stamps), round caps and joins.

## Components

### Buttons
Tactile, rounded and confident; they press down.
- **Shape:** full pill; sizes 48px (lg, 0.9375rem), 40px (md, 0.875rem), 32px (sm), 28px (xs, 0.75rem); semibold.
- **Primary:** forest on cream text with the press-ready shadow; hover forest-deep; disabled forest at 35% with no shadow.
- **Secondary:** paper with a line ring, forest text; hover cream with a forest/35% ring.
- **Needs:** gold with forest-deep text and the needs glow; only for routing a person to a pending approval.
- **Quiet / Warn:** text-only, forest or orange-ink, with a 6% forest or 10% orange wash on hover.
- **States:** all transition background, shadow, colour and transform over 200ms; active scales to 0.97; busy shows a spinner inside the button that was pressed, not its siblings. A trailing arrow nudges 2px right on hover.

### Chips
- **Style:** paper pill, line ring, forest 0.8125rem medium text.
- **State:** hover and selected turn peach with a soft-orange ring; active scales to 0.96. Used for example tasks.

### Cards / Containers
- **Receipt:** paper, 20px top corners, torn bottom, 20px padding, receipt lift. Head: title left, amount right. Sections divide with a 1.5px dashed line rule.
- **Panel:** paper, 20px, 1px line ring, flat. Used for settings rows and the eval table.
- **Empty state:** 20px dashed line border, centred muted text, no fill.

### Inputs / Fields
- **Style:** paper, 1px line border, 20px corners, 14px/16px padding, auto-sizing between 7.5rem and 22rem, field inset shadow.
- **Focus:** border goes forest/55% and a 4px forest/10% ring appears; the global focus outline is 2px forest offset 2px (cream on the header).

### Navigation
- **Tab bar:** paper, top line border, four equal tabs (Rules, Ask, Approvals, Activity; Evals lights Activity). Labels 0.75rem muted, bold forest when active.
- **Active indicator:** a 56x32 forest pill behind the icon, cream icon; hover shows a 6% forest wash; press scales to 0.9.
- **Pending badge:** 18px gold pill with forest-deep count and a paper ring, popping in when the count changes.
- **Header status pill:** "Agent on" is a translucent cream pill with a pinging dot; "Agent is turned off" is soft orange with forest-deep text.

### Decision Stamp (signature)
The checker's verdict as a rubber stamp: icon plus uppercase word inside a double border, tilted -4deg, tinted per the Three Stamps Rule. When a decision arrives it lands: from 1.7x, -12deg and blurred to 0.93x then settles, 220ms on the house ease. When a person approves or declines, the new stamp lands in place of Asking you before the receipt leaves.

### Reason Lines
The receipt's line items: each reason is 0.875rem slate text led by a small uppercase cream pill naming who checked it (Rule check, AI check, System).

### Notes
One line under a control with a leading icon: errors in orange-ink with an alert icon (role alert), confirmations in forest with a check (role status); they slide in.

### Motion
One ease, `cubic-bezier(0.16, 1, 0.3, 1)`. Steps and receipts slide up 6px over 360ms; the script stroke draws in over 700ms after 120ms; badges pop over 320ms; removed rules slide out right over 180ms; the working indicator is three bobbing dots. Under reduced motion every animation and transition is cut to 1ms.

## Do's and Don'ts

### Do:
- **Do** put every checker decision on a receipt with a stamp and reason lines, using the shared Receipt, Stamp and ReasonLines parts.
- **Do** keep gold for "needs you" only: the needs button, the pending badge, the Asking you stamp.
- **Do** use orange-ink, not orange, for any orange text below display size.
- **Do** make controls full pills and surfaces 20px; tilt only the stamp.
- **Do** tint every shadow forest-deep (`rgb(15 46 38 / …)`), soft and offset downward.
- **Do** animate with the one house ease and honour reduced motion.

### Don't:
- **Don't** use The Product Kinship's name, logo or blob mark; only its colours and type.
- **Don't** set more than one Ephesis word on a screen, or use the script outside screen titles.
- **Don't** reword the decision labels (Approved, Asking you, Blocked).
- **Don't** fall back to small coloured status badges in a grey list for decisions; that is the default this world replaces.
- **Don't** add hard-edged or grey shadows, or lift panels and chips off the cream.
