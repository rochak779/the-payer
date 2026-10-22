import { Freeze, interpolate, interpolateColors, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { clip as clipData, scrollAt, type Box } from '../clips';
import { BODY, C, paper } from '../theme';
import { SECONDS_PER_BEAT, type SectionId } from '../timing';
import { Icon, prog, useSection } from './ui';

export type Rect = { x: number; y: number; w: number; h: number };
/** Where the camera looks: the whole phone, a box (zoomed to fit), or a point at a scale (screen px per CSS px). */
export type Cam =
  | { kind: 'fit' }
  | { kind: 'box'; box: Box; page?: boolean; pad?: number; max?: number; dx?: number; dy?: number }
  | { kind: 'point'; x: number; y: number; s: number; page?: boolean };
/** From beat `at`, move to this window/camera/offset colour over `dur` beats. */
export type Key = { at: number; win?: Rect; cam?: Cam; shadow?: string; dur?: number };
/** A highlighter mark drawn over the recording, between two beats. */
export type Highlight = { from: number; to: number; box: Box; page?: boolean };

const BORDER = 3;
/** The phone, whole, standing on the yellow field. */
export const PHONE: Rect = { x: 1238, y: 64, w: 455, h: 952 };
/** A wide window for close-ups, filling the field. */
export const WIDE: Rect = { x: 1050, y: 110, w: 820, h: 860 };
export const fit: Cam = { kind: 'fit' };
export const on = (box: Box, opts: Omit<Extract<Cam, { kind: 'box' }>, 'kind' | 'box'> = {}): Cam => ({ kind: 'box', box, page: true, pad: 18, ...opts });

type View = { x: number; y: number; s: number };
const VW = 420, VH = 880;

function resolve(cam: Cam, win: Rect, clip: string, t: number): View {
  const iw = win.w - 2 * BORDER, ih = win.h - 2 * BORDER;
  if (cam.kind === 'fit') return { x: VW / 2, y: VH / 2, s: Math.min(iw / VW, ih / VH) };
  const scroll = cam.page ? scrollAt(clip, t) : 0;
  if (cam.kind === 'point') return { x: cam.x, y: cam.y - scroll, s: cam.s };
  const pad = cam.pad ?? 18;
  const s = Math.min(iw / (cam.box.w + 2 * pad), ih / (cam.box.h + 2 * pad), cam.max ?? 3);
  return { x: cam.box.x + cam.box.w / 2 + (cam.dx ?? 0), y: cam.box.y + cam.box.h / 2 - scroll + (cam.dy ?? 0), s };
}

/** Keeps the frame filled: the camera can't look past the edges of the recording. */
function contain(v: View, win: Rect): View {
  const hw = (win.w - 2 * BORDER) / (2 * v.s), hh = (win.h - 2 * BORDER) / (2 * v.s);
  const x = 2 * hw >= VW ? VW / 2 : Math.min(Math.max(v.x, hw), VW - hw);
  const y = 2 * hh >= VH ? VH / 2 : Math.min(Math.max(v.y, hh), VH - hh);
  return { x, y, s: v.s };
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const lerpView = (a: View, b: View, p: number): View => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), p)) });

/** Piecewise-linear [beat, clip seconds] map. */
function clipTime(map: [number, number][], beat: number): number {
  if (beat <= map[0][0]) return map[0][1];
  for (let i = 1; i < map.length; i++) {
    const [b0, c0] = map[i - 1], [b1, c1] = map[i];
    if (beat <= b1) return c0 + (c1 - c0) * ((beat - b0) / (b1 - b0));
  }
  return map[map.length - 1][1];
}
function speedAt(map: [number, number][], beat: number): number {
  for (let i = 1; i < map.length; i++) {
    const [b0, c0] = map[i - 1], [b1, c1] = map[i];
    if (beat >= b0 && beat < b1) return (c1 - c0) / ((b1 - b0) * SECONDS_PER_BEAT);
  }
  return 0;
}

/**
 * A recording of the app shown through a window on the yellow field, with a camera that zooms and pans.
 * `map` remaps time ([beat, clip seconds] pairs, so app moments land on beats); `keys` move the window,
 * the camera and the window's offset colour. Stretches that run faster than real time say "Sped up".
 */
export function PhoneShot({ section, clip, map, keys, marks = [], showSpeed = true }: {
  section: SectionId; clip: string; map: [number, number][]; keys: Key[]; marks?: Highlight[]; showSpeed?: boolean;
}) {
  const { B, beatNow } = useSection(section);
  const frame = useCurrentFrame();
  const data = clipData(clip);
  const t = Math.min(clipTime(map, beatNow), data.duration - 1 / 30);

  // Each key eases from wherever the previous move had got to when it starts.
  const first = keys[0];
  let win: Rect = first.win ?? PHONE;
  let view: View = resolve(first.cam ?? fit, win, clip, t);
  let shadow = first.shadow ?? C.ink;
  type State = { win: Rect; cam: Cam; shadow: string };
  let from: State = { win, cam: first.cam ?? fit, shadow };
  let fromView = view;
  let prevKey: Key | null = null;
  let target: State = from;
  for (const k of keys.slice(1)) {
    if (frame < B(k.at)) break;
    // Where the previous move had got to when this one starts.
    const startF = B(k.at);
    const pPrev = prevKey ? progAt(startF, B(prevKey.at), B(prevKey.at + (prevKey.dur ?? 0.75))) : 1;
    const winAt = prevKey ? lerpRect(from.win, target.win, pPrev) : from.win;
    const viewAt = prevKey ? lerpView(fromView, resolve(target.cam, target.win, clip, t), pPrev) : resolve(from.cam, from.win, clip, t);
    const shadowAt = prevKey ? interpolateColors(pPrev, [0, 1], [from.shadow, target.shadow]) : from.shadow;
    from = { win: winAt, cam: from.cam, shadow: shadowAt };
    fromView = viewAt;
    target = { win: k.win ?? target.win, cam: k.cam ?? target.cam, shadow: k.shadow ?? target.shadow };
    prevKey = k;
  }
  if (prevKey) {
    const p = progAt(frame, B(prevKey.at), B(prevKey.at + (prevKey.dur ?? 0.75)));
    win = lerpRect(from.win, target.win, p);
    view = lerpView(fromView, resolve(target.cam, target.win, clip, t), p);
    shadow = interpolateColors(p, [0, 1], [from.shadow, target.shadow]);
  }
  view = contain(view, win);

  const iw = win.w - 2 * BORDER, ih = win.h - 2 * BORDER;
  const tx = iw / 2 - view.x * view.s, ty = ih / 2 - view.y * view.s;
  const spedUp = showSpeed && speedAt(map, beatNow) >= 2.5;
  const toScreen = (b: Box, page?: boolean) => {
    const y = b.y - (page ? scrollAt(clip, t) : 0);
    return { left: tx + b.x * view.s, top: ty + y * view.s, width: b.w * view.s, height: b.h * view.s };
  };

  return (
    <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, boxSizing: 'border-box', border: `${BORDER}px solid ${C.ink}`, borderRadius: 14, boxShadow: `16px 16px 0 ${shadow}`, overflow: 'hidden', background: C.cream }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1260, height: 2640, transformOrigin: '0 0', transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${(view.s / 3).toFixed(5)})` }}>
        {/* Remotion clamps a frozen frame to the film's length, and the live take is longer than the film, so the
            clip time goes in trimBefore and the frozen frame stays at 0. */}
        <Freeze frame={0}>
          <OffthreadVideo src={staticFile(`rec/${clip}.mp4`)} trimBefore={Math.round(t * 30)} muted style={{ width: 1260, height: 2640, display: 'block' }} />
        </Freeze>
      </div>
      {marks.map((m, i) => {
        const p = prog(frame, B(m.from), 9) * (1 - prog(frame, B(m.to), 6));
        if (p <= 0) return null;
        const r = toScreen(m.box, m.page ?? true);
        return <div key={i} style={{ position: 'absolute', ...r, left: r.left - 6, top: r.top - 4, width: (r.width + 12) * p, height: r.height + 8, background: C.yellow, mixBlendMode: 'multiply', borderRadius: 4 }} />;
      })}
      {spedUp && (
        <div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 12px', background: C.ink, color: C.cream, borderRadius: 6, fontFamily: BODY, fontWeight: 700, fontSize: 30 }}>
          <Icon name="ff" size={30} color={C.yellow} fill={C.yellow} stroke={1.5} />
          Sped up
        </div>
      )}
    </div>
  );
}

function progAt(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, Math.max(end, start + 1)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: paper });
}
