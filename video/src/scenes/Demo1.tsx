import { useCurrentFrame } from 'remotion';
import { fit, on, PHONE, PhoneShot, WIDE } from '../components/PhoneShot';
import { DemoStage, Words } from '../components/Stage';
import { Headline, Icon, prog, shake, Sheet, Stamp, Sub, TaskField, useSection } from '../components/ui';
import { clip, markT, pageBox, pressT, union } from '../clips';
import type { Cue } from '../cues';
import record from '../data/paypal-record.json';
import { text } from '../story';
import { BODY, C, DISPLAY, MONO } from '../theme';

// ---------- 3. Rules in plain English, read back by the AI ----------
export const rulesCues: Cue[] = [];

export function Rules() {
  const { B } = useSection('rules');
  const head = pageBox('rules', 'preview-shown', 'heading');
  const list = pageBox('rules', 'preview-shown', 'list');
  const preview = markT('rules', 'preview');
  const firstTwo = { x: 20, y: head.y - 10, w: 380, h: 400 };
  const lastTwo = { x: 20, y: list.y + list.h - 360, w: 380, h: 360 };
  const [codeLine, aiLine] = text('rules.sub2').split('. ').map((s) => s.replace(/\.$/, ''));
  return (
    <DemoStage fieldFrom={10}>
      <Words>
        <Headline text={text('rules.head')} at={B(0)} stagger={4} size={112} />
        <div style={{ position: 'relative', marginTop: 48, height: 300 }}>
          <Sub at={B(2)} out={B(12)} style={{ position: 'absolute', width: 780 }}>{text('rules.sub')}</Sub>
          {[codeLine, aiLine].map((l, i) => (
            <Sub key={l} at={B(12 + i)} style={{ position: 'absolute', top: i * 110, display: 'flex', alignItems: 'center', gap: 22 }}>
              <span style={{ display: 'flex', width: 56, height: 56, borderRadius: 28, border: `3px solid ${C.ink}`, background: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={36} stroke={2.8} />
              </span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{l}.</span>
            </Sub>
          ))}
        </div>
      </Words>
      <PhoneShot
        section="rules"
        clip="rules"
        map={[[0, 0.4], [4, pressT('rules', 0)], [6, preview - 0.3], [7, preview + 0.5], [16, pressT('rules', 1)], [18, markT('rules', 'saved') + 0.4], [24, clip('rules').duration - 0.1]]}
        keys={[
          { at: 0, win: PHONE, cam: fit },
          { at: 6.3, win: WIDE, cam: on(firstTwo), dur: 1 },
          { at: 11.5, cam: on(lastTwo), dur: 1.4 },
          { at: 15.4, win: PHONE, cam: fit, dur: 0.8 },
        ]}
      />
    </DemoStage>
  );
}

// ---------- 4. The mug: approved, held and paid exactly $12 ----------
const mugPaid = markT('mug', 'paid');
export const mugCues: Cue[] = [
  { section: 'mug', beat: 8, sfx: 'stamp', volume: 0.9 },
  { section: 'mug', beat: 16, sfx: 'register', volume: 0.75 },
];

export function Mug() {
  const { frame, B } = useSection('mug');
  const receipt = pageBox('mug', 'paid', 'receipt');
  const amount = pageBox('mug', 'paid', 'amount');
  const paidLine = pageBox('mug', 'paid', 'paidLine');
  const payment = pageBox('mug', 'paid', 'payment');
  const stampT = clip('mug').events.find((e) => e.type === 'stamp')!.t;
  const paidT = clip('mug').events.find((e) => e.type === 'step' && e.text?.startsWith('Paid'))!.t;
  return (
    <DemoStage transform={shake(frame, [B(8)], 10)}>
      <Words>
        <TaskField text={text('mug.task')} at={B(0)} />
        <div style={{ height: 70, marginTop: 64 }}><Stamp kind="approve" at={B(8)} size={66} tilt={-3} /></div>
        <Headline text={text('mug.head')} at={B(9)} stagger={4} size={100} style={{ marginTop: 56 }} />
        <Sub at={B(16)} size={44} color={C.ink} style={{ marginTop: 36, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ marginTop: 4 }}><Icon name="card" size={46} stroke={2} /></span>
          <span>“{text('mug.paid')}”</span>
        </Sub>
      </Words>
      <PhoneShot
        section="mug"
        clip="mug"
        map={[[0, 0.5], [2, pressT('mug', 0)], [4, pressT('mug', 1)], [6.5, stampT - 0.3], [8, stampT + 0.6], [16, paidT], [24, Math.min(paidT + 4.2, mugPaid + 3.5)]]}
        keys={[
          { at: 0, win: PHONE, cam: fit },
          { at: 6.6, win: WIDE, cam: on(receipt, { pad: 24 }), shadow: C.mint, dur: 1 },
          { at: 10, cam: on({ x: amount.x - 30, y: amount.y - 20, w: amount.w + 60, h: amount.h + 40 }, { max: 3 }), dur: 0.9 },
          { at: 15.4, cam: on(union(payment, paidLine), { pad: 26 }), dur: 1 },
        ]}
        marks={[
          { from: 10.6, to: 15.4, box: { ...amount, x: amount.x - 4, w: amount.w + 8 } },
          { from: 16.2, to: 24, box: paidLine },
        ]}
      />
    </DemoStage>
  );
}

// ---------- 4b. PayPal's record, read back from the sandbox API ----------
export const recordCues: Cue[] = [
  { section: 'record', beat: 2, sfx: 'tap', volume: 0.6 },
  { section: 'record', beat: 4, sfx: 'tap', volume: 0.6 },
  { section: 'record', beat: 6, sfx: 'tap', volume: 0.6 },
  { section: 'record', beat: 9, sfx: 'register', volume: 0.6 },
];

function Typed({ value, at }: { value: string; at: number }) {
  const frame = useCurrentFrame();
  const n = Math.round(prog(frame, at, 12, (x) => x) * value.length);
  return <>{value.slice(0, n)}<span style={{ opacity: 0 }}>{value.slice(n)}</span></>;
}

function Status({ children }: { children: string }) {
  return <span style={{ padding: '4px 14px', border: `2.5px solid ${C.ink}`, borderRadius: 6, background: C.mint, fontFamily: BODY, fontWeight: 700, fontSize: 28, letterSpacing: '0.01em' }}>{children}</span>;
}

export function Record() {
  const { frame, B } = useSection('record');
  const hold = record.holds[0], cap = record.captures[0];
  const rows = [
    { key: 'record.order', at: 2, id: record.order.id, status: record.order.status, amount: null },
    { key: 'record.hold', at: 4, id: hold.id, status: hold.status, amount: hold.amount },
    { key: 'record.capture', at: 6, id: cap.id, status: cap.status, amount: cap.amount },
  ];
  const took = pageBox('paid', 'start', 'took');
  const entry = pageBox('paid', 'start', 'entry');
  const enter = prog(frame, 0, 12);
  return (
    <DemoStage>
      <div style={{ position: 'absolute', left: 110, top: 140, width: 840, opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
        <Sheet offset={C.mint} depth={14} style={{ padding: '34px 40px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, letterSpacing: '-0.04em' }}>{text('record.title')}</div>
            <span style={{ padding: '6px 14px', background: C.surface, border: `2px solid ${C.line}`, borderRadius: 6, fontFamily: BODY, fontWeight: 650, fontSize: 28 }}>{text('record.source')}</span>
          </div>
          {rows.map((r) => {
            const p = prog(frame, B(r.at), 10);
            const isCapture = r.key === 'record.capture';
            const band = isCapture ? prog(frame, B(11), 12) : 0;
            return (
              <div key={r.key} style={{ borderTop: `2px dashed ${C.line}`, marginTop: 20, paddingTop: 18, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: BODY, fontWeight: 650, fontSize: 34, color: C.muted }}>{text(r.key)}</span>
                  {r.amount && <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>${r.amount.value} <span style={{ fontSize: 30, fontWeight: 800 }}>{r.amount.currency}</span></span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 6 }}>
                  <span style={{ position: 'relative', fontFamily: MONO, fontWeight: 700, fontSize: 46, letterSpacing: '0.01em' }}>
                    <span style={{ position: 'absolute', left: -6, right: -6, bottom: 2, height: '0.42em', background: C.yellow, transformOrigin: 'left', transform: `scaleX(${band})` }} />
                    <span style={{ position: 'relative' }}><Typed value={r.id} at={B(r.at)} /></span>
                  </span>
                  <span style={{ opacity: prog(frame, B(r.at) + 10, 6) }}><Status>{r.status}</Status></span>
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: `2px dashed ${C.line}`, marginTop: 22, paddingTop: 20, fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, letterSpacing: '-0.03em', opacity: prog(frame, B(9), 8) }}>
            {text('record.sum')}
          </div>
        </Sheet>
        <Sub at={B(11)} size={44} color={C.ink} style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 16 }}>
          {text('record.match')} <span style={{ fontFamily: DISPLAY, fontWeight: 900 }}>→</span>
        </Sub>
      </div>
      <PhoneShot
        section="record"
        clip="paid"
        map={[[0, 0.4], [16, clip('paid').duration - 0.1]]}
        showSpeed={false}
        keys={[
          { at: 0, win: WIDE, cam: on(union(entry, took), { pad: 20 }), shadow: C.mint },
          { at: 10.6, cam: on({ x: took.x - 70, y: took.y - 30, w: took.w + 80, h: took.h + 60 }, { max: 2.9 }), dur: 1 },
        ]}
        marks={[{ from: 11, to: 16, box: { x: took.x - 2, y: took.y + 19.5, w: 131, h: 19 } }]}
      />
    </DemoStage>
  );
}
