import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Count, Headline, shake, Stamp, Sub, prog, useSection } from '../components/ui';
import type { Cue } from '../cues';
import { text } from '../story';
import { C, DISPLAY, inOut } from '../theme';

// ---------- 1. Hook: "AI agents can shop for you." … "Only 3% would." ----------
export const hookCues: Cue[] = [
  { section: 'hook', beat: 16, sfx: 'stamp', volume: 0.55 },
  { section: 'hook', beat: 29, sfx: 'whoosh', volume: 0.7 },
];

export function Hook() {
  const { frame, B } = useSection('hook');
  const part = frame < B(8) ? 1 : frame < B(16) ? 2 : 3;
  // The build: everything rushes at the camera, then ink wipes up for the gap before the drop.
  const rush = interpolate(frame, [B(28), B(31)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: inOut });
  const wipe = prog(frame, B(29), B(31) - B(29), inOut);
  const creep = interpolate(frame, [B(16), B(28)], [1, 1.07], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: part === 3 ? C.yellow : C.cream }}>
      {part === 1 && <Headline text={text('hook.shop')} at={B(0)} stagger={B(0.5)} size={184} style={{ position: 'absolute', left: 150, top: 330 }} />}
      {part === 2 && <Headline text={text('hook.ask')} at={B(8)} stagger={B(0.5)} size={156} style={{ position: 'absolute', left: 150, top: 380 }} />}
      {part === 3 && (
        <AbsoluteFill style={{ transform: `${shake(frame, [B(16)], 16)} scale(${creep * (1 + rush * 2.2)})`, transformOrigin: '42% 52%' }}>
          <div style={{ position: 'absolute', left: 150, top: 150, fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, letterSpacing: '-0.04em', color: C.ink, opacity: prog(frame, B(16), 6) }}>Only</div>
          <div style={{ position: 'absolute', left: 130, top: 230, fontFamily: DISPLAY, fontWeight: 900, fontSize: 560, lineHeight: 1, letterSpacing: '-0.06em', color: C.ink, textShadow: `16px 16px 0 ${C.cream}` }}>
            <Count to={3} at={B(16)} dur={B(17.5) - B(16)} suffix="%" />
          </div>
          <div style={{ position: 'absolute', left: 1060, top: 560, fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, letterSpacing: '-0.04em', color: C.ink, opacity: prog(frame, B(17.5), 6), transform: `translateX(${(1 - prog(frame, B(17.5), 10)) * 40}px)` }}>would.</div>
          <Sub at={B(19)} size={46} color={C.ink} style={{ position: 'absolute', left: 156, top: 900 }}>{text('hook.source')}</Sub>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: C.ink, transform: `translateY(${(1 - wipe) * 100}%)` }} />
    </AbsoluteFill>
  );
}

// ---------- 2. The promise, on the drop ----------
export const promiseCues: Cue[] = [
  { section: 'promise', beat: 7.5, sfx: 'whoosh', volume: 0.6 },
  { section: 'promise', beat: 18, sfx: 'stamp', volume: 0.8 },
  { section: 'promise', beat: 19, sfx: 'stamp', volume: 0.8 },
  { section: 'promise', beat: 20, sfx: 'stamp', volume: 0.8 },
  { section: 'promise', beat: 23.4, sfx: 'whoosh', volume: 0.6 },
];

export function Pitch() {
  const { frame, B } = useSection('promise');
  const part = frame < B(8) ? 1 : frame < B(16) ? 2 : 3;
  const wipe = prog(frame, B(8), 9);
  return (
    <AbsoluteFill style={{ background: part === 1 ? C.ink : C.cream, transform: shake(frame, [B(0), B(16), B(18), B(19), B(20)], 14) }}>
      {part === 1 && <Headline text={text('promise.paypal')} at={B(0)} stagger={4} size={150} color={C.cream} style={{ position: 'absolute', left: 150, top: 330 }} />}
      {part === 2 && (
        <>
          <Headline text={text('promise.payer')} at={B(8)} stagger={4} size={150} style={{ position: 'absolute', left: 150, top: 330 }} />
          <AbsoluteFill style={{ background: C.ink, transform: `translateX(${-wipe * 100}%)` }} />
        </>
      )}
      {part === 3 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 250, lineHeight: 1, letterSpacing: '-0.045em', color: C.ink, transform: `scale(${1.25 - 0.25 * prog(frame, B(16), 10)})`, opacity: prog(frame, B(16), 4), marginTop: -120 }}>
            {text('promise.name')}<span style={{ color: C.yellow }}>.</span>
          </div>
          <Sub at={B(17)} size={52} color={C.ink} style={{ marginTop: 24 }}>{text('promise.what')}</Sub>
          <div style={{ display: 'flex', gap: 56, marginTop: 70, height: 110, alignItems: 'center' }}>
            <Stamp kind="approve" at={B(18)} size={60} tilt={-4} />
            <Stamp kind="ask" at={B(19)} size={60} tilt={2} />
            <Stamp kind="block" at={B(20)} size={60} tilt={-2} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

