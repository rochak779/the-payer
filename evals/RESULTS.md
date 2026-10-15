# Eval results

Fixed rule set: `evals/rules.json` (10 rules). 65 cases (48 dev / 17 held-out test). See `evals/README.md` for the labelling policy.

| Run | Date | Split | Accuracy | Wrong approvals | Needless asks | Wrong blocks | Missed blocks |
|---|---|---|---|---|---|---|---|
| keyword-baseline | 2026-10-15 | dev | 27/48 (56%) | 12 | 8 | 0 | 1 |
| keyword-baseline | 2026-10-15 | test | 9/17 (53%) | 5 | 3 | 0 | 0 |
| claude-sonnet-5-5 v1, v2, final | pending | dev + test | – | – | – | – | – |

Saved run: `evals/results/2026-10-15T22-42-40-898Z_keyword-baseline_baseline.json`.

Claude rows are pending an Anthropic key (no key on the build machine). To fill them: `npm run eval -- --checker claude --label v1` (Session 26), the improvement round (Session 27), then `npm run eval -- --checker claude --label final`. Re-checked 16 Oct 2026: the keyword baseline still gives the numbers above.

## Notes
- Baseline = keyword matching, the way a simple guardrail works. It shows both failure modes:
  - **Over-asking on harmless words (needless asks):** 11 of the 18 cases that should be approved get an "ask". "Hotel Chocolat" trips the hotel-rating rule, "grocery delivery" reads as an extra cost, "Shop address" trips the genuine-shop rule, and a book marketed as "the perfect gift" is treated as a gift.
  - **Missing paraphrases (wrong approvals):** "All sales final", "No refunds or exchanges" and "Basic fare: no refunds" all pass the "nothing non-refundable" rule, and a present for a nephew or flowers for mum pass the gifts rule. 17 of the 47 cases that should ask or block are approved.
- By category, the baseline is weakest on refund wording (1/8) and gifts (0/8): exactly the judgement rules the research said matter most.
- Hard-rule categories (conflict 6/6, against 7/9) are mostly right because plain code handles amounts, merchants, categories and dates.

## Rule-reading accuracy
Does "here's what I understood" match what the person meant? 20 plain-English rules in `evals/parse-cases.json` (15 written for the plan, 5 in people's own words from `research/rules-test.md`). A case passes only if every rule's kind, limit, scope and ask/block match.

| Reader | Date | Correct | Notes |
|---|---|---|---|
| pattern (offline) | 2026-10-15 | 13/20 | Misses dates, € and $ limits, and two-part sentences. Two misreads are risky: "I only shop at Tesco for groceries" became "only ever use *tesco for groceries*" (would block everything else), and "No subscriptions that renew automatically" became a ban on all subscriptions. |
| claude-sonnet-5-5 | pending | – | Needs an Anthropic key: `npm run eval:parse -- --parser claude`. |
