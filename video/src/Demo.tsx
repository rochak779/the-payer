import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Dock } from './components/Stage';
import { MUSIC_FILE } from './config';
import type { Cue } from './cues';
import './fonts';
import { Mug, mugCues, Record, recordCues, Rules, rulesCues } from './scenes/Demo1';
import { Headphones, headphonesCues, Nephew, nephewCues, Shop, shopCues } from './scenes/Demo2';
import { Evals, evalsCues, Live, liveCues, Off, offCues } from './scenes/Demo3';
import { Hook, hookCues, Pitch, promiseCues } from './scenes/Open';
import { Outro, outroCues } from './scenes/Outro';
import { barsOf, frameAt, SECTIONS, startBar, TOTAL_FRAMES, type SectionId } from './timing';

const SCENES: Record<SectionId, () => React.ReactElement> = {
  hook: Hook, promise: Pitch, rules: Rules, mug: Mug, record: Record, nephew: Nephew,
  headphones: Headphones, shop: Shop, off: Off, live: Live, evals: Evals, outro: Outro,
};
const CUES: Cue[] = [...hookCues, ...promiseCues, ...rulesCues, ...mugCues, ...recordCues, ...nephewCues, ...headphonesCues, ...shopCues, ...offCues, ...liveCues, ...evalsCues, ...outroCues];

/** The whole film: each story beat is a Sequence that starts on its bar, over one music file and the effects. */
export function Demo() {
  return (
    <AbsoluteFill style={{ background: '#fefaf4' }}>
      {SECTIONS.map(({ id }) => {
        const from = frameAt(startBar(id));
        const to = id === 'outro' ? TOTAL_FRAMES : frameAt(startBar(id) + barsOf(id));
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={from} durationInFrames={to - from} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Dock />
      <Audio src={staticFile(MUSIC_FILE)} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={frameAt(startBar(c.section), c.beat)} durationInFrames={90} name={`sfx ${c.sfx}`}>
          <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.volume ?? 0.8} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
