import { Composition, Still } from 'remotion';
import { Demo } from './Demo';
import { Thumbnail } from './Thumbnail';
import { FPS, TOTAL_FRAMES } from './timing';

export function RemotionRoot() {
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    </>
  );
}
