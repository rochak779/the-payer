// Finds when something appears in a recorded clip, by counting pixels of one colour per frame.
// Used to lock UI moments (a stamp landing, a line appearing) to the beat grid precisely.
//
//   node scripts/probe.mjs <clip> <from s> <to s> <hex colour> [tolerance] [x y w h in CSS px]
// Prints each frame's time, the count, and where the colour sits; the first jump is the moment.
import { execFileSync } from 'node:child_process';

const [clip, from, to, hex, tol = '18', ...region] = process.argv.slice(2);
const W = 210, H = 440; // half the CSS viewport: one sample per 2 CSS px
const crop = region.length === 4 ? region.map(Number) : [0, 0, 420, 880];
const target = [1, 3, 5].map((i) => parseInt(hex.replace('#', '').slice(i - 1, i + 1), 16));
const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-ss', from, '-to', to, '-i', `public/rec/${clip}.mp4`,
  '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
const frame = W * H * 3;
const [cx, cy, cw, ch] = crop.map((v) => Math.round(v / 2));
let prev = null;
for (let f = 0; f * frame < raw.length; f++) {
  let n = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = cy; y < Math.min(H, cy + ch); y++) {
    for (let x = cx; x < Math.min(W, cx + cw); x++) {
      const i = f * frame + (y * W + x) * 3;
      if (Math.abs(raw[i] - target[0]) <= tol && Math.abs(raw[i + 1] - target[1]) <= tol && Math.abs(raw[i + 2] - target[2]) <= tol) {
        n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
  }
  // Count, then the bounding box of the matching pixels in CSS px (x y w h).
  const key = `${n} ${n ? `${x0 * 2} ${y0 * 2} ${(x1 - x0 + 1) * 2} ${(y1 - y0 + 1) * 2}` : ''}`;
  if (key !== prev) console.log(`${(Number(from) + f / 30).toFixed(3)}s ${key}`);
  prev = key;
}
