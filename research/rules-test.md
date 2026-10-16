# Rules test (Session 0.1, go/no-go gate)

**Question:** of the spending rules real people say they would give a shopping or booking agent, how many fit a preset setting (amount cap, merchant, category, time window, "always ask"), and how many need judgement?

**Method (15 Oct 2026):** Firecrawl web search, Reddit threads (read via the Arctic Shift archive API because Reddit blocks scrapers), Hacker News comment search (Algolia API), news and blog pages. Raw search output is in `research/raw/` (see its README). Only spending rules are counted. Rules about non-payment actions (sharing an address, reading email) are listed separately at the bottom, because a payment checker can't stop them.

Type **a** = a preset can enforce it fully (amount cap, merchant, category, time window, or "always ask me"). Type **b** = needs judgement (refundability, fees, quality, "only if…", gifts, other people, context such as "things I normally buy"). A rule that mixes a cap with a judgement condition is **b (mixed)**: a cap alone would let through purchases the person clearly didn't want.

| # | Rule (their words) | Source | Date | Type | Why |
|---|---|---|---|---|---|
| 1 | "if it was a tiny amount, like under $20 for something i buy regularly, i could maybe get used to it" | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pfgbj0m/) | 2026-10-12 | b (mixed) | $20 is a preset; "something I buy regularly" needs purchase history and judgement |
| 2 | "letting it auto-reorder groceries under thirty dollars but requiring a quick push notification approval for anything above that or, for booking travel" | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pfgcxih/) | 2026-10-12 | a | category + amount cap; travel category always asks |
| 3 | "I am going to give it a prepaid card with $100/ month pocket money." | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pfgel7d/) | 2026-10-12 | a | monthly budget |
| 4 | "Id be willing to give it access to a throwaway CC (with revolut I can create ones with preset $ on it) but never to my main bank account." | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pfgem3e/) | 2026-10-12 | a | capped virtual card (and names Revolut's preset) |
| 5 | "makes enough errors (usually buying pantry staples repeatedly each week…I don't need a new bottle of pepper each order)" | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pfgkd1r/) | 2026-10-12 | b | "don't re-buy what I already have" needs knowledge of stock and past orders |
| 6 | "I would have a spending limit and requests above said limit." | [Reddit r/artificial](https://www.reddit.com/r/artificial/comments/1x435ji/would_you_let_an_ai_agent_spend_your_money/pgeer6b/) | 2026-10-13 | a | cap, ask above it |
| 7 | "Give it access to a crypto wallet with no more than ~$100 worth of ETH/USDC at a time to limit your exposure." | [Reddit r/AgentsOfAI](https://www.reddit.com/r/AgentsOfAI/comments/1mx4m4u/would_you_let_an_ai_agent_spend_your_money/na64lhy/) | 2025-08-23 | a | balance cap |
| 8 | "enforced spend limits and such. Even then, I'd probably put human in the loop on the final 'Complete order' step." | [Reddit r/AgentsOfAI](https://www.reddit.com/r/AgentsOfAI/comments/1mx4m4u/would_you_let_an_ai_agent_spend_your_money/na2mudr/) | 2025-08-22 | a | cap + always ask (Link's model) |
| 9 | "Anything the agent can undo … let it run. Anything it can't (send money, delete, change permissions, email a customer) needs a human, every time" | [Reddit r/AI_Agents](https://www.reddit.com/r/AI_Agents/comments/1vucq3o/ow_much_freedom_would_you_actually_give_an_ai/p50343k/) | 2026-08-21 | a | for money this is "always ask" |
| 10 | "if the action creates real world consequences, like payments … i must want a checkpoint let me check it first" | [Reddit r/AI_Agents](https://www.reddit.com/r/AI_Agents/comments/1vucq3o/ow_much_freedom_would_you_actually_give_an_ai/p55mja7/) | 2026-08-22 | a | always ask |
| 11 | "If it's something I could do while listening to a podcast … meaning the stakes are low and mistakes are fixable, AI can do that for me" | [Reddit r/AI_Agents](https://www.reddit.com/r/AI_Agents/comments/1vucq3o/ow_much_freedom_would_you_actually_give_an_ai/p50eqga/) | 2026-08-21 | b | "low stakes and fixable" means judging reversibility (refund terms), not just amount |
| 12 | "Hopefully you can set a spending limit too? I'd be OK giving my agent a $100 limit." | [Hacker News](https://news.ycombinator.com/item?id=49616390) | 2026-09-08 | a | cap |
| 13 | "I'm not going to ask an agent to book my flight for my vacation … But my routine business trips … let me just email an agent 'Get there by meeting on day A, leave after meeting day B'" | [Hacker News](https://news.ycombinator.com/item?id=49560058) | 2026-09-04 | b | business vs leisure is context; "get there by the meeting" is a fuzzy timing rule |
| 14 | "I make a list of items that I repeatedly buy (mostly household supplies) … making appropriate purchase decisions … taking advantage of sales to stock up" | [Hacker News](https://news.ycombinator.com/item?id=47492878) | 2026-03-23 | b (mixed) | an item list is close to a preset, but "appropriate" and "stock up on sales" are judgement |
| 15 | "Have an AI account with limited money in it and even that, have a process in place that will only process any financial request if and only if you have approved it." | [Hacker News](https://news.ycombinator.com/item?id=47161120) | 2026-02-26 | a | balance cap + always ask |
| 16 | "tell the agent specifically what domain you want and it buys it. Essentially pre-approving the purchase." | [Hacker News](https://news.ycombinator.com/item?id=47874220) | 2026-04-23 | a | one pre-approved item and merchant (a "closed" mandate) |
| 17 | "The total cost of all travel components … must not exceed $[YOUR NUMBER] … If any option exceeds this figure (including after taxes and fees), exclude it" | [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending) | 2026-08-27 | a | total cap |
| 18 | "Show me only options with free cancellation or a full refund policy if cancelled at least 48 hours before check-in … Do not show me non-refundable, semi-flexible, or 'basic economy' rates" | [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending) | 2026-08-27 | b | needs reading the refund policy text |
| 19 | "Never quote a 'starting from' or 'base' price … total out-of-pocket cost, including … resort fees … required add-ons" | [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending) | 2026-08-27 | b | spotting hidden or mandatory fees in listing text |
| 20 | "If you cannot confirm all four [official site, second source, reviews, map address], flag the property as 'unverified'" | [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending) | 2026-08-27 | b | merchant legitimacy is judgement |
| 21 | "I will explicitly say 'go ahead and book [option name]' … Any other phrasing (including 'that looks good,' 'sounds good,' or 'sure') does not constitute authorization." | [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending) | 2026-08-27 | a | always ask, explicit consent only |
| 22 | "book a refundable hotel room for under £200" | [LinkedIn post (payments consultant)](https://www.linkedin.com/posts/parvez-hussain-payments-consulting_imagine-asking-an-ai-agent-to-book-a-refundable-activity-7515656327441006592-0iSA) (search snippet; LinkedIn blocks scraping) | ~2026-10-12 | b (mixed) | £200 is a preset; "refundable" needs the policy read |
| 23 | "Ask me before spending more than $500" | [Sincerely guide](https://trysincerely.com/guides/let-an-ai-agent-spend-money-safely) | 2026 (undated page) | a | cap, ask above it |
| 24 | "The gift costs a bit more than I budgeted, and the agent must know to contact me in that case." | [DIF Trusted AI Agents use case #12](https://github.com/decentralized-identity/trusted-ai-agents/issues/12) | 2025-10-27 | a | over budget → ask |
| 25 | "[risk:] The agent picks a gift the parents find objectionable." / "shipped to her in time for her birthday" | [DIF use case #12](https://github.com/decentralized-identity/trusted-ai-agents/issues/12) | 2025-10-27 | b | other people's views and delivery-by-date need judgement |
| 26 | "[risk:] The agent doesn't consult with me if the first choice is unavailable." | [DIF use case #12](https://github.com/decentralized-identity/trusted-ai-agents/issues/12) | 2025-10-27 | b | "ask before substituting" needs knowing it's a substitute |
| 27 | "Dad: history buff, keto dieter, $100 budget" | [Medium, "I Let 5 AI Agents Do My Christmas Shopping"](https://medium.com/@Micheal-Lanham/i-let-5-ai-agents-do-my-christmas-shopping-heres-what-actually-happened-11a75729e38b) | 2025-12-22 | b (mixed) | $100 is a preset; "keto" and "history buff" are judgement about another person |

**Count:** a = 15, b = 12 (12 / 27 = **44%**).
**Sensitivity:** if the 4 "mixed" rules are counted as presets, b = 8 / 27 = **30%**, just under the one-third line. So the result depends on whether a cap that lets through unwanted purchases counts as "fitting a preset". By the brief's own definition ("only if…", refundability, gifts → b), it doesn't, so the headline is 44%.

**Verdict: GO, but narrowly.** The judgement share clears the one-third bar. Two honest caveats:
1. **The sample skews technical.** Most Reddit and HN voices are developers whose default is "cap it and approve everything", which is the a-type answer. The one consumer-facing source (Travel Anywhere's prompts) is almost all b. A wider consumer sample would likely raise b, but I can't prove it from this data.
2. **Many a-type answers are "always ask me".** That is Stripe Link's current model. They tell us people want a human tap, not that they want a rules layer. The product's value is in letting the b-type rules decide when the tap can be skipped, which is exactly the angle in the brief.

**Most common judgement rules (these become the eval focus):**
1. **Refundability and cancellation terms** (#11, #18, #22). Also the most common incident pattern: a $200 cancellation fee, non-refundable bookings.
2. **Hidden costs and the true total** (#19, plus incidents: a shipping fee misread as an item, a cancellation fee, prices changing at checkout).
3. **"Things I normally buy / don't already have"** (#1, #5, #14): routine vs unusual purchases.
4. **Gifts and other people** (#25, #26, #27): someone else's tastes, a deadline, substitutions.
5. **Merchant legitimacy** (#20, plus the fake-Walmart incident in `incidents.md`).

Items 1, 2 and 4 already exist as eval categories in the plan. Items 3 and 5 are not separate categories; I'd fold them into "ambiguous (should ask)" and "prompt injection / fake listings" rather than add categories now.

**Supporting numbers (context, not rules):**
- ACI Worldwide survey of 2,000+ UK adults: only 19% trust AI assistants to follow rules for everyday purchases; 60% would stop using a shopping agent after one mistake ([letsdatascience summary](https://letsdatascience.com/news/aci-survey-finds-limits-on-ai-shopping-autonomy-710dc1a1), 2026).
- Expedia Group / YouGov (5,700+ adults, US/UK/India, March 2026): 8% comfortable booking through an AI platform; 66% would not trust an AI assistant to book for them (via [Travel Anywhere](https://www.travelanywhere.blog/blog/ai-travel-booking-safety-prompts-2026-stop-overspending), 2026-08-27).
- Accenture (25,590 people, 16 countries): 9% would allow fully autonomous buying including payment (via web search summary, 2026).

## Not counted: non-payment rules (out of scope, as the brief says)

| Rule (their words) | Source | Date |
|---|---|---|
| "Sending a home address should need its own confirmation: this address, to this person, in this exact message." | [Reddit r/technology](https://www.reddit.com/r/technology/comments/1wst3gu/a_youtuber_says_metas_muse_gave_his_address_to_a/pcqb73i/) | 2026-09-29 |
| Seller expected Muse to "still send approvals to accept offers later down the line" after choosing "Allow Always" (selling, not buying) | [The Guardian](https://www.theguardian.com/technology/2026/sep/28/metas-ai-agent-muse-home-address) | 2026-09-28 |
| "For account permissions i'd let it flag stuff for me to approve but never let it change anything on its own." | [Reddit r/AI_Agents](https://www.reddit.com/r/AI_Agents/comments/1vucq3o/ow_much_freedom_would_you_actually_give_an_ai/p5003t0/) | 2026-08-21 |

## What this changes for the build

- **Eval focus confirmed:** refund/cancellation wording, hidden fees, gifts/other people, injection and fake listings.
- **"Here's what I understood" matters more than expected.** The Muse "Allow Always" case is a rule-reading failure: the seller believed he had kept approvals on. That is the strongest real-world argument for Session 15's readback screen.
- **Explicit consent only.** Rule #21 matches the plan's decision that only the user's tap counts. No text from the agent or a listing can stand in for it.
