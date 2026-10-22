import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { prog, shake, Sheet, Stamp, Sub, useSection } from '../components/ui';
import type { Cue } from '../cues';
import { text } from '../story';
import { BODY, C, DISPLAY } from '../theme';

// ---------- 11. Outro: what it's built on, and where to try it ----------
export const outroCues: Cue[] = [
  { section: 'outro', beat: 15.6, sfx: 'whoosh', volume: 0.5 },
  { section: 'outro', beat: 18, sfx: 'stamp', volume: 0.8 },
];

function Chip({ children, at }: { children: string; at: number }) {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 10);
  return (
    <span style={{ display: 'inline-block', padding: '10px 22px', border: `3px solid ${C.ink}`, borderRadius: 8, background: C.paper, boxShadow: `5px 5px 0 ${C.ink}`, fontFamily: BODY, fontWeight: 650, fontSize: 44, color: C.ink, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      {children}
    </span>
  );
}

export function Outro() {
  const { frame, B } = useSection('outro');
  // "Built on PayPal (…) · Gemini … · Channel3 · Render" → one chip per part.
  const parts = text('outro.built').replace(/^Built on /, '').split(' · ');
  const card = prog(frame, B(16), 12);
  return (
    <AbsoluteFill style={{ background: C.cream, transform: shake(frame, [B(0), B(16)], 12) }}>
      <div style={{ position: 'absolute', left: 150, top: 110, opacity: 1 - prog(frame, B(15.8), 8) }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 200, lineHeight: 1, letterSpacing: '-0.045em', transform: `scale(${1.2 - 0.2 * prog(frame, B(0), 10)})`, transformOrigin: 'left center', opacity: prog(frame, B(0), 4) }}>
          {text('outro.name')}<span style={{ color: C.yellow }}>.</span>
        </div>
        <Sub at={B(1)} size={50} color={C.ink} style={{ marginTop: 26, width: 1500 }}>{text('outro.line')}</Sub>
        <div style={{ marginTop: 70, fontFamily: BODY, fontWeight: 650, fontSize: 40, color: C.muted, opacity: prog(frame, B(4), 8) }}>Built on</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 18, width: 1620 }}>
          {parts.map((p, i) => <Chip key={p} at={B(4.5 + i * 0.5)}>{p}</Chip>)}
        </div>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Chip at={B(7)}>{text('outro.claude')}</Chip>
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: card, transform: `translateY(${(1 - card) * 120}px)` }}>
        <div style={{ position: 'relative' }}>
          <Sheet offset={C.yellow} depth={18} style={{ padding: '60px 80px', width: 1340 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, lineHeight: 1, letterSpacing: '-0.045em', color: C.ink }}>
              {text('outro.name')}<span style={{ color: C.yellow }}>.</span>
            </div>
            {[text('outro.try'), text('outro.code')].map((l, i) => {
              const [label, value] = l.split(': ');
              const p = prog(frame, B(16.6 + i * 0.6), 10);
              return (
                <div key={l} style={{ marginTop: i === 0 ? 40 : 18, display: 'flex', alignItems: 'baseline', gap: 24, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
                  <span style={{ fontFamily: BODY, fontWeight: 650, fontSize: 44, color: C.muted, width: 150 }}>{label}</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 58, letterSpacing: '-0.03em', color: C.ink }}>{value}</span>
                </div>
              );
            })}
          </Sheet>
          <div style={{ position: 'absolute', right: 70, top: 60 }}><Stamp kind="approve" at={B(18)} size={56} tilt={-6} /></div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
