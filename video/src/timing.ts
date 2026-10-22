// The beat grid shared by the score (music/score.js), the edit (src/) and the captions (scripts/srt.ts).
// Every section starts on a bar line, so cuts land on downbeats. Change a section's length here and
// both the music and the picture follow. Plain TypeScript with no imports, so Node can run it as is.

export const BPM = 124;
export const BEATS_PER_BAR = 4;
export const FPS = 30;
export const SAMPLE_RATE = 48000;

/** Story beats in order, with their length in bars. One bar at 124 BPM is about 1.94 seconds. */
export const SECTIONS = [
  { id: 'hook', bars: 8 }, // 1. "AI agents can shop for you" … "Only 3% would."  Tension intro, build, gap.
  { id: 'promise', bars: 6 }, // 2. The drop. "PayPal made shops agent-ready. The Payer makes buyers agent-safe."
  { id: 'rules', bars: 6 }, // 3. Rules in plain English, read back by the AI.
  { id: 'mug', bars: 6 }, // 4. The mug: approved, held and paid exactly $12.
  { id: 'record', bars: 4 }, // 4b. PayPal's record, from the sandbox API.
  { id: 'nephew', bars: 8 }, // 5. The present asks first; one tap approves; paid.
  { id: 'headphones', bars: 4 }, // 6. Refurbished headphones: blocked, with the reason.
  { id: 'shop', bars: 8 }, // 7. The shop tries it on three times. Second drop.
  { id: 'off', bars: 6 }, // 8. The off switch. Breakdown: the music stops with the agent.
  { id: 'live', bars: 6 }, // 9. Live: Gemini + Channel3 + PayPal sandbox. The build back.
  { id: 'evals', bars: 6 }, // 10. The measured numbers. Third drop.
  { id: 'outro', bars: 6 }, // 11. Credits and links. Resolves to A major.
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** Seconds of reverb tail after the last bar. */
export const TAIL_SECONDS = 2.5;

/** Beat (from the section's start) where the off switch is pressed: the music cuts there. */
export const OFF_SWITCH_BEAT = 4;

export const SECONDS_PER_BEAT = 60 / BPM;
export const SECONDS_PER_BAR = SECONDS_PER_BEAT * BEATS_PER_BAR;

export const TOTAL_BARS = SECTIONS.reduce((n, s) => n + s.bars, 0);
export const TOTAL_SECONDS = TOTAL_BARS * SECONDS_PER_BAR + TAIL_SECONDS;
export const TOTAL_FRAMES = Math.ceil(TOTAL_SECONDS * FPS);

/** The bar each section starts on. */
export function startBar(id: SectionId): number {
  let bar = 0;
  for (const s of SECTIONS) {
    if (s.id === id) return bar;
    bar += s.bars;
  }
  throw new Error(`No section ${id}`);
}

export function barsOf(id: SectionId): number {
  return SECTIONS.find((s) => s.id === id)!.bars;
}

/** Seconds from the start of the video to a bar (and beat). Fractions are allowed. */
export const at = (bar: number, beat = 0) => (bar * BEATS_PER_BAR + beat) * SECONDS_PER_BEAT;

/** The nearest video frame to a beat: within half a frame (17 ms) of the music. */
export const frameAt = (bar: number, beat = 0) => Math.round(at(bar, beat) * FPS);

/** Frames from a section's start to one of its beats. */
export const beatFrames = (beats: number) => Math.round(beats * SECONDS_PER_BEAT * FPS);
