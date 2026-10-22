// Renders the film, masters its sound, and writes the YouTube-ready file.
//
//   node scripts/master.mjs           → out/the-payer-demo.mp4 (1920x1080, 30 fps, H.264 + AAC)
//   node scripts/master.mjs --draft   → out/draft.mp4, same pipeline (for the frame check)
//   add --reuse-picture to keep an already-rendered picture and redo only the sound
//
// 1. Remotion renders the picture (muted) and, separately, the audio mix (score + effects) as WAV.
// 2. The mix is mastered to -14 LUFS integrated, true peak under -1 dBTP (two-pass loudnorm).
// 3. ffmpeg muxes the picture with the mastered sound as AAC, then the result is measured.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { master, measure } from './loudness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const draft = process.argv.includes('--draft');
const OUT = path.join(ROOT, 'out');
const name = draft ? 'draft' : 'the-payer-demo';
fs.mkdirSync(OUT, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const picture = path.join(OUT, `.${name}-picture.mp4`);
const mix = path.join(OUT, `.${name}-mix.wav`);
const mastered = path.join(OUT, `.${name}-mastered.wav`);
const final = path.join(OUT, `${name}.mp4`);

// --reuse-picture skips the (slow) picture render when only the sound changed.
if (!(process.argv.includes('--reuse-picture') && fs.existsSync(picture))) {
  run('npx', ['remotion', 'render', 'src/index.ts', 'Demo', picture, '--codec=h264', '--crf=16', '--muted', '--concurrency=6', '--log=warn']);
}
run('npx', ['remotion', 'render', 'src/index.ts', 'Demo', mix, '--codec=wav', '--log=warn']);
const m = master(mix, mastered, { I: -14, TP: -1, margin: 0.5 });
console.log('mix   ', m.before, '→', m.type, m.after);
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', picture, '-i', mastered, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', final]);
const loud = measure(final);
const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', final]).toString().trim());
console.log(`${path.relative(ROOT, final)}: ${duration.toFixed(2)} s, ${loud.I} LUFS integrated, true peak ${loud.TP} dBTP, LRA ${loud.LRA} LU`);
if (loud.TP > -1) throw new Error(`True peak ${loud.TP} dBTP is above -1 dBTP`);
if (duration >= 180) throw new Error(`${duration} s is not under 3 minutes`);
for (const f of [picture, mix, mastered]) fs.rmSync(f, { force: true });
