// Records The Payer, one clip per story beat, for the Remotion edit.
//
// Frames come from Chrome's screencast at 3x pixel density (so the edit can zoom in and stay sharp),
// then each clip is encoded to public/rec/<clip>.mp4 at a constant 30 fps. Timed marks with element
// boxes go to src/rec/<clip>.json, so the edit cuts and zooms on real moments, not guesses.
//
// Run the app first (from the repo root, after `npm run seed` and `npm run build`):
//   SEARCH=fixtures SHOPPER=scripted CHECKER=gemini PARSER=gemini PAYMENTS=paypal PORT=3100 npx next start
// then, from video/:  node scripts/record.mjs                (the fixture beats, in story order)
//   or for beat 9:   LIVE=1 node scripts/record.mjs          (against a server with SEARCH=channel3 SHOPPER=gemini)
// CLIPS=rules,mug picks clips. BASE changes the app address. Real shop names are blurred in the page
// itself during the live clip, so no frame of the raw recording holds a legible one.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE ?? 'http://localhost:3100';
const LIVE = process.env.LIVE === '1';
const TMP = process.env.REC_TMP ?? path.join(os.tmpdir(), 'the-payer-rec');
const VW = 420, VH = 880, DSF = 3; // a phone-sized viewport; 1260 x 2640 frames
const FPS = 30;
const DOCK = 92; // the sticky dock covers the bottom of the viewport

const FIXTURE_CLIPS = ['rules', 'mug', 'paid', 'nephew', 'headphones', 'shop', 'off', 'evals'];
const wanted = (process.env.CLIPS ?? (LIVE ? 'live' : FIXTURE_CLIPS.join(','))).split(',');

// ---------- In-page overlay: a tap marker in the app's own look, and the live blur ----------
const OVERLAY = `(${function overlay(live) {
  const css = `
    #rec-tap{position:fixed;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
      background:rgba(255,202,73,.55);border:2.5px solid #1c1c1c;box-shadow:3px 3px 0 #1c1c1c;
      z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .25s ease, width .12s ease, height .12s ease, margin .12s ease, box-shadow .12s ease}
    #rec-tap.on{opacity:1}
    #rec-tap.down{width:36px;height:36px;margin:-18px 0 0 -18px;box-shadow:0 0 0 #1c1c1c;background:rgba(255,202,73,.85)}
    .rec-ring{position:fixed;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid #1c1c1c;
      z-index:2147483646;pointer-events:none;animation:rec-ring .55s cubic-bezier(.16,1,.3,1) forwards}
    @keyframes rec-ring{to{transform:scale(2.6);opacity:0}}
    ${live ? `
    /* Live clip: real shop and brand names are unreadable. Lead words, stamps, amounts and payment lines stay. */
    section[aria-label="Agent progress"] ol > li > p,
    section[aria-label="Agent progress"] ol > li.pl-10,
    section[aria-label="Agent progress"] ol > li.pl-10 a,
    section[aria-label="Agent progress"] article h3,
    section[aria-label="Agent progress"] article h3 + p,
    section[aria-label="Agent progress"] article ul li > span.min-w-0,
    section[aria-label="Agent progress"] article .space-y-3 > p {
      color: transparent !important; text-shadow: 0 0 11px rgba(28,28,28,.95) !important; }
    section[aria-label="Agent progress"] article h3 { text-shadow: 0 0 15px rgba(28,28,28,.95) !important; }
    section[aria-label="Agent progress"] ol > li > p > span.font-bold { color: #1c1c1c !important; text-shadow: none !important; }
    ` : ''}
  `;
  let x = 330, y = 760;
  const log = (e) => { try { window.__recLog && window.__recLog(e); } catch {} };
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  function mount() {
    if (document.getElementById('rec-style')) return;
    const st = document.createElement('style'); st.id = 'rec-style'; st.textContent = css; document.head.appendChild(st);
    const t = document.createElement('div'); t.id = 'rec-tap'; document.body.appendChild(t);
    t.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    // Exact times for the edit: a stamp or an agent step appearing.
    new MutationObserver((records) => {
      for (const r of records) for (const n of r.addedNodes) {
        if (!(n instanceof Element)) continue;
        for (const el of [n, ...n.querySelectorAll('.stamp')]) if (el.classList && el.classList.contains('stamp')) log({ type: 'stamp', text: el.textContent, box: rect(el) });
        if (n.matches && n.matches('section[aria-label="Agent progress"] ol > li')) log({ type: 'step', text: n.textContent.slice(0, 50), box: rect(n) });
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  window.__rec = {
    show(on) { mount(); document.getElementById('rec-tap').classList.toggle('on', on); },
    glide(nx, ny, ms) {
      mount(); const t = document.getElementById('rec-tap');
      t.style.transition = 'opacity .25s ease, width .12s ease, height .12s ease, margin .12s ease, box-shadow .12s ease, transform ' + ms + 'ms cubic-bezier(.45,0,.2,1)';
      t.style.transform = 'translate(' + nx + 'px,' + ny + 'px)'; x = nx; y = ny;
    },
    /** Live clip: keep the newest step in view as the agent works, the way a person would scroll. */
    follow(on) {
      if (window.__recFollow) { clearInterval(window.__recFollow); window.__recFollow = null; }
      if (!on) return;
      window.__recFollow = setInterval(() => {
        const items = document.querySelectorAll('section[aria-label="Agent progress"] ol > li');
        const lastItem = items[items.length - 1]; if (!lastItem) return;
        const b = lastItem.getBoundingClientRect(); const limit = innerHeight - 110;
        if (b.bottom > limit + 4) window.scrollBy({ top: Math.min(b.bottom - limit, b.top - 90), behavior: 'smooth' });
      }, 200);
    },
    press(down) {
      const t = document.getElementById('rec-tap'); t.classList.toggle('down', down);
      if (down) log({ type: 'press', box: { x, y, w: 0, h: 0 } });
      if (down) { const r = document.createElement('div'); r.className = 'rec-ring'; r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }
    },
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount); else mount();
}})(${JSON.stringify(LIVE)})`;

// ---------- Browser and screencast ----------
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'public/rec'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'src/rec'), { recursive: true });

// The pixel density comes from Chrome's own flag, not Playwright's emulation: only then does the
// screencast deliver full-density frames (emulated density gives 420 x 880 frames).
const browser = await chromium.launch({ headless: true, args: [`--force-device-scale-factor=${DSF}`, `--window-size=${VW},${VH}`] });
const context = await browser.newContext({
  viewport: null, locale: 'en-GB', timezoneId: 'Europe/London', colorScheme: 'light', reducedMotion: 'no-preference',
});
await context.addInitScript(OVERLAY);
const page = await context.newPage();
await page.exposeFunction('__recLog', (e) => {
  if (!clip) return;
  const box = e.box ? Object.fromEntries(Object.entries(e.box).map(([k, v]) => [k, +v.toFixed(1)])) : undefined;
  // Live listings name real brands and shops: their text never leaves the page (only times and boxes do).
  const keepText = e.text && !LIVE;
  clip.events.push({ type: e.type, t: +(now() - clip.t0).toFixed(3), ...(keepText ? { text: e.text } : {}), ...(box ? { box } : {}) });
});
const cdp = await context.newCDPSession(page);

let clip = null;
let last = null; // the latest frame, so a clip that starts on a still screen has a first frame
let clockOffset = Infinity; // wall clock minus Chrome's frame clock, smallest seen (seconds)
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  const wall = Date.now() / 1000;
  clockOffset = Math.min(clockOffset, wall - metadata.timestamp);
  last = { data, t: metadata.timestamp, scrollY: metadata.scrollOffsetY };
  if (clip) clip.frames.push(save(data, metadata.timestamp, metadata.scrollOffsetY));
});
function save(data, t, scrollY) {
  const file = path.join(clip.dir, `${String(clip.frames.length).padStart(5, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return { file, t, scrollY: Math.round(scrollY ?? 0) };
}
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: VW * DSF, maxHeight: VH * DSF, everyNthFrame: 1 });

const now = () => Date.now() / 1000 - clockOffset; // on Chrome's frame clock
const pause = (ms) => page.waitForTimeout(ms);

function startClip(name) {
  const dir = path.join(TMP, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  clip = { name, dir, frames: [], marks: [], events: [], t0: now() };
  if (last) clip.frames.push(save(last.data, clip.t0, last.scrollY));
  console.log(`● ${name}`);
}

async function box(loc) {
  const b = await loc.boundingBox({ timeout: 1500 }).catch(() => null); // missing boxes are simply left out
  return b ? { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } : null;
}
/** A named moment in the clip, with the boxes (viewport CSS px) of anything the edit may zoom to. */
async function mark(label, boxes = {}) {
  const t = now() - clip.t0;
  const out = {};
  for (const [k, loc] of Object.entries(boxes)) out[k] = await box(loc);
  clip.marks.push({ label, t: +t.toFixed(3), boxes: out });
  console.log(`  ${t.toFixed(2)}s ${label}`);
}

async function endClip() {
  await pause(400);
  const c = clip; clip = null;
  const end = now();
  // A constant 30 fps list: each output frame shows the latest screencast frame at or before its time.
  const n = Math.ceil((end - c.t0) * FPS);
  const list = [];
  const scroll = []; // [clip seconds, page scroll in CSS px] whenever it changes, so the edit can follow page content
  for (let k = 0, j = 0; k < n; k++) {
    const t = c.t0 + k / FPS;
    while (j + 1 < c.frames.length && c.frames[j + 1].t <= t) j++;
    list.push(`file '${c.frames[j].file}'\nduration ${(1 / FPS).toFixed(6)}`);
    if (!scroll.length || scroll.at(-1)[1] !== c.frames[j].scrollY) scroll.push([+(k / FPS).toFixed(3), c.frames[j].scrollY]);
  }
  list.push(`file '${c.frames.at(-1).file}'`);
  const listFile = path.join(c.dir, 'frames.txt');
  fs.writeFileSync(listFile, list.join('\n') + '\n');
  const mp4 = path.join(ROOT, 'public/rec', `${c.name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', 'format=yuv420p', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-movflags', '+faststart', mp4]);
  const duration = +(end - c.t0).toFixed(3);
  fs.writeFileSync(path.join(ROOT, 'src/rec', `${c.name}.json`),
    JSON.stringify({ clip: c.name, viewport: { w: VW, h: VH, dsf: DSF }, fps: FPS, duration, marks: c.marks, events: c.events, scroll }, null, 2) + '\n');
  if (process.env.KEEP !== '1') fs.rmSync(c.dir, { recursive: true, force: true });
  console.log(`  → ${path.relative(ROOT, mp4)} (${duration}s, ${c.frames.length} frames)`);
}

// ---------- Human-paced input ----------
async function scrollBy(dy) {
  if (Math.abs(dy) < 4) return;
  await page.evaluate((dy) => window.scrollBy({ top: dy, behavior: 'smooth' }), dy);
  await pause(Math.min(1100, 450 + Math.abs(dy)));
}
/** Scrolls so the element sits comfortably in view, above the dock. */
async function reveal(loc, { top = 96, bottom = VH - DOCK - 24 } = {}) {
  await loc.waitFor({ state: 'visible' });
  const b = await loc.boundingBox();
  if (!b) throw new Error('not visible');
  if (b.y < top) await scrollBy(b.y - top);
  else if (b.y + b.height > bottom) await scrollBy(Math.min(b.y - top, b.y + b.height - bottom));
}
async function tap(loc, { after = 450 } = {}) {
  await reveal(loc);
  const b = await loc.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const from = await page.evaluate(() => { const t = document.getElementById('rec-tap'); const m = t && t.style.transform.match(/translate\(([-\d.]+)px, ?([-\d.]+)px\)/); return m ? [+m[1], +m[2]] : [330, 760]; });
  const ms = Math.round(Math.min(720, Math.max(380, Math.hypot(x - from[0], y - from[1]) * 1.4)));
  await page.evaluate(([x, y, ms]) => { window.__rec.show(true); window.__rec.glide(x, y, ms); }, [x, y, ms]);
  await pause(ms + 60);
  await page.mouse.move(x, y); // hover: the button lifts on its offset
  await pause(260);
  await page.evaluate(() => window.__rec.press(true));
  await page.mouse.down();
  await pause(110);
  await page.mouse.up();
  await page.evaluate(() => window.__rec.press(false));
  await pause(after);
}
/** Moves the tap marker out of the way; the real mouse goes to a corner so nothing stays hovered. */
async function park(x = 352, y = 700) {
  await page.evaluate(([x, y]) => window.__rec.glide(x, y, 600), [x, y]);
  await page.mouse.move(2, 2);
  await pause(620);
}
const hideTap = () => page.evaluate(() => window.__rec.show(false));
async function go(p) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__rec.show(false));
  await pause(500);
}
const tab = (name) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: new RegExp('^' + name) });
const runEnd = () => page.getByRole('link', { name: /Review in Approvals|See it in the activity log/ }).waitFor({ timeout: 240_000 });
const lastReceipt = () => page.locator('section[aria-label="Agent progress"] article').last();
const activityEntry = (text) => page.locator('article').filter({ hasText: text }).first();

/** Sends one of the suggested tasks, the way a person would: tap the suggestion, then Send. */
async function sendTask(task) {
  await tap(page.getByRole('button', { name: task, exact: true }), { after: 650 });
  await mark('tap-send', { send: page.getByRole('button', { name: 'Send to agent' }) });
  await tap(page.getByRole('button', { name: 'Send to agent' }), { after: 200 });
  await park(380, 520);
  await hideTap();
  await page.evaluate(() => window.__rec.follow(true));
  await mark('working');
}
/** Waits for the run to finish and the page to settle, then stops following. */
async function settle() {
  await runEnd();
  await page.getByText('Working…', { exact: true }).waitFor({ state: 'hidden', timeout: 240_000 });
  await pause(900);
  await page.evaluate(() => window.__rec.follow(false));
}

// ---------- The beats ----------
const MUG = 'Buy a plain white ceramic coffee mug, under $15';
const NEPHEW = "Buy a wooden building blocks set for my nephew's birthday, about $40";
const HEADPHONES = 'Buy wireless headphones under $80';

const CLIPS = {
  // Beat 3: rules in plain English, read back by the AI before anything is saved.
  async rules() {
    await go('/rules');
    startClip('rules');
    await mark('start', { title: page.getByRole('heading', { name: 'Your rules' }), field: page.locator('#rules-text') });
    await pause(1400);
    await tap(page.getByRole('button', { name: 'Show me what you understood' }), { after: 100 });
    await park(380, 820);
    await hideTap();
    await mark('reading');
    await page.getByRole('button', { name: 'Save these rules' }).waitFor({ timeout: 90_000 });
    await mark('preview');
    const text = await page.locator('section[aria-live="polite"]').innerText();
    const kinds = { code: (text.match(/checked by code/g) || []).length, ai: (text.match(/checked by AI/g) || []).length };
    if (kinds.code !== 2 || kinds.ai !== 2) throw new Error('RETAKE: the rules were read differently:\n' + text);
    await pause(300);
    const heading = page.getByRole('heading', { name: /understood/ });
    await reveal(heading, { top: 70 });
    await pause(500);
    await mark('preview-shown', { heading, list: page.locator('section[aria-live="polite"] article'), items: page.locator('section[aria-live="polite"] article li').first() });
    await pause(2600);
    await tap(page.getByRole('button', { name: 'Save these rules' }), { after: 200 });
    await page.getByText('Saved. The agent uses these from now on.').waitFor({ timeout: 30_000 });
    await mark('saved', { note: page.getByText('Saved. The agent uses these from now on.') });
    await park();
    await pause(1400);
    await endClip();
  },

  // Beat 4: the mug is approved, held and paid exactly the price.
  async mug() {
    await go('/ask');
    startClip('mug');
    await mark('start', { title: page.getByRole('heading', { name: /Ask the/ }), strip: page.getByText('Using the demo PayPal buyer (sandbox).') });
    await pause(1200);
    await sendTask(MUG);
    await settle();
    const r = lastReceipt();
    await mark('decided', { receipt: r, stamp: r.locator('.stamp'), amount: r.locator('p.font-display') });
    if (!(await page.getByRole('link', { name: /See it in the activity log/ }).isVisible())) throw new Error('RETAKE: the mug was not approved');
    const paidLine = page.getByText(/^Paid \$12(\.00)?, once, for this purchase only\.$/);
    if (!(await paidLine.isVisible())) throw new Error('RETAKE: the mug was not paid');
    await reveal(paidLine, { bottom: VH - DOCK - 70 });
    await pause(400);
    await mark('paid', {
      receipt: r, stamp: r.locator('.stamp'), amount: r.locator('p.font-display'), head: r.locator('h3'),
      payment: r.getByText(/PayPal, held/), paidLine,
    });
    await pause(3200);
    await endClip();
  },

  // Beat 4, PayPal side: Activity shows PayPal's capture id for the mug, next to the "PayPal's record" card.
  async paid() {
    await go('/activity');
    startClip('paid');
    const e = activityEntry('White stoneware mug');
    const took = e.getByText(/PayPal took \$12(\.00)? \(capture/);
    await reveal(took, { bottom: VH - DOCK - 40 });
    await pause(300);
    await mark('start', { entry: e, took, stamp: e.locator('.stamp'), amount: e.locator('p.font-display'), head: e.locator('h3') });
    await pause(4200);
    await endClip();
  },

  // Beat 5: the nephew's present asks first; one tap approves it, and it's paid.
  async nephew() {
    await go('/ask');
    startClip('nephew');
    await mark('start');
    await pause(700);
    await sendTask(NEPHEW);
    await settle();
    const r = lastReceipt();
    if (!(await page.getByRole('link', { name: /Review in Approvals/ }).isVisible())) throw new Error('RETAKE: the present did not ask');
    await reveal(page.getByRole('link', { name: /Review in Approvals/ }), { bottom: VH - DOCK - 30 });
    await pause(300);
    await mark('asked', { receipt: r, stamp: r.locator('.stamp'), reasons: r.locator('ul'), review: page.getByRole('link', { name: /Review in Approvals/ }), badge: page.getByLabel(/waiting/) });
    await pause(2200);
    await tap(page.getByRole('link', { name: /Review in Approvals/ }), { after: 100 });
    await page.getByRole('button', { name: 'Approve', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await pause(700);
    const a = page.locator('article').first();
    await mark('approvals', { receipt: a, stamp: a.locator('.stamp'), why: a.getByText('Asking because:'), reasons: a.locator('ul'), approve: page.getByRole('button', { name: 'Approve', exact: true }) });
    await pause(2400);
    await tap(page.getByRole('button', { name: 'Approve', exact: true }), { after: 0 });
    await mark('approved', { receipt: a, stamp: a.locator('.stamp') });
    await page.getByText('Nothing to approve.').waitFor({ timeout: 60_000 });
    await mark('empty');
    await pause(900);
    await tap(tab('Activity'), { after: 100 });
    await page.getByRole('switch').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await park(360, 640);
    const e = activityEntry('Building blocks race car set');
    const took = e.getByText(/PayPal took \$38(\.00)? \(capture/);
    if (!(await took.isVisible())) throw new Error('RETAKE: the present was not paid');
    await mark('paid', { entry: e, took, stamp: e.locator('.stamp'), amount: e.locator('p.font-display'), head: e.locator('h3') });
    await pause(2600);
    await endClip();
  },

  // Beat 6: refurbished headphones are blocked, with the reason.
  async headphones() {
    await go('/ask');
    startClip('headphones');
    await mark('start');
    await pause(700);
    await sendTask(HEADPHONES);
    await settle();
    const r = lastReceipt();
    const text = await r.innerText();
    if (!/Blocked/.test(text) || !/refurbished/i.test(text)) throw new Error('RETAKE: the headphones were not blocked as refurbished:\n' + text);
    await reveal(r, { bottom: VH - DOCK - 20 });
    await pause(300);
    await mark('blocked', { receipt: r, stamp: r.locator('.stamp'), reasons: r.locator('ul').first().or(r.locator('.space-y-3 > p')).first(), amount: r.locator('p.font-display') });
    await pause(3600);
    await endClip();
  },

  // Beat 7: the shop tries it on. Each attempt is refused by the payment check before PayPal is called.
  async shop() {
    await go('/activity');
    const e = activityEntry('White stoneware mug');
    await reveal(e.getByText('Demo: what if…'), { top: 120, bottom: VH - DOCK - 10 });
    await page.evaluate(() => window.scrollBy(0, 0));
    startClip('shop');
    await mark('start', { entry: e, buttons: e.locator('form'), explainer: e.getByText(/On its own, PayPal lets a shop/), logs: e.locator('ol') });
    await pause(1200);
    const lines = () => e.locator('ol li');
    for (const [i, name] of [['1', /^Shop asks for \$20(\.00)? more$/], ['2', 'Another shop asks'], ['3', 'Shop asks again']]) {
      const before = await lines().count();
      await tap(e.getByRole('button', { name }), { after: 0 });
      await mark(`tap-${i}`);
      await page.waitForFunction(([n]) => {
        const art = [...document.querySelectorAll('article')].find((a) => a.textContent.includes('White stoneware mug'));
        return art && art.querySelectorAll('ol li').length > n;
      }, [before], { timeout: 60_000 });
      const line = lines().last();
      const said = await line.innerText();
      if (!/declined/.test(said)) throw new Error('RETAKE: a demo charge was not declined: ' + said);
      await mark(`refused-${i}`, { line, logs: e.locator('ol'), buttons: e.locator('form'), entry: e });
      await pause(1700);
    }
    await park(360, 300);
    await hideTap();
    await mark('explainer', { explainer: e.getByText(/On its own, PayPal lets a shop/), buttons: e.locator('form'), logs: e.locator('ol') });
    await pause(2600);
    await endClip();
  },

  // Beat 8: the off switch. A waiting purchase is cancelled, and a new task stops at once.
  async off() {
    await go('/ask');
    startClip('off');
    await mark('start');
    await pause(500);
    await sendTask(NEPHEW);
    await settle();
    if (!(await page.getByRole('link', { name: /Review in Approvals/ }).isVisible())) throw new Error('RETAKE: the second present did not ask');
    await mark('waiting', { badge: page.getByLabel(/waiting/), receipt: lastReceipt(), stamp: lastReceipt().locator('.stamp') });
    await pause(1500);
    await tap(tab('Activity'), { after: 100 });
    await page.getByRole('switch').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await pause(600);
    const sw = page.getByRole('switch');
    const waitingEntry = page.locator('article').first();
    await mark('activity', { switch: sw, panel: sw.locator('xpath=ancestor::div[contains(@class,"rounded-[4px]")][1]'), chip: page.getByText('Agent on', { exact: true }), entry: waitingEntry, stamp: waitingEntry.locator('.stamp'), badge: page.getByLabel(/waiting/) });
    await pause(1600);
    await tap(sw, { after: 0 });
    await mark('tap-switch');
    await page.getByText('Agent is turned off', { exact: true }).waitFor({ timeout: 30_000 });
    await page.locator('article').first().locator('.stamp-cancelled').waitFor({ timeout: 30_000 });
    await pause(500);
    const cancelled = page.locator('article').first();
    await mark('off', { chip: page.getByText('Agent is turned off', { exact: true }), panel: sw.locator('xpath=ancestor::div[contains(@class,"rounded-[4px]")][1]'), entry: cancelled, stamp: cancelled.locator('.stamp'), head: cancelled.locator('h3') });
    await pause(1800);
    const other = page.getByText(/Agent turned off\. 1 open purchase\(s\) cancelled\./);
    await reveal(other, { bottom: VH - DOCK - 30 });
    await pause(300);
    await mark('cancelled-log', { line: other });
    await pause(1600);
    await tap(tab('Ask'), { after: 100 });
    await page.locator('#task').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await pause(500);
    await tap(page.getByRole('button', { name: MUG, exact: true }), { after: 500 });
    await mark('tap-send-off');
    await tap(page.getByRole('button', { name: 'Send to agent' }), { after: 0 });
    const stopped = page.getByText("The agent is turned off, so it won't shop. Turn it on in Activity.");
    await stopped.waitFor({ timeout: 30_000 });
    await mark('stopped', { line: stopped, chip: page.getByText('Agent is turned off', { exact: true }) });
    await park(360, 640);
    await hideTap();
    await pause(2600);
    await endClip();
    // Back on, off camera, so the app is left as it was found.
    await go('/activity');
    await page.getByRole('switch').click();
    await page.getByText('Agent on', { exact: true }).waitFor();
  },

  // Beat 10: the measured scores, as the app shows them.
  async evals() {
    await go('/evals');
    startClip('evals');
    await mark('start', { title: page.getByRole('heading', { name: /How well does the checker/ }), latest: page.locator('article').first() });
    await pause(2500);
    await scrollBy(260);
    await mark('table', { table: page.locator('table') });
    await pause(2000);
    await endClip();
  },

  // Beat 9: live. Gemini shops real US listings through Channel3 and pays in the PayPal sandbox. Names blurred in-page.
  async live() {
    await go('/ask');
    startClip('live');
    await mark('start');
    await pause(900);
    await sendTask(MUG);
    let firstFound = false;
    const found = page.locator('section[aria-label="Agent progress"] ol > li.pl-10').first();
    found.waitFor({ timeout: 120_000 }).then(() => { firstFound = true; }).catch(() => {});
    await settle();
    if (!firstFound) console.log('  (no search results seen before the end)');
    const r = lastReceipt();
    const paidLine = page.getByText(/^Paid \$[\d.,]+, once, for this purchase only\.$/);
    const paid = (await page.getByRole('link', { name: /See it in the activity log/ }).isVisible()) && (await paidLine.isVisible());
    console.log(`  OUTCOME ${paid ? 'approved and paid' : 'not paid: ' + (await r.locator('.stamp').innerText().catch(() => 'no decision'))}`);
    await reveal(paid ? paidLine : r, { bottom: VH - DOCK - 70 });
    await pause(300);
    await mark(paid ? 'paid' : 'decided', { receipt: r, stamp: r.locator('.stamp'), amount: r.locator('p.font-display'), payment: r.getByText(/PayPal, held/), steps: page.locator('section[aria-label="Agent progress"] ol') });
    await pause(2600);
    await endClip();
  },
};

try {
  for (const name of wanted) {
    if (!CLIPS[name]) throw new Error(`No clip called ${name}`);
    await CLIPS[name]();
  }
} catch (err) {
  console.error('FAILED:', err.message);
  await page.screenshot({ path: path.join(TMP, 'failure.png') });
  process.exitCode = 1;
} finally {
  await cdp.send('Page.stopScreencast').catch(() => {});
  await browser.close();
}
