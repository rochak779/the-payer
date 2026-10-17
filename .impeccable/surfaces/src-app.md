---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: ["src/components"]
---

# Surface brief: the Agent Mandates app (all screens)

Scope: the phone-sized app shell and its screens: Rules, Ask, Approvals, Activity, Evals. Visitor mode: Operate.
Audience: five hands-on testers and viewers of a ~90 s LinkedIn screen recording, equally (PRODUCT.md).
Job: write rules, send a task, see each decision and why, approve or decline, check what was charged.
Constraints: The Product Kinship's colours and type only, no TPK name or logo; product name stays Agent Mandates; decision words are fixed (Approved, Asking you, Blocked); copy stays as is; behaviour unchanged. No image generation this session: code-led.
User asks: polished buttons and components; micro-interactions wherever they help.

## Direction contract

THESIS: Every checker decision is a receipt: a stamp (Approved, Asking you, Blocked) with its reasons printed as line items. It refuses the category default, a grey settings list with small coloured badges.

OWN-WORLD: Cream ground #F7F2E8; forest #173F35 owns the header and primary pills; gold #E9A51A means "needs you" and nothing else; orange #D96A32 (text #B4511F) is Blocked; slate #24333B ink, line #E4DCCD. Receipts are warm white paper with one torn bottom edge. Manrope throughout, heavy and tight at display sizes; the Ephesis script appears once per screen, underlined by a hand-drawn stroke in soft orange #ECB898 (gold stays reserved). Pill buttons, 24 px card corners.

STORY: The tester writes rules and sees them read back as receipt lines, sends a task, watches the agent's steps tick by, and the decision lands as a receipt they understand at a glance; a viewer learns approve, ask, block and why without narration.

FIRST VIEWPORT (Ask): forest header with the product name and an agent status pill; the task box on a cream card with example chips; a forest pill "Send to agent"; under it the agent's steps as a quiet ticking list, then the receipt: shop and amount large, the stamp set at a slight angle, reasons as line items, the one-time card row; bottom tabs with a gold pending count.

FORM: Decision receipts, position 1 on the ordered list; seed key d8b078b5. Signature interaction: the stamp lands on the receipt (overshoots, settles, ~200 ms) when a decision arrives, and changes in place when a person approves. Motion grammar: one ease, cubic-bezier(.16,1,.3,1); steps slide in as they arrive; buttons press down; reduced motion turns all of it off.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
