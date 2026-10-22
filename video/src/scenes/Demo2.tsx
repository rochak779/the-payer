import { fit, on, PHONE, PhoneShot, WIDE } from '../components/PhoneShot';
import { DemoStage, Words } from '../components/Stage';
import { Headline, prog, shake, Stamp, Sub, TaskField, useSection } from '../components/ui';
import { clip, event, markT, pageBox, pressT, union } from '../clips';
import type { Cue } from '../cues';
import { text } from '../story';
import { C, DISPLAY } from '../theme';

// ---------- 5. The present asks first; one tap approves it; it's paid ----------
export const nephewCues: Cue[] = [
  { section: 'nephew', beat: 7, sfx: 'stamp', volume: 0.85 },
  { section: 'nephew', beat: 12.6, sfx: 'whoosh', volume: 0.45 },
  { section: 'nephew', beat: 19, sfx: 'stamp', volume: 0.9 },
  { section: 'nephew', beat: 24, sfx: 'register', volume: 0.75 },
];

export function Nephew() {
  const { frame, B } = useSection('nephew');
  const asked = pageBox('nephew', 'asked', 'receipt');
  const apv = pageBox('nephew', 'approvals', 'receipt');
  const reasons = pageBox('nephew', 'approvals', 'reasons');
  const approve = pageBox('nephew', 'approvals', 'approve');
  const head = pageBox('nephew', 'paid', 'head');
  // Activity's entry for the present (read off the recording): "Brick & Bolt Toys · paid", then the log lines
  // "You approved $38 …" and "Charge of $38 … approved." (PayPal's own line sits under the dock in this take.)
  const paidSub = { x: 41, y: head.y + 48, w: 141, h: 18 };
  const approvedLine = { x: 104, y: head.y + 383, w: 221, h: 18 };
  const chargedLine = { x: 104, y: head.y + 452, w: 256, h: 18 };
  const askT = event('nephew', 'stamp', 0, 'Asking').t;
  const approveT = pressT('nephew', 3);
  return (
    <DemoStage transform={shake(frame, [B(7), B(19)], 10)}>
      <Words>
        <TaskField text={text('nephew.task')} at={B(0)} style={{ opacity: 1 - prog(frame, B(13.5), 6) }} />
        <div style={{ position: 'absolute', top: 330, opacity: 1 - prog(frame, B(13.5), 6) }}>
          <div style={{ height: 70 }}><Stamp kind="ask" at={B(7)} size={62} tilt={-3} /></div>
          <Headline text={text('nephew.head')} at={B(6.6)} stagger={4} size={96} style={{ marginTop: 50 }} />
        </div>
        {frame >= B(13.5) && (
          <div style={{ position: 'absolute', top: 0 }}>
            <Headline text={text('nephew.tap')} at={B(14)} stagger={4} size={112} out={B(23.6)} />
            <div style={{ height: 80, marginTop: 50, opacity: 1 - prog(frame, B(23.6), 6) }}><Stamp kind="approve" at={B(19)} size={66} tilt={-4} /></div>
          </div>
        )}
        {frame >= B(23.6) && <Headline text={text('nephew.paid')} at={B(24)} stagger={4} size={124} style={{ position: 'absolute', top: 40 }} />}
      </Words>
      <PhoneShot
        section="nephew"
        clip="nephew"
        map={[[0, 0.4], [2, pressT('nephew', 0)], [4, pressT('nephew', 1)], [6, askT - 0.2], [7, askT + 0.62], [12, pressT('nephew', 2)], [13, markT('nephew', 'approvals') - 0.3], [18, approveT], [19, approveT + 0.36], [21, markT('nephew', 'empty')], [22, pressT('nephew', 4)], [23, pressT('nephew', 4) + 0.6], [32, clip('nephew').duration - 0.1]]}
        keys={[
          { at: 0, win: PHONE, cam: fit },
          { at: 6.2, win: WIDE, cam: on(asked, { pad: 24 }), shadow: C.yellow, dur: 1 },
          { at: 11.6, win: PHONE, cam: fit, dur: 0.8 },
          { at: 13.2, win: WIDE, cam: on(apv, { pad: 20 }), dur: 1 },
          { at: 15.5, cam: on(union(reasons, approve), { pad: 24 }), dur: 1.2 },
          { at: 18.4, cam: on({ ...apv, h: 200 }, { pad: 24 }), shadow: C.mint, dur: 0.8 },
          { at: 20.6, win: PHONE, cam: fit, dur: 0.8 },
          { at: 23.2, win: WIDE, cam: on({ x: 20, y: head.y - 12, w: 380, h: 170 }, { pad: 20 }), dur: 1 },
          { at: 27, cam: on({ x: 20, y: approvedLine.y - 40, w: 380, h: chargedLine.y + 18 - approvedLine.y + 80 }, { pad: 10 }), dur: 1.2 },
        ]}
        marks={[
          { from: 16, to: 18.2, box: reasons },
          { from: 24.2, to: 27, box: paidSub },
          { from: 27.8, to: 32, box: approvedLine },
          { from: 28.4, to: 32, box: chargedLine },
        ]}
      />
    </DemoStage>
  );
}

// ---------- 6. Refurbished headphones: blocked, with the reason ----------
export const headphonesCues: Cue[] = [{ section: 'headphones', beat: 6, sfx: 'stamp', volume: 0.95 }];

export function Headphones() {
  const { frame, B } = useSection('headphones');
  const receipt = pageBox('headphones', 'blocked', 'receipt');
  const reasons = pageBox('headphones', 'blocked', 'reasons');
  const blockT = event('headphones', 'stamp', 0, 'Blocked').t;
  return (
    <DemoStage transform={shake(frame, [B(6)], 12)}>
      <Words>
        <TaskField text={text('headphones.task')} at={B(0)} dur={14} />
        <div style={{ height: 70, marginTop: 64 }}><Stamp kind="block" at={B(6)} size={66} tilt={-3} /></div>
        <Headline text={text('headphones.head')} at={B(6.3)} stagger={4} size={100} band={C.pink} style={{ marginTop: 50 }} />
        <Sub at={B(7.5)} size={44} style={{ marginTop: 30, width: 760 }}>{text('headphones.sub')}</Sub>
      </Words>
      <PhoneShot
        section="headphones"
        clip="headphones"
        map={[[0, 0.4], [1.5, pressT('headphones', 0)], [3, pressT('headphones', 1)], [5, blockT - 0.15], [6, blockT + 0.6], [16, clip('headphones').duration - 0.1]]}
        keys={[
          { at: 0, win: PHONE, cam: fit },
          { at: 5.2, win: WIDE, cam: on(receipt, { pad: 24 }), shadow: C.pink, dur: 1 },
          { at: 9, cam: on(reasons, { pad: 30 }), dur: 1 },
        ]}
        marks={[{ from: 9.6, to: 16, box: { ...reasons, x: reasons.x + 62, w: reasons.w - 62 } }]}
      />
    </DemoStage>
  );
}

// ---------- 7. The shop tries it on: three tries, all refused ----------
export const shopCues: Cue[] = [
  { section: 'shop', beat: 4, sfx: 'deny', volume: 0.9 },
  { section: 'shop', beat: 10, sfx: 'deny', volume: 0.9 },
  { section: 'shop', beat: 16, sfx: 'deny', volume: 0.9 },
  { section: 'shop', beat: 21.6, sfx: 'whoosh', volume: 0.5 },
];

export function Shop() {
  const { frame, B } = useSection('shop');
  const lines = [1, 2, 3].map((i) => pageBox('shop', `refused-${i}`, 'line'));
  const buttons = [1, 2, 3].map((i) => pageBox('shop', `refused-${i}`, 'buttons'));
  const explainer = pageBox('shop', 'explainer', 'explainer');
  const tries = [
    { key: 'shop.more', at: 4 },
    { key: 'shop.other', at: 10 },
    { key: 'shop.again', at: 16 },
  ];
  const clear = prog(frame, B(21.6), 8);
  return (
    <DemoStage transform={shake(frame, [B(0), B(4), B(10), B(16)], 11)}>
      <Words top={190}>
        <Headline text={text('shop.head')} at={B(0)} stagger={4} size={104} out={B(21.6)} />
        <div style={{ marginTop: 56, opacity: 1 - clear }}>
          {tries.map((t) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 104, borderTop: `3px dashed ${C.line}`, opacity: prog(frame, B(t.at) - 8, 8) }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, letterSpacing: '-0.03em' }}>{text(t.key)}</span>
              <Stamp kind="refused" at={B(t.at)} size={46} tilt={-4} />
            </div>
          ))}
        </div>
        {frame >= B(21.6) && (
          <div style={{ position: 'absolute', top: 0 }}>
            <Sub at={B(22)} size={50} color={C.ink} style={{ width: 800, fontWeight: 500 }}>{text('shop.paypal')}</Sub>
            <Headline text={text('shop.penny')} at={B(25)} stagger={4} size={104} style={{ marginTop: 60 }} />
          </div>
        )}
      </Words>
      <PhoneShot
        section="shop"
        clip="shop"
        map={[[0, 0.3], [4, pressT('shop', 0)], [10, pressT('shop', 1)], [16, pressT('shop', 2)], [22, markT('shop', 'explainer')], [32, clip('shop').duration - 0.1]]}
        keys={[
          { at: 0, win: PHONE, cam: fit, shadow: C.ink },
          { at: 2.6, win: WIDE, cam: on(union(lines[0], buttons[0]), { pad: 20 }), dur: 1 },
          { at: 9, cam: on(union(lines[1], buttons[1]), { pad: 20 }), shadow: C.pink, dur: 0.9 },
          { at: 15, cam: on(union(lines[2], buttons[2]), { pad: 20 }), dur: 0.9 },
          { at: 21.8, cam: on(explainer, { pad: 30 }), dur: 1 },
        ]}
        marks={[
          { from: 4.3, to: 9.4, box: lines[0] },
          { from: 10.3, to: 15.4, box: lines[1] },
          { from: 16.3, to: 21.8, box: lines[2] },
          { from: 22.6, to: 32, box: explainer },
        ]}
      />
    </DemoStage>
  );
}
