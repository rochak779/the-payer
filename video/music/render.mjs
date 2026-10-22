// Renders the original score and the sound effects to WAV, offline, in headless Chromium.
//
//   node music/render.mjs            → public/music/score.wav (mastered) and public/sfx/*.wav
//   node music/render.mjs --stems    → also public/music/stems/*.wav, each group on its own, for level checks
//
// Tone.js runs in the page (music/score.js, music/sfx.js); the samples come back in chunks and are
// written here as 32-bit float WAV, then mastered with two-pass loudnorm (scripts/loudness.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import * as timing from '../src/timing.ts';
import { master, measure } from '../scripts/loudness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_MUSIC = path.join(ROOT, 'public/music');
const OUT_SFX = path.join(ROOT, 'public/sfx');
const stems = process.argv.includes('--stems');
fs.mkdirSync(OUT_MUSIC, { recursive: true });
fs.mkdirSync(OUT_SFX, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('  [page]', m.text()); });
page.on('pageerror', (e) => console.log('  [page error]', e.message));
await page.setContent('<!doctype html><title>score</title>');
// Seeded randomness, so noise sources render the same every time.
await page.evaluate(() => {
  let s = 7;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
});
await page.addScriptTag({ path: path.join(ROOT, 'node_modules/tone/build/Tone.js') });
await page.addScriptTag({ path: path.join(ROOT, 'music/score.js') });
await page.addScriptTag({ path: path.join(ROOT, 'music/sfx.js') });

const plainTiming = { BPM: timing.BPM, SECTIONS: timing.SECTIONS, TAIL_SECONDS: timing.TAIL_SECONDS, OFF_SWITCH_BEAT: timing.OFF_SWITCH_BEAT, SAMPLE_RATE: timing.SAMPLE_RATE };

/** Runs a render in the page, keeps the buffer there, and pulls it back in base64 chunks. */
async function pull(expr, args) {
  const info = await page.evaluate(async ([expr, args]) => {
    const buf = await window[expr](...args);
    const chans = buf.toArray();
    const L = chans[0], R = chans[1] ?? chans[0];
    const inter = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { inter[2 * i] = L[i]; inter[2 * i + 1] = R[i]; }
    window.__pcm = new Uint8Array(inter.buffer);
    return { bytes: window.__pcm.length, sampleRate: buf.sampleRate };
  }, [expr, args]);
  const parts = [];
  const CHUNK = 1 << 22;
  for (let off = 0; off < info.bytes; off += CHUNK) {
    const b64 = await page.evaluate(([off, size]) => {
      const u = window.__pcm.subarray(off, off + size);
      let s = '';
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return btoa(s);
    }, [off, CHUNK]);
    parts.push(Buffer.from(b64, 'base64'));
  }
  return { pcm: Buffer.concat(parts), sampleRate: info.sampleRate };
}

function writeWavFloat(file, pcm, sampleRate, channels = 2) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * channels * 4, 28); h.writeUInt16LE(channels * 4, 32); h.writeUInt16LE(32, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}

/** Scales float samples so the sample peak sits at `dbfs`. */
function normalisePeak(pcm, dbfs) {
  const f = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  let peak = 0;
  for (const v of f) peak = Math.max(peak, Math.abs(v));
  const k = peak > 0 ? Math.pow(10, dbfs / 20) / peak : 1;
  for (let i = 0; i < f.length; i++) f[i] *= k;
  return pcm;
}

const t0 = Date.now();
const raw = path.join(OUT_MUSIC, 'score-raw.wav');
const { pcm, sampleRate } = await pull('renderScore', [plainTiming, {}]);
writeWavFloat(raw, pcm, sampleRate);
console.log(`score rendered: ${(pcm.length / 8 / sampleRate).toFixed(2)}s in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('  raw   ', measure(raw));
const result = master(raw, path.join(OUT_MUSIC, 'score.wav'), { I: -14, TP: -1 });
console.log('  master', result);

if (stems) {
  fs.mkdirSync(path.join(OUT_MUSIC, 'stems'), { recursive: true });
  const groups = ['drums', 'bass', 'chords', 'arp', 'lead', 'fx'];
  for (const keep of groups) {
    const { pcm: p } = await pull('renderScore', [plainTiming, { mute: groups.filter((g) => g !== keep) }]);
    const f = path.join(OUT_MUSIC, 'stems', `${keep}.wav`);
    writeWavFloat(f, p, sampleRate);
    console.log(`  stem ${keep.padEnd(7)}`, measure(f));
  }
}

for (const name of await page.evaluate(() => Object.keys(window.SFX))) {
  const { pcm: p, sampleRate: sr } = await pull('renderSfx', [name, timing.SAMPLE_RATE]);
  const f = path.join(OUT_SFX, `${name}.wav`);
  writeWavFloat(f, normalisePeak(p, -1), sr);
  console.log(`  sfx ${name}`);
}
await browser.close();
