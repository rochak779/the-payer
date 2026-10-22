import type { CSSProperties, ReactNode } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, DISPLAY, paper } from '../theme';
import { frameAt, FPS, SECONDS_PER_BEAT, startBar, type SectionId } from '../timing';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 → 1 from `from` over `dur` frames, on the paper curve. */
export const prog = (frame: number, from: number, dur: number, easing = paper) =>
  interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing });

/** Frames and beats inside a section's Sequence. B(beat) is the local frame of a beat, on the music's grid. */
export function useSection(id: SectionId) {
  const frame = useCurrentFrame();
  const start = frameAt(startBar(id));
  const B = (beat: number) => frameAt(startBar(id), beat) - start;
  const beatNow = (frame + start) / FPS / SECONDS_PER_BEAT - startBar(id) * 4;
  return { frame, B, beatNow };
}

/** A quick shake after each hit (a stamp landing, an impact): returns a transform. */
export function shake(frame: number, hits: number[], amp = 12): string {
  let x = 0, y = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t < 0 || t > 9) continue;
    const k = amp * (1 - t / 9);
    x += Math.sin(t * 2.7 + h) * k;
    y += Math.cos(t * 3.1 + h * 0.7) * k * 0.7;
  }
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
}

// ---------- Icons (the app's own set) ----------
const PATHS = {
  check: ['m5 12.5 4.5 4.5L19 7.5'],
  cross: ['M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5'],
  question: ['M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14', 'M12 17.5v.01'],
  search: ['m20 20-4.5-4.5'],
  bag: ['M5 8h14l-1 12H6Z', 'M9 8V6.5a3 3 0 0 1 6 0V8'],
  card: ['M3.5 10h17M7 14.5h3'],
  ff: ['M4 6.5v11l7-5.5Z', 'M12.5 6.5v11l7-5.5Z'],
} as const;
export function Icon({ name, size, stroke = 2.4, color = C.ink, fill = 'none' }: { name: keyof typeof PATHS; size: number; stroke?: number; color?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {name === 'search' && <circle cx="11" cy="11" r="6" />}
      {name === 'card' && <rect x="3.5" y="6" width="17" height="12" rx="2.5" />}
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

// ---------- Kinetic type ----------
type Seg = { text: string; hi: boolean };
/** Splits "a *b c* d|e" into lines of words, each a list of segments with or without the highlight band. */
function parse(text: string): Seg[][][] {
  let hi = false;
  return text.split('|').map((ln) => ln.split(' ').map((word) => {
    const segs: Seg[] = [];
    word.split('*').forEach((part, i) => {
      if (i > 0) hi = !hi;
      if (part) segs.push({ text: part, hi });
    });
    return segs;
  }));
}

/**
 * A Satoshi headline whose words slam in one after another, with the app's yellow band drawn under
 * the *marked* word. `at` is the first word's frame; `stagger` the frames between words.
 */
export function Headline({ text, at, size = 104, color = C.ink, band = C.yellow, stagger = 3, lineHeight = 1.0, weight = 900, style, out }: {
  text: string; at: number; size?: number; color?: string; band?: string; stagger?: number; lineHeight?: number; weight?: number; style?: CSSProperties; out?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let i = 0;
  const gone = out !== undefined ? prog(frame, out, 8) : 0;
  return (
    <div style={{ fontFamily: DISPLAY, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: '-0.04em', color, opacity: 1 - gone, transform: `translateY(${-gone * 30}px)`, ...style }}>
      {parse(text).map((words, li) => (
        <div key={li} style={{ whiteSpace: 'nowrap' }}>
          {words.map((segs, wi) => {
            const start = at + (i++) * stagger;
            const s = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 240, mass: 0.55 } });
            const op = interpolate(frame - start, [0, 3], [0, 1], clamp);
            return (
              <span key={wi} style={{ display: 'inline-block', marginRight: wi < words.length - 1 ? '0.24em' : 0, opacity: op, transform: `translateY(${((1 - s) * 0.5 * size).toFixed(2)}px) scale(${(1 + (1 - s) * 0.08).toFixed(4)})`, transformOrigin: 'left bottom' }}>
                {segs.map((seg, si) => seg.hi ? (
                  <span key={si} style={{ position: 'relative', display: 'inline-block' }}>
                    <span style={{ position: 'absolute', left: '-0.03em', right: '-0.03em', bottom: '0.02em', height: '0.2em', background: band, transformOrigin: 'left center', transform: `scaleX(${prog(frame, start + 5, 14)})` }} />
                    <span style={{ position: 'relative' }}>{seg.text}</span>
                  </span>
                ) : <span key={si}>{seg.text}</span>)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Body copy that rises in. Inter, at least 44 px so it reads on a laptop. */
export function Sub({ children, at, size = 46, color = '#3b3b3b', style, out }: { children: ReactNode; at: number; size?: number; color?: string; style?: CSSProperties; out?: number }) {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 14);
  const gone = out !== undefined ? prog(frame, out, 8) : 0;
  return (
    <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: size, lineHeight: 1.3, letterSpacing: '-0.01em', color, opacity: p * (1 - gone), transform: `translateY(${(1 - p) * 24 - gone * 20}px)`, ...style }}>
      {children}
    </div>
  );
}

// ---------- Stamps ----------
export type StampKind = 'approve' | 'ask' | 'block' | 'refused' | 'cancelled';
const STAMP: Record<StampKind, { bg: string; icon: 'check' | 'question' | 'cross'; label: string; dashed?: boolean }> = {
  approve: { bg: C.mint, icon: 'check', label: 'Approved' },
  ask: { bg: C.yellow, icon: 'question', label: 'Asking you' },
  block: { bg: C.pink, icon: 'cross', label: 'Blocked' },
  refused: { bg: C.pink, icon: 'cross', label: 'Refused' },
  cancelled: { bg: C.surface, icon: 'cross', label: 'Cancelled', dashed: true },
};

/**
 * The verdict tag from the app, at video size. It lands the way the app's does, exaggerated: lifted on a
 * deep ink offset, pressed flat onto the page, then settled on a small offset, tilted. `at` is the frame
 * it hits the page (it falls for 6 frames before), so a stamp put on a beat hits on the beat.
 */
export function Stamp({ kind, at, size = 64, tilt = -3, style }: { kind: StampKind; at: number; size?: number; tilt?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const t = frame - (at - 6);
  if (t < 0) return null;
  const s = STAMP[kind];
  const k = size / 15; // the app's tag is 15 px
  const fall = interpolate(t, [0, 6], [0, 1], { ...clamp, easing: (x) => x * x });
  const settle = prog(t, 6, 8);
  const lift = 1 - fall;
  const off = s.dashed ? 0 : t < 6 ? 0 : 2 * k * settle;
  const shadow = s.dashed ? 'none' : lift > 0 ? `${(8 * k * lift).toFixed(1)}px ${(12 * k * lift).toFixed(1)}px 0 ${C.ink}` : `${off.toFixed(1)}px ${off.toFixed(1)}px 0 ${C.ink}`;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.28, padding: `${size * 0.22}px ${size * 0.62}px ${size * 0.22}px ${size * 0.44}px`,
      background: s.bg, border: `${Math.max(2, k * 0.75)}px ${s.dashed ? 'dashed' : 'solid'} ${C.ink}`, borderRadius: Math.max(4, k * 1.4),
      fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: '-0.01em', color: C.ink,
      boxShadow: shadow, opacity: interpolate(t, [0, 2], [0, 1], clamp),
      transform: `translate(${(-5 * k * lift).toFixed(1)}px, ${(-12 * k * lift).toFixed(1)}px) rotate(${(tilt - 6 * lift).toFixed(2)}deg) scale(${(1 + 0.55 * lift).toFixed(3)})`,
      transformOrigin: 'center', whiteSpace: 'nowrap', ...style,
    }}>
      <Icon name={s.icon} size={size * 1.05} stroke={2.6} />
      {s.label}
    </div>
  );
}

// ---------- Paper ----------
/** White paper with an ink edge on a hard offset, the app's sheet. */
export function Sheet({ children, offset = C.yellow, style, depth = 12 }: { children: ReactNode; offset?: string; style?: CSSProperties; depth?: number }) {
  return (
    <div style={{ background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 8, boxShadow: `${depth}px ${depth}px 0 ${offset}`, ...style }}>
      {children}
    </div>
  );
}

/** The task as the person typed it, in the app's field, typed out over `dur` frames. */
export function TaskField({ text, at, dur = 22, style }: { text: string; at: number; dur?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 10);
  const n = Math.round(interpolate(frame, [at + 4, at + 4 + dur], [0, text.length], clamp));
  const caret = frame < at + 4 + dur + 20 && Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)`, ...style }}>
      <div style={{ fontFamily: BODY, fontWeight: 650, fontSize: 34, color: C.muted, marginBottom: 14 }}>You ask the agent</div>
      <div style={{ background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 8, padding: '22px 28px', boxShadow: `10px 10px 0 ${C.yellow}`, fontFamily: BODY, fontWeight: 500, fontSize: 44, lineHeight: 1.3, color: C.ink }}>
        {text.slice(0, n)}
        <span style={{ display: 'inline-block', width: 3, height: 46, marginLeft: 3, verticalAlign: -8, background: caret ? C.ink : 'transparent' }} />
      </div>
    </div>
  );
}

/** A number that rolls up to its value, in tabular figures. */
export function Count({ to, at, dur = 18, decimals = 0, prefix = '', suffix = '' }: { to: number; at: number; dur?: number; decimals?: number; prefix?: string; suffix?: string }) {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + dur], [0, to], { ...clamp, easing: paper });
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
}
