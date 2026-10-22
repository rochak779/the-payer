---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: ["src/components"]
---

# Surface brief: The Payer app (all screens)

Scope: the phone-sized app shell and its screens: Rules, Ask, Approvals, Activity, Evals. Visitor mode: Operate.
Audience: hackathon judges and visitors trying the hosted demo, and viewers of a demo video under 3 minutes (PRODUCT.md).
Job: write rules, send a task, see each decision and why, approve or decline, check what was charged.
Constraints: the look follows Rochak's portfolio design, site-dime (pinned by the owner, 22 Oct 2026), carried into app ergonomics; no portfolio layouts (hero, project selector, marquee, bookshelf, games) and none of Rochak's portrait, mascot or monogram. Satoshi is not committed to the public repo (Fontshare licence); it loads from Fontshare's CDN. Decision words are fixed (Approved, Asking you, Blocked); copy, routes, server actions and behaviour unchanged. No image generation: code-led.
Owner ask: "reskin to site-dime from the portfolio, so that it is aligned to how the portfolio looks."

## Direction contract

THESIS: Every checker decision is a sheet of white paper with an ink edge, sitting on a coloured offset that says the verdict before a word is read. It refuses the category default, a grey list with small coloured badges, and drops the previous receipt-and-rubber-stamp look.

OWN-WORLD: site-dime's Dime world. Cream #FEFAF4 ground, white paper, ink #1C1C1C for text, borders and the bottom dock; golden yellow #FFCA49 for primary actions, selection, the highlighted title word and the dock marker. Decision offsets: mint #C7E9CC approved, yellow asking, pink #F8B7C7 blocked, warm line #D3C9BC for a person's own decline or cancel. Satoshi 800-900 tight for display, Inter for everything read. 4px corners, 1px ink outlines, hard ink offsets on controls that grow on hover and vanish on press, dashed rules between sections.

STORY: The visitor writes rules and sees them read back on paper, sends a task, watches the steps tick down a dashed line, and the decision lands as a tag on a sheet whose offset colour already told them approve, ask or block; a video viewer reads the verdict from colour, tag and word at once.

FIRST VIEWPORT (Ask): cream masthead with "The Payer." wordmark (yellow terminal dot) and an outlined agent status chip; the title "Ask the agent" with "agent" on a yellow highlight band; a white field with an ink edge; example tasks as outlined filter chips that fill yellow when chosen; a full-width yellow "Send to agent" button with a hard ink offset; under it the steps on a dashed timeline, then the decision sheet: item and amount in Satoshi, the verdict tag tilted on the sheet, reasons with sentence-case "Rule check / AI check" tags; an ink dock at the foot with a yellow marker on the active tab and a yellow pending count.

FORM: Pinned brief (site-dime) beats the roll; seed key a20732b8 (assigned 7, not built: owner-pinned). Signature move: the verdict tag lands like a Dime button pressed in reverse, lifted with a deep ink offset, then pressed flat onto the sheet; a person's approve or decline lands a new tag in place. Motion grammar: controls 180ms ease (offset grows on hover, collapses on press); paper and tags 350ms cubic-bezier(.16,1,.3,1); the highlight band draws in over 700ms; the dock marker slides 360ms; reduced motion turns all of it off.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
