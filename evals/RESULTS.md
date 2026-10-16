# Eval results

Fixed rule set: `evals/rules.json` (10 rules). 65 cases (48 dev / 17 held-out test). See `evals/README.md` for the labelling policy.

| Run | Date | Split | Accuracy | Wrong approvals | Needless asks | Wrong blocks | Missed blocks |
|---|---|---|---|---|---|---|---|
| keyword-baseline | 2026-10-15 | dev | 27/48 (56%) | 12 | 8 | 0 | 1 |
| keyword-baseline | 2026-10-15 | test | 9/17 (53%) | 5 | 3 | 0 | 0 |
| claude-sonnet-5-5 v1, v2, final | pending | dev + test | – | – | – | – | – |

Saved run: `evals/results/2026-10-15T22-42-40-898Z_keyword-baseline_baseline.json`.

Claude rows are pending an Anthropic key (no key on the build machine). To fill them: `npm run eval -- --checker claude --label v1` (Session 26), the improvement round (Session 27), then `npm run eval -- --checker claude --label final`. Re-checked 16 Oct 2026: the keyword baseline still gives the numbers above.

## Gemini stopgap (16 Oct 2026, partial, not a headline)
While there is no Anthropic key, the checker can run on Google's free `gemini-3.8-flash` with exactly the Claude instructions (`--checker gemini`). The free tier allows about 5 calls a minute and **20 a day**, so a 65-case run stops a third of the way through. Of one attempt, 22 cases got a real answer and 43 hit the limit (or a "high demand" error).
- On those 22 cases Gemini got **22/22** right, with no wrong approvals. The keyword baseline gets 19/22 on the same cases, with 2 wrong approvals ("refund-01" and "gifts-01").
- Only 4 of the 22 are held-out cases, and many are hard-rule cases that code decides anyway. So this shows the setup works with a real model and that an AI reading beats keywords on the cases it saw, nothing more.
- The run wasn't saved: the eval now refuses to save a run where the checker failed on any case (see `checkerErrors`), because those failures used to count silently as "ask".

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
