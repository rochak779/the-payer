// Loudness tools on ffmpeg: measure with EBU R128, and master to a target with two-pass loudnorm.
// Target for the video (YouTube-ready): about -14 LUFS integrated, true peak at most -1 dBTP.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

/** loudnorm's own measurement (first pass): input_i, input_tp, input_lra, input_thresh, target_offset. */
export function loudnormMeasure(file, { I = -14, TP = -1, LRA = 20 } = {}) {
  const r = ff(['-i', file, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-']);
  const json = r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

/** EBU R128 with true peak: { I (LUFS), LRA (LU), TP (dBTP) }. */
export function measure(file) {
  const r = ff(['-i', file, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-']);
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const num = (re) => Number((s.match(re) ?? [])[1]);
  return { I: num(/I:\s+(-?[\d.]+) LUFS/), LRA: num(/LRA:\s+(-?[\d.]+) LU/), TP: num(/True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS/) };
}

/**
 * Masters `input` to `output` (24-bit WAV, 48 kHz). First a gain and a gentle limiter give the
 * peaks room, then two-pass loudnorm applies one fixed (linear) gain to land exactly on target.
 */
export function master(input, output, { I = -14, TP = -1, margin = 0.5 } = {}) {
  const tmp = path.join(path.dirname(output), `.pre-${path.basename(output)}`);
  const m0 = loudnormMeasure(input, { I, TP });
  const gain = I - Number(m0.input_i);
  const limit = Math.pow(10, (TP - margin - 1.2) / 20); // sample-peak ceiling, well under the true-peak target so pass 2 stays linear
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-af',
    `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(4)}:attack=1:release=60:level=disabled`, '-c:a', 'pcm_f32le', tmp]);
  const m1 = loudnormMeasure(tmp, { I, TP: TP - margin });
  const r = ff(['-y', '-i', tmp, '-af',
    `loudnorm=I=${I}:TP=${TP - margin}:LRA=20:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true:print_format=json`,
    '-ar', '48000', '-c:a', 'pcm_s24le', output]);
  const pass2 = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1));
  fs.rmSync(tmp, { force: true });
  return { before: { I: Number(m0.input_i), TP: Number(m0.input_tp) }, type: pass2.normalization_type, after: measure(output) };
}
