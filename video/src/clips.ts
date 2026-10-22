// The app recordings: one clip per beat, made by scripts/record.mjs. Each clip's JSON holds its length,
// named marks with element boxes (viewport CSS px), exact in-page events (taps, stamps landing) and the
// page's scroll position over time, so the camera can lock onto page content while it scrolls.

export type Box = { x: number; y: number; w: number; h: number };
export type Mark = { label: string; t: number; boxes: Record<string, Box | null> };
export type ClipEvent = { type: 'press' | 'stamp' | 'step'; t: number; text?: string; box?: Box };
export type ClipData = {
  clip: string;
  viewport: { w: number; h: number; dsf: number };
  fps: number;
  duration: number;
  marks: Mark[];
  events: ClipEvent[];
  scroll: [number, number][];
};

// webpack (Remotion's bundler) collects whatever clips have been recorded.
declare const require: { context(dir: string, deep: boolean, re: RegExp): { keys(): string[]; (key: string): unknown } };
const ctx = require.context('./rec', false, /\.json$/);
const CLIPS: Record<string, ClipData> = {};
for (const key of ctx.keys()) {
  const data = ctx(key) as ClipData;
  CLIPS[data.clip] = data;
}

export function clip(name: string): ClipData {
  const c = CLIPS[name];
  if (!c) throw new Error(`Clip "${name}" hasn't been recorded. Run scripts/record.mjs.`);
  return c;
}
export const hasClip = (name: string) => name in CLIPS;

export function mark(name: string, label: string): Mark {
  const m = clip(name).marks.find((x) => x.label === label);
  if (!m) throw new Error(`Clip "${name}" has no mark "${label}"`);
  return m;
}
export const markT = (name: string, label: string) => mark(name, label).t;

/** The nth event of a type (optionally whose text starts with `text`), in clip seconds. */
export function event(name: string, type: ClipEvent['type'], n = 0, text?: string): ClipEvent {
  const list = clip(name).events.filter((e) => e.type === type && (!text || (e.text ?? '').startsWith(text)));
  const e = list[n < 0 ? list.length + n : n];
  if (!e) throw new Error(`Clip "${name}" has no ${type} event #${n}${text ? ` "${text}"` : ''}`);
  return e;
}
/** The time of the nth tap in a clip. */
export const pressT = (name: string, n: number) => event(name, 'press', n).t;

/** The page's scroll offset (CSS px) at a clip time. */
export function scrollAt(name: string, t: number): number {
  const s = clip(name).scroll;
  let y = s.length ? s[0][1] : 0;
  for (const [at, v] of s) {
    if (at > t + 1e-6) break;
    y = v;
  }
  return y;
}

/** A box from a mark, in page coordinates (so it stays put while the page scrolls). */
export function pageBox(name: string, label: string, key: string): Box {
  const m = mark(name, label);
  const b = m.boxes[key];
  if (!b) throw new Error(`Mark "${label}" in "${name}" has no box "${key}"`);
  return { ...b, y: b.y + scrollAt(name, m.t) };
}
/** A box from a mark, in viewport coordinates (for things fixed on screen, like the dock). */
export function viewBox(name: string, label: string, key: string): Box {
  const b = mark(name, label).boxes[key];
  if (!b) throw new Error(`Mark "${label}" in "${name}" has no box "${key}"`);
  return b;
}
export const union = (...bs: Box[]): Box => {
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
  return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
};
