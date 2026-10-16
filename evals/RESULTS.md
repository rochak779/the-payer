# Eval results

Fixed rule set: `evals/rules.json` (10 rules). 65 cases (48 dev / 17 held-out test). See `evals/README.md` for the labelling policy.

| Run | Date | Split | Accuracy | Wrong approvals | Needless asks | Wrong blocks | Missed blocks |
|---|---|---|---|---|---|---|---|
| keyword-baseline | 2026-10-15 | dev | 27/48 (56%) | 12 | 8 | 0 | 1 |
| keyword-baseline | 2026-10-15 | test | 9/17 (53%) | 5 | 3 | 0 | 0 |
| gemini-3.5-flash-lite v1 (free) | 2026-10-16 | dev | 44/48 (92%) | 2 | 1 | 1 | 0 |
| gemini-3.5-flash-lite v1 (free) | 2026-10-16 | test | 14/17 (82%) | 1 | 1 | 1 | 0 |
| gemini-3.5-flash-lite v2 (free) | 2026-10-16 | dev | 46/48 (96%) | 0 | 1 | 1 | 0 |
| gemini-3.5-flash-lite v2 (free) | 2026-10-16 | test | 14/17 (82%) | 0 | 2 | 1 | 0 |
| claude-sonnet-5-5 v1, v2, final | pending | dev + test | – | – | – | – | – |

Saved runs: `evals/results/2026-10-15T22-42-40-898Z_keyword-baseline_baseline.json`, `evals/results/2026-10-16T08-48-36-027Z_gemini_gemini-3.5-flash-lite_v2_v2.json`, `evals/results/2026-10-16T08-34-42-700Z_gemini_gemini-3.5-flash-lite_v1_flash-lite-v1.json`.

Claude rows are pending an Anthropic key (no key on the build machine). To fill them: `npm run eval -- --checker claude --label v1` (Session 26), the improvement round (Session 27), then `npm run eval -- --checker claude --label final`. Re-checked 16 Oct 2026: the keyword baseline still gives the numbers above.

## Improvement round 1: prompt v2 (16 Oct 2026)
- **Change:** one general line under "unsure": if a rule needs a specific fact (a number, a date, a policy) and the text only describes it in general words, answer "unsure", and don't turn descriptions like "very good" into numbers. Picked because both dev wrong approvals were "should have said unsure". The prompt is shared, so the Claude checker gets the same change.
- **Dev:** 44/48 → **46/48**; wrong approvals 2 → **0**. Kept, by the plan's rule (dev wrong approvals didn't rise, dev accuracy didn't fall).
- **Held out:** 14/17 → 14/17; wrong approvals 1 → **0**; needless asks 1 → 2 (a book with no word on who it's for became "not sure" about the gifts rule).
- **Zero wrong approvals across all 65 cases.** Still wrong: 2 wrong blocks (a 100% first-night fee, "store credit only") and 3 needless asks (all the gifts rule).
- **How noisy is one run?** A repeat of v2 gave dev 46/48 again, held out 15–16/17, and zero wrong approvals among the 64 cases answered. One call failed, so that run wasn't saved; the failed case was one where "ask" was right, so it may have counted as correct by accident. Read held-out scores as ±2 cases.
- **Stopping rule met** (dev wrong approvals 0, needless asks no longer falling), so no round 2 on prompt wording.

## Gemini 3.5 Flash-Lite, first full run: prompt v1 (16 Oct 2026)
Google's free `gemini-3.5-flash-lite`, same instructions as the Claude checker (prompt v1), one call at a time. All 65 cases answered; no limit or outage errors. About 4.4 seconds per check (median).
- **Held out: 14/17 (82%)** vs keyword 9/17. **All cases: 58/65** vs keyword 36/65. Wrong approvals 3 (keyword 17), needless asks 2 (keyword 11).
- **Wrong approvals (3), the money-at-risk kind:** all three are "should have said unsure". `price-02`: a £12/night city tax payable at the hotel takes £145 to £157, over the £150 limit, and it wasn't flagged as a hidden cost. `ambiguous-06`: "Very good" isn't a number, so the 8/10 rating rule can't be confirmed. `ambiguous-07`: two ratings disagree (9.2 on the hotel's own site, 6.8 elsewhere).
- **Wrong blocks (2):** stricter than the label. "Store credit only" and "a fee of 100% of the first night" were blocked as non-refundable; the labels say ask, because they're partly refundable. Safe for money, but the task fails.
- **Needless asks (2):** a gift box and a "gift" listing bought for the person themselves.
- **For the improvement round (Session 27):** tell the checker to answer "unsure" when information is vague or conflicting, and to count charges payable on arrival as hidden costs.

## Gemini 3.8 Flash, partial (16 Oct 2026, not a headline)
The bigger free Gemini model, `gemini-3.8-flash`, can run with the same instructions with exactly the Claude instructions (`--checker gemini`). The free tier allows about 5 calls a minute and **20 a day**, so a 65-case run stops a third of the way through. Of one attempt, 22 cases got a real answer and 43 hit the limit (or a "high demand" error).
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
