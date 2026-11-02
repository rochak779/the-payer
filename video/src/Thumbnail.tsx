import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from 'remotion';
import { Stamp } from './components/ui';
import { mark } from './clips';
import './fonts';
import { BODY, C, DISPLAY } from './theme';

// Positions for the YouTube still (1280 x 720) and the Devpost still (1200 x 800, the 3:2 Devpost asks for).
const LAYOUTS = {
  youtube: { split: 640, text: [70, 120, 600], win: [700, 150, 520, 330], approve: [706, 528], block: [1018, 536] },
  devpost: { split: 600, text: [60, 160, 540], win: [640, 190, 500, 330], approve: [636, 572], block: [930, 580] },
};

/** The thumbnail: the wordmark, the promise, and the mug's receipt from the real recording. */
export function Thumbnail({ layout = 'youtube' }: { layout?: keyof typeof LAYOUTS }) {
  const L = LAYOUTS[layout];
  const paid = mark('mug', 'paid');
  const r = paid.boxes.receipt!;
  // Show the receipt at 2x, in a window on the yellow field.
  const s = 1.25, [winX, winY, winW, winH] = L.win;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 8;
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <div style={{ position: 'absolute', left: L.split, top: 0, right: 0, bottom: 0, background: C.yellow }} />
      <div style={{ position: 'absolute', left: L.text[0], top: L.text[1], width: L.text[2] }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 132, lineHeight: 0.95, letterSpacing: '-0.045em', color: C.ink }}>
          The Payer<span style={{ color: C.yellow }}>.</span>
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 58, lineHeight: 1.04, letterSpacing: '-0.035em', color: C.ink, marginTop: 30 }}>
          Your AI agent pays<br />only by your <span style={{ position: 'relative', display: 'inline-block' }}><span style={{ position: 'absolute', left: -2, right: -2, bottom: 2, height: '0.22em', background: C.yellow }} /><span style={{ position: 'relative' }}>rules.</span></span>
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 650, fontSize: 30, color: C.muted, marginTop: 34 }}>PayPal sandbox · Channel3</div>
      </div>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, border: `3px solid ${C.ink}`, borderRadius: 12, overflow: 'hidden', boxShadow: `14px 14px 0 ${C.mint}`, background: C.cream }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1260, height: 2640, transformOrigin: '0 0', transform: `translate(${winW / 2 - cx * s * 1}px, ${winH / 2 - cy * s}px) scale(${s / 3})` }}>
          {/* A still is one frame long and Remotion clamps a frozen frame to that, so the clip time goes in trimBefore. */}
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile('rec/mug.mp4')} trimBefore={Math.round((paid.t + 0.5) * 30)} muted style={{ width: 1260, height: 2640 }} />
          </Freeze>
        </div>
      </div>
      <div style={{ position: 'absolute', left: L.approve[0], top: L.approve[1] }}><Stamp kind="approve" at={-100} size={40} tilt={-5} /></div>
      <div style={{ position: 'absolute', left: L.block[0], top: L.block[1] }}><Stamp kind="block" at={-100} size={40} tilt={4} /></div>
    </AbsoluteFill>
  );
}
