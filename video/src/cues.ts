import type { SectionId } from './timing';

export type Sfx = 'stamp' | 'deny' | 'register' | 'whoosh' | 'tap' | 'powerdown';
/** A sound effect on a beat of a section. The files are rendered by music/render.mjs (music/sfx.js). */
export type Cue = { section: SectionId; beat: number; sfx: Sfx; volume?: number };
