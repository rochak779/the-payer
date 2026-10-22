---
name: The Payer
description: Spending rules for your AI shopping agent, in the look of Rochak's portfolio (site-dime); every decision is a sheet whose offset colour says the verdict.
colors:
  yellow: "#ffca49"
  yellow-line: "#e9c893"
  cream: "#fefaf4"
  paper: "#ffffff"
  surface: "#f6f2e9"
  ink: "#1c1c1c"
  muted: "#5c5c5c"
  line: "#d3c9bc"
  rule: "#91867b"
  brown: "#5c491a"
  mint: "#c7e9cc"
  pink: "#f8b7c7"
typography:
  wordmark:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  display:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  amount:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "\"tnum\" on"
  title:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  tag:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.4
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" on"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  intro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.375
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.625
  nav:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
    lineHeight: 1.35
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.625
rounded:
  knob: "3px"
  control: "4px"
  circle: "9999px"
spacing:
  tight: "8px"
  group: "12px"
  md: "16px"
  screen: "20px"
  section: "24px"
  major: "40px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-needs:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-quiet:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.surface}"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "20px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
  empty-state:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "24px 16px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
  chip:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
  stamp-approve:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.control}"
    padding: "5px 12px 5px 9px"
  stamp-ask:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.control}"
    padding: "5px 12px 5px 9px"
  stamp-block:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.control}"
    padding: "5px 12px 5px 9px"
  stamp-withdrawn:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.control}"
    padding: "5px 12px 5px 9px"
  reason-tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "1px 6px"
  masthead:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    padding: "24px 20px 16px"
  status-on:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  status-off:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  dock:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.nav}"
    rounded: "{rounded.control}"
    padding: "6px"
  dock-active:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "52px"
  pending-badge:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    height: "18px"
  switch-on:
    backgroundColor: "{colors.mint}"
    rounded: "{rounded.control}"
    height: "32px"
    width: "56px"
  switch-off:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "32px"
    width: "56px"
---

# Design System: The Payer

## Overview

**Creative North Star: "The Verdict Sheet"**

The Payer wears Rochak's portfolio design, site-dime: golden yellow, warm cream, ink outlines and white paper, carried from an editorial portfolio into a working app. Every checker decision is a sheet of white paper with a 1px ink edge, sitting on a hard coloured offset that says the verdict before a word is read: mint for Approved, yellow for Asking you, pink for Blocked, warm line for a person's own decline or cancel. On the sheet, the verdict is a tag with the same fill, tilted 2 degrees and pressed down with a hard ink offset.

The app is one phone-sized column (max 420px). On wide screens it stands on a flat yellow field, the way the portfolio sets its portrait on yellow. The shell is a cream masthead with the "The Payer." wordmark and an ink dock at the foot whose yellow marker slides to the active tab. Satoshi carries every display word, heavy and tight; Inter carries everything people read. Controls are Dime controls: 4px corners, an ink edge and a hard ink offset that grows on hover and vanishes on press.

The previous look (The Product Kinship's forest, gold and orange, Manrope and a script word, torn receipts and rubber stamps) is retired. None of Rochak's personal identity is used: no portrait, mascot or monogram.

**Key Characteristics:**
- Decisions on white sheets with ink edges; the offset colour is the verdict.
- Yellow is the voice: primary actions, chosen chips, the highlighted title word, the dock marker, the pending count.
- Satoshi 800–900 with tight tracking for display; Inter for body, labels and controls; sentence case everywhere.
- 4px corners, 1px ink outlines, hard offsets on controls; dashed rules between sections.
- Paper and tags move on one curve, `cubic-bezier(0.16, 1, 0.3, 1)`; controls move on plain `ease` at 180ms; reduced motion turns it all off.

## Colors

site-dime's palette: golden yellow and cream with ink, two of its pastels promoted to decision colours.

### Primary
- **Golden Yellow** (#ffca49): primary buttons, a chosen example chip, the highlight band under one title word, the dock's active marker, the pending count badge, the Asking you tag and its sheet offset, the default offset of non-decision sheets, text selection, scrollbars. Also the offset of the ink "Review in Approvals" button.
- **Warm Yellow Line** (#e9c893): the resting border of example chips, as on the portfolio's filters.

### Secondary
- **Approved Mint** (#c7e9cc): the Approved tag and its sheet offset, the "Agent on" dot, the agent switch's on track, the check discs in the rules list and the empty Approvals state, success notes.
- **Blocked Pink** (#f8b7c7): the Blocked tag and its sheet offset, the "Agent is turned off" chip, error-step discs and error notes, the remove-rule underline and hover, alarming eval figures.

### Neutral
- **Ink** (#1c1c1c): all body text, headings, outlines, control offsets, the dock, focus rings.
- **Cream** (#fefaf4): the app ground, the masthead, secondary buttons, the ring that cuts the step line behind each disc.
- **White Paper** (#ffffff): decision sheets, panels, fields, step discs, the status chip.
- **Warm Surface** (#f6f2e9): empty states, reason tags, withdrawn tags, the AP2 JSON block, the eval table header, the switch's off track, quiet-button hover.
- **Muted Charcoal** (#5c5c5c): supporting copy, sheet meta, log lines, captions, placeholders. 6.4:1 on cream; never on yellow or pink.
- **Paper Line** (#d3c9bc): the masthead's bottom rule, panel edges, dashed rules inside sheets, the withdrawn sheet offset.
- **Dashed Rule** (#91867b): the step timeline, section-heading rules, the AP2 details rules, empty-state outlines, eval leaders (3.4:1 on cream).
- **Deep Brown** (#5c491a): hover colour on the AP2 summary, as on the portfolio's drawer links.

### Named Rules
**The Verdict Colour Rule.** Mint is Approved, yellow is Asking you, pink is Blocked, warm line is a person's own decline or cancel. A decision always shows its colour twice (tag fill and sheet offset) and never alone: the tag carries an icon (check, question, cross) and the fixed word.

**The Ink Text Rule.** Text on yellow, mint, pink or surface is always ink (10:1 or better). Muted charcoal is for cream and white only.

**The Yellow Is Yours Rule.** Yellow marks what a person can do or must do next. It is never a status colour for something already settled.

## Typography

**Display Font:** Satoshi variable, 300–900 (with Inter, then the system sans), from Fontshare's CDN
**Body Font:** Inter variable (with the system sans), self-hosted by `next/font`
**Mono:** the system monospace, for the AP2 JSON and inline code only

**Character:** a heavy geometric grotesque set tight for every display word, over a calm, legible workhorse sans; the same pairing as the portfolio.

### Hierarchy
- **Wordmark** (Satoshi 800, 1.5rem, 1.1, -0.035em): "The Payer" in the masthead, with a yellow full stop added in CSS (`content: "." / ""`), hidden from screen readers.
- **Display** (Satoshi 900, 2rem, 1.05, -0.04em): the screen title, balanced; at most one word on the highlight band.
- **Amount** (Satoshi 900, 1.75rem, 1, -0.035em, tabular): the price on a decision sheet and the latest eval score.
- **Title** (Satoshi 800, 1.1875rem, 1.15, -0.025em): sheet titles. Panel titles use 1.0625rem.
- **Section** (Satoshi 800, 1.125rem, -0.03em): headings inside a screen, followed by a dashed rule to the edge. The AP2 summary and table title use 1rem.
- **Tag** (Satoshi 800, 0.9375rem, -0.01em, sentence case): the verdict tag.
- **Body** (Inter 400, 1rem, 1.625): field text. Screen intros use 0.9375rem in muted, capped at 36ch; reasons and steps use 0.875rem.
- **Label** (Inter 650, 0.8125rem): chips, links, payment rows, status chip. Buttons are 650 at 0.9375 / 0.875 / 0.8125 / 0.75rem by size.
- **Small** (Inter, 0.75rem): log lines (time in 650 ink, tabular), reason tags (650), the eval table, footnotes. The dock's labels are 0.75rem 700.

### Named Rules
**The Sentence Case Rule.** No uppercase tracking anywhere: tags, labels, buttons and table headers are sentence case, as on the portfolio.

**The One Highlight Rule.** At most one word per screen sits on the yellow band (Rules spends it on "understood" in the preview heading).

**The Tabular Figures Rule.** Amounts, times, counts and eval figures use tabular numerals; text columns next to them do not (Inter's tabular set widens hyphens).

## Layout

One phone column, max 420px. Below 640px it fills the screen: the masthead scrolls away, the dock sticks to the bottom of the viewport. From 640px the column becomes a framed sheet `min(880px, 100dvh - 4rem)` tall with a 1px ink edge and a 4px corner, centred on a flat yellow field, scrolling inside.

Structure top to bottom: masthead (24px top, 20px sides, 16px bottom, paper-line rule below); main (20px sides, 24px top, 32px bottom); the dock (12px inset, 6px padding). Rhythm: 8px inside small groups, 12px inside control groups, 16px between sheet sections (a dashed line rule with 16px above and below), 20–24px between blocks on a screen, 40px before the AP2 details. Primary actions are full width.

Agent steps form a vertical timeline: a 1px dashed rule at 13.5px from the left, 28px white discs with an ink edge ringed in cream sitting on it, search results indented 40px. A decision sheet drops into the timeline at full width.

## Elevation & Depth

Depth is physical and hard-edged, as on the portfolio: papers and controls sit on solid offsets with no blur. Only two soft shadows exist, both under whole objects: the dock and the framed column.

### Shadow Vocabulary
- **Control offset** (`box-shadow: 2px 2px 0 #1c1c1c`; hover `4px 4px 0` with `translate(-1px,-1px)`; pressed `0 0 0` with `translate(2px,2px)`): every bordered button. A busy button stays pressed.
- **Needs offset** (`box-shadow: 2px 2px 0 #ffca49`, growing the same way): the ink "Review in Approvals" button.
- **Verdict offset** (`box-shadow: 5px 5px 0 <verdict colour>`): decision sheets; non-decision sheets (saved rules, latest eval run) use yellow. It eases between colours over 350ms when a person decides.
- **Tag offset** (`box-shadow: 2px 2px 0 #1c1c1c`): verdict tags; withdrawn tags have none.
- **Field focus** (`box-shadow: 4px 4px 0 0 #ffca49, 4px 4px 0 1px #1c1c1c`): a yellow backing sheet with an ink edge appears behind a focused field.
- **Knob offset** (`box-shadow: 2px 2px 0 #1c1c1c`): the agent switch's knob.
- **Dock lift** (`box-shadow: 0 6px 22px rgb(28 28 28 / 0.16)`): the ink dock, as on the portfolio.
- **Frame lift** (`box-shadow: 8px 12px 28px rgb(92 73 26 / 0.22)`): the framed column on wide screens, the portfolio's warm paper shadow.

### Named Rules
**The Hard Offset Rule.** Offsets are solid and blur-free, down and to the right, in ink, yellow or a verdict colour. Panels, empty states and the masthead stay flat.

## Shapes

One corner does almost everything: 4px on buttons, chips, fields, sheets, panels, tags, the status chip, the dock and its marker, the switch (its knob is 3px inside the 1px edge). Circles are reserved for small round things: step discs, note and check discs, status dots, the pending badge, the spinner. Outlines are 1px ink on controls and decision sheets, 1px paper line on panels, 1px dashed rule on empty states. The verdict tag is the only tilted form (-2deg). Icons are one line set on a 24px grid, 1.75 stroke (2–2.75 inside small discs and tags), round caps and joins.

## Components

### Buttons
Dime buttons: an ink edge and an offset you can press.
- **Shape:** 4px corners; heights 48px (lg, 0.9375rem), 44px (md, 0.875rem), 36px (sm, 0.8125rem), 32px (xs, 0.75rem); Inter 650; 8px icon gap.
- **Primary:** yellow with ink text. **Secondary:** cream with ink text. **Needs:** ink with cream text and a yellow offset, only for routing a person to a waiting purchase.
- **Quiet / Warn:** text actions with no edge and a 3px underline (yellow, or pink for warn), offset 6px; hover fills warm surface.
- **States:** hover lifts 1px and grows the offset (pointer devices only); press sinks 2px and drops it; disabled is 40% with no offset; busy shows a spinner in the pressed button only and keeps it pressed. A trailing arrow nudges 2px right on hover. All over 180ms `ease`.

### Chips
- **Style:** transparent with a 1px warm yellow line border, ink 0.8125rem 650 text, 40px minimum height, left-aligned so long tasks wrap.
- **State:** hover and chosen (`aria-pressed`) fill yellow with a yellow border.

### Cards / Containers
- **Decision sheet:** white paper, 1px ink edge, 4px corners, 20px padding, verdict offset. Head: title left, amount right. Sections divide with a 1px dashed paper-line rule.
- **Panel:** white paper, 1px paper-line edge, flat. Settings rows, the PayPal strip, the eval table.
- **Empty state:** warm surface, 1px dashed rule outline, centred muted text.

### Inputs / Fields
- **Style:** white paper, 1px ink edge, 4px corners, 14px/16px padding, Inter 1rem, auto-sizing between 7.5rem and 22rem.
- **Focus:** the field focus offset appears (yellow backing with an ink edge); the browser outline is replaced by it. Elsewhere focus is a 3px ink ring offset 3px; on the dock it turns yellow, offset 2px.

### Navigation
- **Dock:** an ink bar with 4px corners at the foot, four equal tabs (Rules, Ask, Approvals, Activity; Evals lights Activity), icon over a 0.75rem 700 label in cream at 85%.
- **Active:** a yellow marker slides under the active tab (transform only, 360ms on the paper curve); the active label and icon turn ink.
- **Pending badge:** an 18px yellow circle with an ink count and a 2px ink ring, popping in when the count changes.
- **Status chip:** "Agent on" is white with an ink edge and a pinging mint dot; "Agent is turned off" is pink with an ink dot.

### Verdict tag (signature)
The checker's decision as a tag on the sheet: icon plus the fixed word, Satoshi 800 in sentence case, 1px ink edge, filled per the Verdict Colour Rule, tilted -2deg on a 2px ink offset. A person's decline or cancel is a flat dashed tag on warm surface. When a decision arrives the tag lands: it starts lifted on a deep ink offset (8px 12px), is pressed flat (0 offset) and settles at 2px, over 420ms on the paper curve. When a person approves or declines, the new tag lands in place of Asking you and the sheet's offset eases to the new colour before the sheet leaves.

### Reason lines
Each reason is 0.875rem ink text led by a small sentence-case tag naming who checked it (Rule check, AI check, System): warm surface, 1px paper-line edge, Inter 650 at 0.75rem.

### Highlight band
One title word sits on a hard yellow band across 77–95% of its line box, drawn left to right over 700ms after 120ms. Alarming eval figures sit on a small pink block instead.

### Section heading
A Satoshi heading followed by a 1px dashed rule that runs to the edge, as on the portfolio's section headings.

### Agent switch
A 56×32 track with 4px corners and an ink edge, mint when on and warm surface when off; a white 24px knob with an ink edge and offset slides across over 300ms.

### Notes
One line under a control with a 20px disc: pink with an alert icon for errors (role alert), mint with a check for confirmations (role status); ink text; they slide in.

### Motion
Controls: 180ms `ease`. Paper, tags, steps and the dock marker: `cubic-bezier(0.16, 1, 0.3, 1)`; steps and sheets rise 6px over 350ms; badges pop over 320ms; removed rules slide out right over 180ms; the working indicator is three bobbing ink dots. Under reduced motion every animation and transition is cut to 1ms.

## Do's and Don'ts

### Do:
- **Do** put every checker decision on a sheet with a verdict tag and reason lines, using the shared Receipt, Stamp and ReasonLines parts with the decision's `tone`.
- **Do** keep text ink on every coloured fill; keep muted charcoal on cream and white only.
- **Do** use 4px corners, 1px ink outlines and blur-free offsets for controls and decision sheets.
- **Do** keep one highlighted word per screen and sentence case everywhere.
- **Do** load Satoshi from Fontshare's CDN; never commit its font files to this public repo.
- **Do** honour reduced motion and keep every state readable without animation.

### Don't:
- **Don't** use Rochak's portrait, mascot, "r." monogram or the portfolio's layouts (hero, project selector, marquee, bookshelf, games) in the app.
- **Don't** reword the decision labels (Approved, Asking you, Blocked) or show a verdict by colour alone.
- **Don't** use yellow for a settled status, or pink and mint as decoration.
- **Don't** bring back the retired Product Kinship look: forest and gold, Manrope, the script word, torn receipt edges or rubber-stamp double borders.
- **Don't** add uppercase tracked labels, gradients, glass or soft-blurred card shadows.
