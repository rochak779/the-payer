import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, FIELD_X } from '../theme';
import { frameAt, startBar, type SectionId } from '../timing';
import { prog } from './ui';

/** The demo layout: cream on the left for the words, the app's flat yellow field on the right for the phone. */
export function DemoStage({ children, transform, fieldFrom = 0 }: { children: ReactNode; transform?: string; fieldFrom?: number }) {
  const frame = useCurrentFrame();
  const slide = fieldFrom > 0 ? 1 - prog(frame, fieldFrom - 10, 10) : 0;
  return (
    <AbsoluteFill style={{ background: C.cream, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform }}>
        <div style={{ position: 'absolute', left: FIELD_X + slide * 920, top: -40, width: 1920 - FIELD_X + 80, height: 1160, background: C.yellow }} />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** The left column, where the headline and its lines sit. */
export function Words({ children, top = 190 }: { children: ReactNode; top?: number }) {
  return <div style={{ position: 'absolute', left: 110, top, width: 840 }}>{children}</div>;
}

// ---------- The chapter dock: the app's ink dock, its yellow marker on the beat being shown ----------
const CHAPTERS: { label: string; sections: SectionId[] }[] = [
  { label: 'Rules', sections: ['rules'] },
  { label: 'Approve', sections: ['mug', 'record'] },
  { label: 'Ask', sections: ['nephew'] },
  { label: 'Block', sections: ['headphones'] },
  { label: 'Overcharge', sections: ['shop'] },
  { label: 'Off switch', sections: ['off'] },
  { label: 'Live', sections: ['live'] },
  { label: 'Evals', sections: ['evals'] },
];

export function Dock() {
  const frame = useCurrentFrame();
  const firstF = frameAt(startBar('rules'));
  const lastF = frameAt(startBar('outro'));
  if (frame < firstF - 12 || frame > lastF + 12) return null;
  const shown = prog(frame, firstF - 12, 12) * (1 - prog(frame, lastF - 2, 10));
  // How far along each chapter's marker is: it slides in as the chapter starts.
  const starts = CHAPTERS.map((c) => frameAt(startBar(c.sections[0])));
  return (
    <div style={{ position: 'absolute', left: 110, top: 52, display: 'flex', gap: 6, padding: 7, background: C.ink, borderRadius: 8, opacity: shown, transform: `translateY(${(1 - shown) * -30}px)`, boxShadow: '0 6px 22px rgb(28 28 28 / 0.16)' }}>
      {CHAPTERS.map((c, i) => {
        const on = prog(frame, starts[i] - 4, 10) * (i + 1 < starts.length ? 1 - prog(frame, starts[i + 1] - 4, 10) : 1);
        const done = frame >= starts[i];
        return (
          <div key={c.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 15px', borderRadius: 5,
            background: interpolateColor(on), color: on > 0.5 ? C.ink : done ? C.cream : 'rgb(254 250 244 / 0.55)',
            fontFamily: BODY, fontWeight: 700, fontSize: 26,
          }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
            <span style={{ maxWidth: on * 190, overflow: 'hidden', whiteSpace: 'nowrap', opacity: on }}>{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function interpolateColor(p: number): string {
  // ink → yellow
  const a = [0x1c, 0x1c, 0x1c], b = [0xff, 0xca, 0x49];
  const c = a.map((v, i) => Math.round(interpolate(p, [0, 1], [v, b[i]])));
  return `rgb(${c.join(' ')})`;
}
