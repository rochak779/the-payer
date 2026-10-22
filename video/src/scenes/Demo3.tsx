import { useCurrentFrame } from 'remotion';
import { fit, on, PHONE, PhoneShot, WIDE } from '../components/PhoneShot';
import { DemoStage, Words } from '../components/Stage';
import { Count, Headline, prog, shake, Sheet, Stamp, Sub, useSection } from '../components/ui';
import { clip, hasClip, markT, pageBox, pressT, union } from '../clips';
import type { Cue } from '../cues';
import { text } from '../story';
import { BODY, C, DISPLAY } from '../theme';

// ---------- 8. The off switch: the waiting purchase is cancelled, a new task stops at once ----------
export const offCues: Cue[] = [
  { section: 'off', beat: 4, sfx: 'powerdown', volume: 0.9 },
  { section: 'off', beat: 6, sfx: 'stamp', volume: 0.7 },
  { section: 'off', beat: 20.3, sfx: 'stamp', volume: 0.45 },
];

export function Off() {
  const { frame, B } = useSection('off');
  const panel = pageBox('off', 'off', 'panel');
  const entry = pageBox('off', 'off', 'entry');
  const logLine = pageBox('off', 'cancelled-log', 'line');
  const stopped = pageBox('off', 'stopped', 'line');
  return (
    <DemoStage transform={shake(frame, [B(4)], 8)}>
      <Words>
        <Headline text={text('off.head')} at={B(0)} stagger={4} size={120} />
        <Sub at={B(0.5)} out={B(3.6)} style={{ position: 'absolute', top: 160 }}>{text('off.waiting')}</Sub>
        {frame >= B(3.6) && <Headline text={text('off.stops')} at={B(4)} stagger={5} size={120} band={C.pink} style={{ position: 'absolute', top: 130 }} />}
        <div style={{ position: 'absolute', top: 340, opacity: 1 - prog(frame, B(14.6), 6) }}>
          <div style={{ height: 70 }}><Stamp kind="cancelled" at={B(6)} size={60} tilt={-3} /></div>
          <Sub at={B(6.4)} size={46} color={C.ink} style={{ marginTop: 34 }}>{text('off.cancelled')}</Sub>
        </div>
        {frame >= B(14.6) && <Headline text={text('off.task')} at={B(15)} stagger={4} size={84} style={{ position: 'absolute', top: 360, width: 840 }} />}
      </Words>
      <PhoneShot
        section="off"
        clip="off"
        map={[[0, markT('off', 'activity') - 0.3], [4, pressT('off', 3)], [5, markT('off', 'off') + 0.1], [9, markT('off', 'cancelled-log') - 2], [10, markT('off', 'cancelled-log') - 1], [14, markT('off', 'cancelled-log') + 0.6], [15, pressT('off', 4)], [17, pressT('off', 5)], [20, pressT('off', 6)], [24, clip('off').duration - 0.1]]}
        keys={[
          { at: 0, win: PHONE, cam: fit, shadow: C.ink },
          { at: 4.3, win: WIDE, cam: on(union(panel, entry), { pad: 20 }), shadow: C.line, dur: 1 },
          { at: 6.4, cam: on({ ...entry, h: 190 }, { pad: 24 }), dur: 1 },
          { at: 9.6, cam: on(logLine, { pad: 60, max: 2.6 }), dur: 1 },
          { at: 14.4, win: PHONE, cam: fit, dur: 0.8 },
          { at: 20.2, win: WIDE, cam: on(stopped, { pad: 40, max: 2.6 }), shadow: C.pink, dur: 1 },
        ]}
        marks={[
          { from: 10.2, to: 14.3, box: { ...logLine, x: logLine.x - 2, w: logLine.w + 4 } },
          { from: 20.8, to: 24, box: stopped },
        ]}
      />
    </DemoStage>
  );
}

// ---------- 9. Live: the Gemini agent shops real US listings through Channel3; names blurred in the page ----------
export const liveCues: Cue[] = [{ section: 'live', beat: 12, sfx: 'stamp', volume: 0.85 }, { section: 'live', beat: 16, sfx: 'register', volume: 0.6 }];

function LiveLabel({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 10);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '14px 24px', background: C.ink, color: C.cream, borderRadius: 8, fontFamily: BODY, fontWeight: 650, fontSize: 40, lineHeight: 1.25, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <span style={{ width: 18, height: 18, borderRadius: 9, background: C.pink, boxShadow: `0 0 0 ${4 + pulse * 6}px rgb(248 183 199 / ${0.5 - pulse * 0.3})` }} />
      {text('live.label')}
    </div>
  );
}

export function Live() {
  const { B } = useSection('live');
  if (!hasClip('live')) {
    return <DemoStage><Words><Headline text="Live clip not recorded yet" at={0} size={80} /></Words></DemoStage>;
  }
  const live = clip('live');
  const end = live.marks.find((m) => m.label === 'paid' || m.label === 'decided')!;
  const paid = end.label === 'paid';
  const receipt = pageBox('live', end.label, 'receipt');
  const stampT = live.events.filter((e) => e.type === 'stamp').at(-1)!.t;
  const steps = live.events.filter((e) => e.type === 'step' && e.t > stampT + 1);
  const paidT = steps.length ? steps[0].t : stampT + 4;
  const send = pressT('live', 1);
  return (
    <DemoStage>
      <Words>
        <Headline text={text('live.head')} at={B(0)} stagger={4} size={112} />
        <Sub at={B(2)} style={{ marginTop: 40, width: 790 }}>{text('live.sub')}</Sub>
        <div style={{ marginTop: 50 }}><LiveLabel at={B(1)} /></div>
        <div style={{ marginTop: 56, height: 80 }}><Stamp kind={paid ? 'approve' : 'ask'} at={B(12)} size={60} tilt={-3} /></div>
      </Words>
      <PhoneShot
        section="live"
        clip="live"
        map={[[0, send - 1.4], [2, send], [11, stampT - 0.55], [12, stampT + 0.35], [16, paidT], [24, Math.min(live.duration - 0.1, paidT + 5.5)]]}
        keys={[
          { at: 0, win: PHONE, cam: fit, shadow: C.ink },
          { at: 11.4, win: WIDE, cam: on(receipt, { pad: 24 }), shadow: paid ? C.mint : C.yellow, dur: 1 },
        ]}
      />
    </DemoStage>
  );
}

// ---------- 10. Evals: the measured numbers ----------
export const evalsCues: Cue[] = [];

function Bar({ label, value, shown, width, color, at }: { label: string; value: React.ReactNode; shown: string; width: number; color: string; at: number }) {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 16);
  return (
    <div style={{ marginTop: 30, opacity: prog(frame, at - 4, 6) }}>
      <div style={{ fontFamily: BODY, fontWeight: 650, fontSize: 36, color: C.ink }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
        <div style={{ width: Math.max(14, width * p), height: 58, background: color, border: `3px solid ${C.ink}`, borderRadius: 6, boxShadow: `6px 6px 0 ${C.ink}` }} />
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 76, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.muted }}>{shown}</span>
      </div>
    </div>
  );
}

export function Evals() {
  const { frame, B } = useSection('evals');
  const latest = pageBox('evals', 'start', 'latest');
  const swap = prog(frame, B(12.4), 8);
  return (
    <DemoStage transform={shake(frame, [B(0)], 12)}>
      <Words>
        <Headline text={text('evals.head')} at={B(0)} stagger={4} size={96} />
        <Sub at={B(2)} size={44} style={{ marginTop: 24, width: 800 }}>{text('evals.set')}</Sub>
        <div style={{ position: 'absolute', top: 350, width: 820, opacity: 1 - swap }}>
          <Sub at={B(4)} size={38} color={C.muted} style={{ fontWeight: 650 }}>{text('evals.wrong')}</Sub>
          <Bar label="Keyword rules" value={<Count to={17} at={B(5)} dur={16} />} shown="" width={560} color={C.pink} at={B(5)} />
          <Bar label="The Payer’s AI checker" value="0–1" shown="per run" width={33} color={C.mint} at={B(7)} />
        </div>
        {frame >= B(12.4) && (
          <div style={{ position: 'absolute', top: 350, width: 820 }}>
            <Sheet offset={C.mint} style={{ padding: '24px 32px', opacity: prog(frame, B(13), 8) }}>
              <div style={{ fontFamily: BODY, fontWeight: 650, fontSize: 36, color: C.muted }}>17 held-out cases, never used for tuning</div>
              {[
                { who: 'The Payer', score: '14/17', note: 'right · 0 wrong approvals, both runs', at: 13 },
                { who: 'Keyword rules', score: '9/17', note: 'right · 5 wrong approvals', at: 15 },
              ].map((r, i) => (
                <div key={r.who} style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 16, paddingTop: i ? 16 : 0, borderTop: i ? `2px dashed ${C.line}` : 'none', opacity: prog(frame, B(r.at), 8) }}>
                  <span style={{ width: 210, fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 1 }}>{r.score}</span>
                  <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40, lineHeight: 1.2 }}>{r.who}<br /><span style={{ fontWeight: 500, color: '#3b3b3b' }}>{r.note}</span></span>
                </div>
              ))}
            </Sheet>
          </div>
        )}
      </Words>
      <Sub at={B(4)} size={34} color={C.ink} style={{ position: 'absolute', left: 1050, top: 930, width: 820, fontWeight: 600 }}>{text('evals.source')}</Sub>
      <PhoneShot
        section="evals"
        clip="evals"
        map={[[0, 0.3], [24, clip('evals').duration - 0.1]]}
        showSpeed={false}
        keys={[
          { at: 0, win: { x: 1268, y: 60, w: 400, h: 838 }, cam: fit, shadow: C.ink },
          { at: 12.6, win: { x: 1050, y: 80, w: 820, h: 810 }, cam: on(latest, { pad: 22 }), shadow: C.mint, dur: 1 },
        ]}
      />
    </DemoStage>
  );
}
