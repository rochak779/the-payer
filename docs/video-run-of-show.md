# The Payer: demo video run-of-show

The hackathon video (plan Session 14). **2:25.7 long, 1920 × 1080, 30 fps, H.264 + AAC**, made in code: a Remotion edit of real recordings of the app, cut to an original score that was also written in code. No voiceover; the words are on screen. Everything is in `video/`, a project of its own (its own `package.json`), so the app and Render never install it.

- **File:** `video/out/the-payer-demo.mp4` (not committed: rendered output). Captions: `video/out/the-payer-demo.srt`. Thumbnail: `video/out/the-payer-thumbnail.png` (1280 × 720).
- **Sound:** -13.9 LUFS integrated, true peak -2.0 dBTP, loudness range 4.1 LU (EBU R128, measured on the final file). AAC 320 kb/s, 48 kHz stereo.
- **Licences:** Remotion's licence is free for individuals (a paid company licence applies only to companies above a small headcount); Rochak is an individual. Satoshi is loaded from Fontshare's CDN at render time, never committed (ITF FFL). Inter and JetBrains Mono come from Google Fonts (SIL OFL). Tone.js is MIT. The music and every sound effect are original, synthesised in code: no samples, loops or third-party audio.

## The beats

Times are where each beat starts. Every beat starts on a bar line of the music (124 BPM, so a bar is 1.94 s) and the stamps, taps and refusals land on beats. The dock at the top (the app's own ink dock, numbered 1–8) shows where the story is.

| Time | Beat | On screen | Judging criterion |
|---|---|---|---|
| 0:00.0 | 1. Hook | "AI agents can shop for you." "Would you let one pay without asking?" Then a yellow field: "Only 3% would." with "An October 2026 survey of 11,000 consumers". A build, a gap, then the drop. | Impact |
| 0:15.5 | 2. Promise | On the drop: "PayPal made shops agent-ready." "The Payer makes buyers agent-safe." The wordmark, "Spending rules for your AI shopping agent", and the three verdict stamps landing on the beat. | Idea |
| 0:27.1 | 3. Rules | The Rules screen: "Show me what you understood", the AI reads the four rules back, zoom on "Here's what I understood", then Save. "Hard limits are checked by code. Judgement calls are checked by AI." | Design, Technology |
| 0:38.7 | 4. The mug | The task typed out; the agent runs; the receipt slides in and Approved lands (stamp on the beat); punch-in on **$12**; "Paid $12, once, for this purchase only." (register sound). | Technology |
| 0:50.3 | 4b. PayPal's record | A card built from PayPal's sandbox API for that purchase: order `5HK74664W0829772V` COMPLETED, hold `4BS156651G170202M` CAPTURED $12.00, capture `72B64000K3396642N` COMPLETED $12.00 USD; "1 hold · 1 capture · exactly $12.00". Next to it, the app's Activity log with the same capture id highlighted. | Technology |
| 0:58.1 | 5. The present | "Buy a wooden building blocks set for my nephew's birthday, about $40": Asking you, with the AI's reason; Review in Approvals; one tap on Approve, the stamp turns to Approved; Activity shows it paid ($38). | Design |
| 1:13.5 | 6. The headphones | "Buy wireless headphones under $80": Blocked. Close-up on the AI check: "The headphones are listed as refurbished, which violates the rule to only buy new items." | Innovation |
| 1:21.3 | 7. The shop tries it on | Second drop. "Shop asks for $20 more", "Another shop asks", "Shop asks again": each pressed in the app, each line "declined" in the log, each a Refused stamp on the beat. Then: "On its own, PayPal lets a shop take up to 15% more than was held (capped at $75)." "Your mandate holds it to the penny." | Innovation |
| 1:36.8 | 8. The off switch | Breakdown: the music stops with the switch. A waiting purchase becomes Cancelled; "Agent turned off. 1 open purchase(s) cancelled."; a new task stops at once ("The agent is turned off, so it won't shop."). | Impact |
| 1:48.4 | 9. Live | The build back. The Gemini agent shops real US listings through Channel3, the checker approves, and PayPal's sandbox holds and pays $5.95. Captioned "Live: Channel3 + PayPal sandbox · shop names blurred". | Technology |
| 2:00.0 | 10. Evals | Third drop. 67 labelled purchase requests, 10 fixed rules. Wrong approvals: keyword rules 17, The Payer's AI checker 0–1 per run. 17 held-out cases: 14/17 right with 0 wrong approvals in both runs; keyword rules 9/17 with 5 wrong approvals. The app's own Evals screen alongside. | Innovation |
| 2:11.6 | 11. Outro | "Your rules, in plain English. Never a cent more than you approved." Built on PayPal (Orders v2 + Vault, sandbox) · Gemini 3.5 Flash-Lite · Channel3 · Render; Built with Claude Code. Final card: https://the-payer.onrender.com and github.com/rochak779/the-payer, with an Approved stamp. The music resolves to A major. | Presentation |

## What's real, what's sped up, what's blurred

- **Every app shot is a real recording** of the app running locally, made by `video/scripts/record.mjs` (Playwright, Chrome's screencast at 3× pixel density, so close-ups stay sharp). Beats 3–8 and 10 use `SEARCH=fixtures SHOPPER=scripted CHECKER=gemini PARSER=gemini PAYMENTS=paypal`: the fictional shops and the scripted agent keep the content the same every take, while the rule reader, the checker and the payments are real (Gemini and PayPal's sandbox). Beat 9 uses `SEARCH=channel3 SHOPPER=gemini` (all live).
- **Waits are sped up and say so.** While the app waits for Gemini or PayPal, the recording runs fast and the phone shows a "Sped up" tag. Elsewhere it plays at about real speed, nudged so moments land on the beat. Nothing is reordered within a shot.
- **The tap marker** (a yellow disc with an ink ring) is drawn into the page during recording to show where a person taps.
- **PayPal's record (beat 4b)** was read from PayPal's sandbox API, read-only, right after the mug purchase: `video/scripts/paypal-record.mjs <hold id>` (hold → its order → the order with every hold and capture). Only ids, statuses and amounts were saved, in `video/src/data/paypal-record.json`. Nobody can log in at sandbox.paypal.com (BRIEF.md), so the API is the honest view of PayPal's side. It was read after the three refused tries in beat 7, and the order still had exactly one capture.
- **Live shop and brand names are blurred in the page itself** during the live recording (a CSS text blur on the search results, the agent's steps, and the receipt's title, shop and reason), so no frame of the raw recording holds a legible name. Kept clear: the lead words ("Searched:"), the verdict stamp, the amount and "PayPal, held $5.95". The clip's data file keeps only times and boxes, no text. Checked frame by frame at 2× zoom.
- **The present's payment (beat 5):** in that take, PayPal's "took $38" log line sits under the app's dock, so the shot shows "Brick & Bolt Toys · paid", "PayPal, held $38" and "Charge of $38 at Brick & Bolt Toys approved." The data has the completed capture.
- **No third-party marks:** sponsor names appear only as plain text, with no logos. The fixture shops (Hearth & Kiln, Brick & Bolt Toys, Second Spin Audio) and "Totally Legit Electronics Ltd" are fictional.

## The music: "Held to the Penny"

Original, composed in code with Tone.js (`video/music/score.js`) and rendered offline in headless Chromium (`video/music/render.mjs`). A minor, **124 BPM**, 74 bars plus a 2.5 s tail, arranged bar for bar to the story map in `video/src/timing.ts`:

- **Hook (bars 0–8):** tension. A sub drone and a filtered pad open up slowly; a ticking pluck on each beat while the question is asked; a half-time heartbeat kick on "3%" with an impact; a 4-bar noise and pitch riser and a speeding snare roll; half a beat of silence.
- **Promise (8–14), the drop:** impact, four-on-the-floor kick, claps, sixteenth hats, a rolling saw bass over a sine sub, chord stabs on the off-beats, all pumped by the kick (sidechain-style ducking), and the lead hook (a supersaw doubled by an FM bell).
- **Rules, mug (14–26):** driving verses: arpeggio through a dotted-eighth echo, stabs; the lead returns for the mug.
- **PayPal's record (26–30):** a lift: Fmaj9, G6, Am9, E7.
- **Present, headphones (30–42):** a warmer turn (Fmaj9, G6, Em7), then a darker E7♭9 build into the second drop.
- **Shop (42–50):** the second drop.
- **Off switch (50–56):** the band cuts out at the moment the switch is pressed (beat 4 of the section); a pad and a soft FM pluck carry the breakdown.
- **Live (56–62):** the build back: the kick enters muffled and opens up, the bass returns, a long riser and snare roll.
- **Evals (62–68):** the third drop.
- **Outro (68–74):** the progression climbs Fmaj9, G6, Asus2 and resolves to A major; a final hit and a long tail.

Harmony: Am9, Dm9, Fmaj9, E7sus4 → E7, voiced to move by step. Every drum, bass, chord, riser and impact is synthesised; reverbs are convolvers over seeded noise tails, so each render is identical.

**Sound effects** (`video/music/sfx.js`, also synthesised, rendered to separate files and placed on the beat by the edit): a stamp thud (low thud, paper slap, wooden knock) on each verdict; a "deny" thud with a low buzz on each refused charge; a cash-register tick and two-note bell on each payment; whooshes on transitions; a soft tap on each row of PayPal's record; a power-down on the off switch.

**Mastering:** the edit's mix (score plus effects) is mastered by `video/scripts/master.mjs`: a gain and gentle limiter, then two-pass ffmpeg `loudnorm` to -14 LUFS integrated with a true-peak ceiling of -1.5 dBTP, then AAC at 320 kb/s. The final file is measured again (EBU R128 with true peak), and the script fails if the true peak is above -1 dBTP or the length isn't under 3 minutes.

**Swapping in a licensed track:** change one line, `MUSIC_FILE` in `video/src/config.ts`, to the track's file in `video/public/`. It must be 124 BPM with its first downbeat at 0:00 for the cuts to stay on the beat. The effects are separate files, so they stay.

## How to re-render

From `video/` (Node 22.9+; `npm install` first):

1. **Record** (only if the app's look or content changed): from the repo root, `npm run seed && npm run build`, then start the app with `SEARCH=fixtures SHOPPER=scripted CHECKER=gemini PARSER=gemini PAYMENTS=paypal PORT=3100 npx next start`. In `video/`: `npm run record`. For beat 9, restart the app with `SEARCH=channel3 SHOPPER=gemini` (same other switches) and run `LIVE=1 npm run record`. The recorder refuses takes with the wrong outcome ("RETAKE: …"). A failed take can leave a pending purchase in `data/db.json`; remove it before retrying. Then read PayPal's record: `node --env-file=../.env.local scripts/paypal-record.mjs <the mug's hold id> --out src/data/paypal-record.json` (the hold id is the mug's `payment.id` in `data/db.json`).
2. **Music:** `npm run music` (about 4 minutes; `--stems` also writes each group alone for level checks).
3. **Film:** `npm run render` writes `out/the-payer-demo.mp4` and prints its length and loudness. `npm run render:draft` makes `out/draft.mp4` the same way.
4. **Thumbnail and captions:** `npm run thumbnail`, `npm run srt`.
5. **Preview:** `npm run studio`.

The recordings (`public/rec/`), the rendered audio (`public/music/`, `public/sfx/`) and `out/` are git-ignored; the clip data (`src/rec/*.json`: marks, event times, scroll) is committed, so the edit's cuts follow the app's real moments. Gemini's free tier was slow during recording (a checker call once took 50 s), so a take can need a retry.

## Checks done

- Length under 3 minutes (`ffprobe`), 1920 × 1080, 30 fps.
- Loudness and true peak measured on the final file (EBU R128): -13.9 LUFS, -2.0 dBTP; the second loudnorm pass was linear (one fixed gain, no pumping).
- Frames every 0.5 s of a full-resolution draft (291 frames) inspected once for brand names or logos, typos, text too small, and anything off the visual language. Two problems, fixed in one batch before the final render: the evals bars overlapped the source line, and the live beat showed the wrong moment of its long clip (Remotion clamps a frozen video frame to the film's length; the clip time now goes in `trimBefore`).
- The drop's cut and the music's impact land within one frame of each other (15.47 s and 15.49 s): every section starts on the beat grid in `video/src/timing.ts`.
- Captions in the body copy are 44–52 px; small labels (the dock, tags, the source line) are 26–40 px.

## For Rochak before uploading

- Watch it once with sound on: the music and effects were checked by measurement, not by ear.
- YouTube: upload `the-payer-demo.mp4` as Public, add `the-payer-demo.srt` as English captions, and set `the-payer-thumbnail.png` as the thumbnail. Then put the link in the README and in `docs/devpost.md` (`VIDEO_URL_TBD`, 3 places) and on Devpost (plan Session 14 Step 4).
- `docs/devpost.md`'s Presentation paragraph mentions "connecting PayPal"; the cut doesn't show connecting (the demo buyer is pre-connected, and the Ask screen says so). Edit that paragraph to match before pasting.
