// "Held to the Penny": the original score for The Payer's demo video.
//
// Written in code with Tone.js and rendered offline in headless Chromium by music/render.mjs.
// Nothing is sampled: every drum, bass, chord and riser below is synthesised here.
//
// A minor, 124 BPM, 4/4. The arrangement follows the story map in src/timing.ts, bar for bar:
//   hook        tension: a ticking clock, a drone that opens up, a half-time heartbeat, a riser and a gap
//   promise     the drop: four-on-the-floor, a rolling saw bass pumped by the kick, chord stabs, the lead hook
//   rules/mug   driving verses (arp, stabs), the lead returns for the mug
//   record      a lift: the progression climbs while PayPal's record is on screen
//   nephew      a warmer turn of the chords; headphones go dark (E7 flat 9) and build
//   shop        the second drop, for the shop's three tries
//   off         breakdown: the agent is switched off and the band stops with it; pad and a soft pluck
//   live        the build back: a filtered kick opens up, bass returns, a long riser and a snare roll
//   evals       the third drop
//   outro       the progression resolves to A major; a final hit and a long tail
//
// This file runs in the page. render.mjs passes it the timing map and receives the rendered samples.

/* global Tone */
window.renderScore = async function renderScore(timing, opts = {}) {
  const { BPM, SECTIONS, TAIL_SECONDS, OFF_SWITCH_BEAT, SAMPLE_RATE } = timing;
  const mute = new Set(opts.mute ?? []); // e.g. ['drums'] to measure a group on its own
  const beat = 60 / BPM;
  const bar = beat * 4;
  const step = beat / 4; // a sixteenth
  const totalBars = SECTIONS.reduce((n, s) => n + s.bars, 0);
  const duration = totalBars * bar + TAIL_SECONDS;
  const T = (b, bt = 0, st = 0) => b * bar + bt * beat + st * step; // bar, beat, sixteenth → seconds

  const starts = {};
  { let b = 0; for (const s of SECTIONS) { starts[s.id] = b; b += s.bars; } }
  const sectionAt = (b) => {
    let found = SECTIONS[0].id;
    for (const s of SECTIONS) if (b >= starts[s.id]) found = s.id;
    return found;
  };
  const S = starts;
  const offCut = S.off + OFF_SWITCH_BEAT / 4; // the bar (fractional) where the off switch is pressed

  // ---------- Harmony ----------
  // Voicings move by step between chords. root: bass note; stab: the chord stab voicing; arp: arpeggio tones.
  const CHORDS = {
    Am9: { root: 'A1', stab: ['C4', 'E4', 'G4', 'B4'], arp: ['A4', 'C5', 'E5', 'G5', 'B5'] },
    Dm9: { root: 'D2', stab: ['C4', 'E4', 'F4', 'A4'], arp: ['D5', 'F5', 'A5', 'C5', 'E5'] },
    Fmaj9: { root: 'F1', stab: ['C4', 'E4', 'G4', 'A4'], arp: ['F4', 'A4', 'C5', 'E5', 'G5'] },
    E7sus: { root: 'E1', stab: ['B3', 'D4', 'E4', 'A4'], arp: ['E4', 'A4', 'B4', 'D5', 'E5'] },
    E7: { root: 'E1', stab: ['B3', 'D4', 'E4', 'G#4'], arp: ['E4', 'G#4', 'B4', 'D5', 'E5'] },
    E7b9: { root: 'E1', stab: ['B3', 'D4', 'F4', 'G#4'], arp: ['E4', 'G#4', 'B4', 'D5', 'F5'] },
    G6: { root: 'G1', stab: ['B3', 'D4', 'E4', 'G4'], arp: ['G4', 'B4', 'D5', 'E5', 'G5'] },
    Em7: { root: 'E1', stab: ['B3', 'D4', 'E4', 'G4'], arp: ['E4', 'G4', 'B4', 'D5', 'E5'] },
    Asus2: { root: 'A1', stab: ['B3', 'E4', 'A4', 'B4'], arp: ['A4', 'B4', 'E5', 'A5', 'B5'] },
    A: { root: 'A1', stab: ['C#4', 'E4', 'A4', 'C#5'], arp: ['A4', 'C#5', 'E5', 'A5', 'C#6'] },
  };
  // One entry per bar of each section; 'X/Y' splits the bar: X on beats 1–2, Y on beats 3–4.
  const MAIN = ['Am9', 'Dm9', 'Fmaj9', 'E7sus/E7'];
  const PROGRESSION = {
    hook: ['Am9', 'Am9', 'Am9', 'Am9', 'Fmaj9', 'Fmaj9', 'E7sus', 'E7'],
    promise: [...MAIN, 'Am9', 'Dm9'],
    rules: [...MAIN, 'Am9', 'Dm9'],
    mug: [...MAIN, 'Am9', 'Dm9'],
    record: ['Fmaj9', 'G6', 'Am9', 'E7sus/E7'],
    nephew: ['Fmaj9', 'G6', 'Em7', 'Am9', 'Fmaj9', 'G6', 'E7sus', 'E7'],
    headphones: ['Dm9', 'E7b9', 'Dm9', 'E7b9'],
    shop: [...MAIN, ...MAIN],
    off: ['E7sus/E7', 'Am9', 'Fmaj9', 'Am9', 'Dm9', 'E7sus/E7'],
    live: [...MAIN, 'Fmaj9', 'E7sus/E7'],
    evals: [...MAIN, 'Am9', 'Dm9'],
    outro: ['Fmaj9', 'G6', 'Asus2', 'A', 'A', 'A'],
  };
  const chordAt = (b, bt = 0) => {
    const id = sectionAt(b);
    const name = PROGRESSION[id][Math.floor(b - S[id])];
    const [x, y] = name.split('/');
    return CHORDS[y && bt >= 2 ? y : x];
  };
  const up = (note, semis) => Tone.Frequency(note).transpose(semis).toNote();

  // Which parts play in which bars. Bars are [from, to).
  const inAny = (b, ranges) => ranges.some(([a, z]) => b >= a && b < z);
  // A breath of silence before each drop.
  const GAPS = [[S.promise - 0.25, S.promise], [S.shop - 0.125, S.shop], [S.evals - 0.25, S.evals]];
  const PLAN = {
    kick: [[S.promise, offCut], [S.live, S.live + 5.75], [S.evals, S.outro + 4]],
    clap: [[S.promise, offCut], [S.live + 2, S.live + 5.75], [S.evals, S.outro + 4]],
    openHat: [[S.promise, S.rules], [S.mug, S.headphones], [S.shop, offCut], [S.live + 4, S.live + 5.75], [S.evals, S.outro + 4]],
    closedHat: [[S.hook + 1, S.hook + 7.75], [S.promise, offCut], [S.live + 1, S.live + 5.75], [S.evals, S.outro + 4]],
    bass: [[S.promise, offCut], [S.live + 2, S.live + 5.75], [S.evals, S.outro + 4]],
    stabs: [[S.promise, S.rules], [S.mug, S.headphones + 4], [S.shop, offCut], [S.evals, S.outro + 4]],
    arp: [[S.rules, offCut], [S.live, S.live + 5.75], [S.evals, S.outro + 4]],
    lead: [[S.promise, S.rules], [S.mug, S.record], [S.shop, S.shop + 6], [S.evals, S.evals + 6]],
  };

  // Built on Tone's OfflineContext and rendered with render(false): Tone.Offline() yields to a timer once per
  // second of audio, and headless Chrome throttles those timers, which made a render take minutes.
  const t0 = performance.now();
  const original = Tone.getContext();
  const offline = new Tone.OfflineContext(2, duration, SAMPLE_RATE);
  Tone.setContext(offline);
  try {
  await (async () => {
    // ---------- Mix bus ----------
    const glue = new Tone.Compressor({ threshold: -18, ratio: 2.5, attack: 0.012, release: 0.14, knee: 6 });
    const limiter = new Tone.Limiter(-1.5);
    const masterBus = new Tone.Gain(0.9).chain(glue, limiter, Tone.getDestination());

    // Reverb: a convolver over a decaying noise tail made here (seeded, so every render is the same).
    let seed = 20261022;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const ctx = Tone.getContext();
    const tail = (seconds, curve) => {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, curve);
      }
      return new Tone.ToneAudioBuffer(buf);
    };
    const hall = new Tone.Convolver(tail(3.2, 3.4));
    const hallIn = new Tone.Gain(0.5).chain(new Tone.Filter(320, 'highpass'), hall, masterBus);
    const room = new Tone.Convolver(tail(0.9, 4));
    const roomIn = new Tone.Gain(0.4).chain(room, masterBus);
    const echo = new Tone.FeedbackDelay(beat * 0.75, 0.32); // a dotted eighth
    const echoIn = new Tone.Gain(0.5).chain(new Tone.Filter(4500, 'lowpass'), echo, masterBus);
    echo.wet.value = 1;

    // Sidechain-style pumping: everything melodic runs through this gain, which dips on every kick.
    const pump = new Tone.Gain(1).connect(masterBus);
    const kicks = [];

    const send = (node, to, amount) => { const g = new Tone.Gain(amount); node.connect(g); g.connect(to); return g; };

    // ---------- Drums ----------
    const drumBus = new Tone.Gain(mute.has('drums') ? 0 : 1).connect(masterBus);
    const kickFilter = new Tone.Filter(18000, 'lowpass', -24).connect(drumBus);
    const kick = new Tone.MembraneSynth({ pitchDecay: 0.042, octaves: 4.2, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.05 }, volume: -5 });
    kick.chain(new Tone.Distortion({ distortion: 0.12, wet: 0.35 }), kickFilter);
    const kickClick = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.0005, decay: 0.01, sustain: 0 }, volume: -22 });
    kickClick.chain(new Tone.Filter(2600, 'highpass'), kickFilter);

    const clap = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.13, sustain: 0 }, volume: -7 });
    const clapOut = new Tone.Filter(1350, 'bandpass', -12);
    clap.chain(new Tone.Filter(380, 'highpass'), clapOut, drumBus);
    send(clapOut, roomIn, 0.5);
    clapOut.Q.value = 0.9;

    const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.09, sustain: 0 }, volume: -16 });
    const snareOut = new Tone.Filter(900, 'highpass');
    snare.chain(snareOut, drumBus);
    send(snareOut, hallIn, 0.25);
    const snareBody = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 1.5, envelope: { attack: 0.001, decay: 0.08, sustain: 0 }, volume: -20 }).connect(drumBus);

    const closedHat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.032, sustain: 0 }, volume: -18 });
    closedHat.chain(new Tone.Filter(7800, 'highpass'), new Tone.Panner(0.18), drumBus);
    const openHat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.2, sustain: 0 }, volume: -18 });
    const openOut = new Tone.Filter(6800, 'highpass');
    openHat.chain(openOut, new Tone.Panner(-0.15), drumBus);
    send(openOut, roomIn, 0.3);

    // ---------- Bass: a sine sub under a rolling saw, both pumped ----------
    const bassBus = new Tone.Gain(mute.has('bass') ? 0 : 1).connect(pump);
    const sub = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.004, decay: 0.1, sustain: 0.85, release: 0.05 }, volume: -15 }).connect(bassBus);
    const saw = new Tone.MonoSynth({
      oscillator: { type: 'fatsawtooth', count: 2, spread: 16 },
      filter: { type: 'lowpass', Q: 2.5, rolloff: -24 },
      envelope: { attack: 0.003, decay: 0.14, sustain: 0.45, release: 0.05 },
      filterEnvelope: { attack: 0.002, decay: 0.11, sustain: 0.2, release: 0.08, baseFrequency: 230, octaves: 3.6, exponent: 2 },
      volume: -14,
    });
    saw.chain(new Tone.Distortion({ distortion: 0.3, wet: 0.25 }), bassBus);

    // ---------- Chords: stabs and a pad ----------
    const stabBus = new Tone.Gain(mute.has('chords') ? 0 : 1);
    const stabFilter = new Tone.Filter(2600, 'lowpass', -24);
    stabBus.chain(stabFilter, pump);
    send(stabFilter, hallIn, 0.22);
    send(stabFilter, echoIn, 0.12);
    const stabVoices = [0, 1, 2, 3].map((i) => new Tone.Synth({ oscillator: { type: 'fatsawtooth', count: 3, spread: 26 }, envelope: { attack: 0.004, decay: 0.22, sustain: 0.25, release: 0.16 }, volume: -14 }).connect(new Tone.Panner([-0.3, -0.1, 0.1, 0.3][i]).connect(stabBus)));

    const padBus = new Tone.Gain(mute.has('chords') ? 0 : 1);
    const padFilter = new Tone.Filter(900, 'lowpass', -12);
    padBus.chain(padFilter, pump);
    send(padFilter, hallIn, 0.6);
    const padVoices = [0, 1, 2, 3, 4].map((i) => new Tone.Synth({ oscillator: { type: 'fatsawtooth', count: 3, spread: 38 }, envelope: { attack: 0.9, decay: 0.6, sustain: 0.85, release: 1.8 }, volume: -18 }).connect(new Tone.Panner([-0.45, -0.2, 0, 0.2, 0.45][i]).connect(padBus)));

    // ---------- Arp, lead and a soft pluck ----------
    const arpBus = new Tone.Gain(mute.has('arp') ? 0 : 1);
    const arpFilter = new Tone.Filter(3200, 'lowpass', -12);
    arpBus.chain(arpFilter, pump);
    send(arpFilter, echoIn, 0.42);
    send(arpFilter, hallIn, 0.15);
    const arp = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.06 }, volume: -13 }).connect(arpBus);

    const leadBus = new Tone.Gain(mute.has('lead') ? 0 : 1).connect(masterBus);
    const lead = new Tone.MonoSynth({
      oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, portamento: 0.025,
      filter: { type: 'lowpass', Q: 1.5, rolloff: -24 },
      envelope: { attack: 0.008, decay: 0.18, sustain: 0.55, release: 0.16 },
      filterEnvelope: { attack: 0.006, decay: 0.22, sustain: 0.45, release: 0.2, baseFrequency: 900, octaves: 2.8 },
      volume: -11,
    });
    const leadBell = new Tone.FMSynth({ harmonicity: 2, modulationIndex: 5, envelope: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.25 }, modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 }, volume: -19 });
    lead.connect(leadBus);
    leadBell.connect(leadBus);
    send(leadBus, echoIn, 0.3);
    send(leadBus, hallIn, 0.25);

    const pluck = new Tone.FMSynth({ harmonicity: 3, modulationIndex: 2.5, envelope: { attack: 0.003, decay: 0.9, sustain: 0, release: 0.9 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.3 }, volume: -10 });
    const pluckOut = new Tone.Gain(mute.has('lead') ? 0 : 1).connect(masterBus);
    pluck.connect(pluckOut);
    send(pluckOut, hallIn, 0.7);
    send(pluckOut, echoIn, 0.35);

    // ---------- FX: risers, swells, impacts ----------
    const fxBus = new Tone.Gain(mute.has('fx') ? 0 : 1).connect(masterBus);
    const riseNoise = new Tone.Noise('white');
    const riseFilter = new Tone.Filter(400, 'bandpass', -12);
    const riseGain = new Tone.Gain(0);
    riseNoise.chain(riseFilter, riseGain, fxBus);
    send(riseGain, hallIn, 0.4);
    riseFilter.Q.value = 2.2;
    const riseTone = new Tone.Oscillator(110, 'sawtooth');
    const riseToneGain = new Tone.Gain(0);
    riseTone.chain(new Tone.Filter(2400, 'lowpass'), riseToneGain, fxBus);

    const swellNoise = new Tone.Noise('pink');
    const swellGain = new Tone.Gain(0);
    swellNoise.chain(new Tone.Filter(2500, 'highpass'), swellGain, fxBus);
    send(swellGain, hallIn, 0.5);

    const boom = new Tone.MembraneSynth({ pitchDecay: 0.35, octaves: 3, envelope: { attack: 0.002, decay: 1.8, sustain: 0, release: 0.4 }, volume: -6 }).connect(fxBus);
    const crash = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 2.2, sustain: 0 }, volume: -23 });
    const crashOut = new Tone.Filter(5200, 'highpass');
    crash.chain(crashOut, fxBus);
    send(crashOut, hallIn, 0.6);
    const thump = new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.002, decay: 0.7, sustain: 0 }, volume: -10 });
    thump.chain(new Tone.Filter(300, 'lowpass'), fxBus);
    send(thump, hallIn, 0.5);

    // ---------- Scheduling helpers ----------
    const events = { kick: [], clap: [], snare: [], ch: [], oh: [], bass: [], stab: [], arp: [], lead: [] };
    // Each Tone instrument must be triggered in time order (a new note clears what's scheduled after it),
    // so notes go into a queue per instrument and are played sorted at the end.
    const queues = new Map();
    const q = (inst, t, fn) => { if (!queues.has(inst)) queues.set(inst, []); queues.get(inst).push([t, fn]); };

    function riser(fromBar, toBar, level = 0.5) {
      const a = T(fromBar), z = T(toBar);
      riseNoise.start(a).stop(z + 0.01);
      riseFilter.frequency.setValueAtTime(380, a);
      riseFilter.frequency.exponentialRampToValueAtTime(9500, z);
      riseGain.gain.setValueAtTime(0, a);
      riseGain.gain.linearRampToValueAtTime(level, z - 0.02);
      riseGain.gain.linearRampToValueAtTime(0, z);
      riseTone.start(a).stop(z + 0.01);
      riseTone.frequency.setValueAtTime(110, a);
      riseTone.frequency.exponentialRampToValueAtTime(1760, z);
      riseToneGain.gain.setValueAtTime(0, a);
      riseToneGain.gain.linearRampToValueAtTime(level * 0.16, z - 0.02);
      riseToneGain.gain.linearRampToValueAtTime(0, z);
    }
    const swells = [];
    function swell(toBar, lengthBeats = 4, level = 0.22) {
      swells.push([T(toBar) - lengthBeats * beat, T(toBar), level]);
    }
    function impact(atBar, size = 1) {
      const t = T(atBar);
      boom.triggerAttackRelease('A0', 1.5, t, 0.6 + 0.4 * size);
      crash.triggerAttackRelease(2, t, 0.5 + 0.5 * size);
      thump.triggerAttackRelease(0.6, t, size);
    }

    // ---------- The arrangement ----------
    const totalSteps = totalBars * 16;
    for (let i = 0; i < totalSteps; i++) {
      const b = Math.floor(i / 16), st = i % 16, bt = Math.floor(st / 4), sub16 = st % 4;
      const pos = b + st / 16; // fractional bar
      const t = T(b, 0, st);
      const id = sectionAt(b);
      if (inAny(pos, GAPS)) continue;

      // Kick: four on the floor while driving; the hook gets a half-time heartbeat, then fills in.
      const inHookPulse = id === 'hook' && b >= 4 && b < 6 && (st === 0 || st === 10);
      const inHookFill = id === 'hook' && b >= 6 && pos < 7.75 && sub16 === 0;
      if ((inAny(pos, PLAN.kick) && sub16 === 0) || inHookPulse || inHookFill) {
        events.kick.push([t, id === 'hook' ? 0.75 : 1]);
      }
      if (inAny(pos, PLAN.clap) && sub16 === 0 && (bt === 1 || bt === 3)) events.clap.push([t, 1]);
      if (inAny(pos, PLAN.closedHat)) {
        const accent = [0.45, 0.22, 0.85, 0.3][sub16];
        const hookRamp = id === 'hook' ? 0.25 + 0.75 * (pos / 8) : 1;
        events.ch.push([t, accent * hookRamp]);
      }
      if (inAny(pos, PLAN.openHat) && sub16 === 2) events.oh.push([t, 0.8]);

      // Bass: a sixteenth roll around the kick (steps 2-4 of each beat), the octave on the last.
      if (inAny(pos, PLAN.bass) && sub16 !== 0) {
        const c = chordAt(b, bt);
        const note = sub16 === 3 ? up(c.root, 12) : c.root;
        events.bass.push([t, note, step * 0.8, sub16 === 1 ? 0.95 : 0.8]);
      }

      // Stabs on the off-beats, with a pushed sixteenth before beat 3 in the drops.
      const isDrop = inAny(pos, [[S.promise, S.rules], [S.shop, offCut], [S.evals, S.outro]]);
      if (inAny(pos, PLAN.stabs) && (sub16 === 2 || (isDrop && st === 7))) {
        events.stab.push([t, chordAt(b, bt).stab, step * (st === 7 ? 0.9 : 1.6), isDrop ? 0.9 : 0.6]);
      }

      // Arp: chord tones up and down in sixteenths.
      if (inAny(pos, PLAN.arp)) {
        const c = chordAt(b, bt);
        const order = [0, 1, 2, 3, 4, 3, 2, 1];
        events.arp.push([t, c.arp[order[i % 8]], step * 0.9, [0.9, 0.5, 0.7, 0.5][sub16]]);
      }
    }

    // The lead hook: four bars, answered by itself. Sixteenth position, note, length in sixteenths.
    const HOOK = {
      Am9: [[0, 'E5', 3], [3, 'E5', 2], [6, 'G5', 2], [8, 'A5', 2], [11, 'G5', 1], [12, 'E5', 2], [14, 'D5', 2]],
      Dm9: [[0, 'C5', 3], [3, 'D5', 2], [6, 'F5', 2], [8, 'E5', 4], [13, 'D5', 3]],
      Fmaj9: [[0, 'C5', 3], [3, 'C5', 2], [6, 'E5', 2], [8, 'G5', 2], [11, 'A5', 1], [12, 'G5', 2], [14, 'E5', 2]],
      E7: [[0, 'B4', 3], [3, 'D5', 2], [6, 'E5', 3], [10, 'G#5', 2], [12, 'B5', 4]],
    };
    const leadKey = (b) => {
      const id = sectionAt(b);
      const name = PROGRESSION[id][Math.floor(b - S[id])].split('/')[0];
      return name === 'E7sus' ? 'E7' : name;
    };
    for (let b = 0; b < totalBars; b++) {
      if (!inAny(b, PLAN.lead)) continue;
      const phrase = HOOK[leadKey(b)];
      if (!phrase) continue;
      for (const [st, note, len] of phrase) events.lead.push([T(b, 0, st), note, len * step * 0.92]);
    }

    // Build-ups: snare rolls in eighths, then sixteenths, then thirty-seconds, getting louder, then the gap.
    function roll(fromBar, toBar, gapBeats = 1) {
      const end = toBar - gapBeats / 4;
      let p = fromBar;
      while (p < end - 1e-6) {
        const left = toBar - p;
        const perBar = left > 1.5 ? 8 : left > 0.75 ? 16 : 32;
        events.snare.push([p * bar, 0.3 + 0.7 * ((p - fromBar) / (toBar - fromBar))]);
        p += 1 / perBar;
      }
    }
    roll(S.hook + 6, S.promise, 1);
    roll(S.headphones + 3, S.shop, 0.5);
    roll(S.live + 4, S.evals, 1);

    riser(S.hook + 4, S.promise - 0.25, 0.32);
    riser(S.headphones + 2, S.shop, 0.24);
    riser(S.live + 2, S.evals - 0.25, 0.34);
    riser(S.outro + 2, S.outro + 4, 0.18);
    for (const target of [S.hook + 2, S.hook + 4, S.rules, S.record, S.nephew, S.headphones, S.live, S.outro]) swell(target);
    swell(S.promise, 2, 0.32);

    impact(S.hook + 4, 0.55);
    impact(S.promise, 1);
    impact(S.mug, 0.45);
    impact(S.shop, 1);
    impact(S.live, 0.35);
    impact(S.evals, 1);
    impact(S.outro, 0.6);
    impact(S.outro + 4, 1);

    // ---------- Play it ----------
    events.kick.sort((a, b) => a[0] - b[0]);
    for (const [t, v] of events.kick) {
      kick.triggerAttackRelease('A1', 0.3, t, v);
      kickClick.triggerAttackRelease(0.01, t, v);
      kicks.push(t);
    }
    // Pumping: dip on each kick of the drive; the hook's heartbeat pumps the pad gently.
    pump.gain.setValueAtTime(1, 0);
    for (const t of kicks) {
      const depth = t < T(S.promise) ? 0.6 : 0.22;
      pump.gain.setValueAtTime(1, Math.max(0, t - 0.004));
      pump.gain.linearRampToValueAtTime(depth, t + 0.006);
      pump.gain.linearRampToValueAtTime(1, t + beat * 0.62);
    }
    for (const [t, v] of events.clap) {
      // A clap is a few quick bursts: two short slaps, then the body.
      q(clap, t - 0.022, () => clap.triggerAttackRelease(0.006, t - 0.022, v * 0.6));
      q(clap, t - 0.011, () => clap.triggerAttackRelease(0.006, t - 0.011, v * 0.7));
      q(clap, t, () => clap.triggerAttackRelease(0.12, t, v));
    }
    for (const [t, v] of events.snare) { q(snare, t, () => snare.triggerAttackRelease(0.06, t, v)); q(snareBody, t, () => snareBody.triggerAttackRelease('E3', 0.05, t, v * 0.8)); }
    for (const [t, v] of events.ch) q(closedHat, t, () => closedHat.triggerAttackRelease(0.02, t, v));
    for (const [t, v] of events.oh) q(openHat, t, () => openHat.triggerAttackRelease(0.15, t, v));
    for (const [t, note, len, v] of events.bass) { q(sub, t, () => sub.triggerAttackRelease(note, len, t, v)); q(saw, t, () => saw.triggerAttackRelease(up(note, 12), len, t, v)); }
    for (const [t, notes, len, v] of events.stab) notes.forEach((n, i) => q(stabVoices[i], t, () => stabVoices[i].triggerAttackRelease(n, len, t, v)));
    for (const [t, note, len, v] of events.arp) q(arp, t, () => arp.triggerAttackRelease(note, len, t, v));
    for (const [t, note, len] of events.lead) { q(lead, t, () => lead.triggerAttackRelease(note, len, t, 0.85)); q(leadBell, t, () => leadBell.triggerAttackRelease(up(note, 12), Math.min(len, step * 2), t, 0.5)); }

    // The stab filter opens through each drop; the arp filter opens through the build back.
    stabFilter.frequency.setValueAtTime(1800, 0);
    for (const s of [S.promise, S.shop, S.evals]) {
      stabFilter.frequency.setValueAtTime(1500, T(s));
      stabFilter.frequency.exponentialRampToValueAtTime(4200, T(s + 4));
      stabFilter.frequency.exponentialRampToValueAtTime(2400, T(s + 6));
    }
    arpFilter.frequency.setValueAtTime(3200, 0);
    arpFilter.frequency.setValueAtTime(500, T(S.live));
    arpFilter.frequency.exponentialRampToValueAtTime(3600, T(S.evals));
    // The build back: the kick enters muffled and opens up.
    kickFilter.frequency.setValueAtTime(18000, 0);
    kickFilter.frequency.setValueAtTime(260, T(S.live));
    kickFilter.frequency.exponentialRampToValueAtTime(18000, T(S.live + 4));

    // Pads: the hook's drone that opens up, the breakdown and the outro. Quiet underneath elsewhere.
    const padPlan = [];
    for (let b = 0; b < totalBars; b++) {
      const id = sectionAt(b);
      const loud = id === 'hook' || (id === 'off' && b >= offCut) || id === 'outro' || id === 'record';
      const quiet = id === 'nephew' || id === 'headphones';
      if (!loud && !quiet) continue;
      const c = chordAt(b, 0);
      padPlan.push([T(b), [c.root.replace(/\d/, '2'), ...c.stab], bar * (b + 1 === totalBars ? 1 + TAIL_SECONDS / bar : 1), loud ? 0.8 : 0.45]);
    }
    // Merge repeated chords into one held chord.
    const held = [];
    for (const p of padPlan) {
      const prev = held[held.length - 1];
      if (prev && Math.abs(prev[0] + prev[2] - p[0]) < 1e-6 && prev[1].join() === p[1].join() && prev[3] === p[3]) prev[2] += p[2];
      else held.push([...p]);
    }
    for (const [t, notes, len, v] of held) notes.forEach((n, i) => q(padVoices[i], t, () => padVoices[i].triggerAttackRelease(n, len - 0.05, t, v)));
    padFilter.frequency.setValueAtTime(350, 0);
    padFilter.frequency.exponentialRampToValueAtTime(2600, T(S.hook + 7.75));
    padFilter.frequency.setValueAtTime(900, T(S.promise));
    padFilter.frequency.setValueAtTime(1500, T(offCut));
    padFilter.frequency.exponentialRampToValueAtTime(2400, T(S.live));
    padFilter.frequency.setValueAtTime(900, T(S.live));
    padFilter.frequency.setValueAtTime(1200, T(S.outro));
    padFilter.frequency.exponentialRampToValueAtTime(3000, T(S.outro + 4));

    // The breakdown's soft pluck: the hook, slowed to eighths, after the switch.
    const PLUCK = [['E5', 'G5', 'A5', 'E5'], ['F5', 'E5', 'C5', 'A4'], ['E5', 'G5', 'B5', 'A5'], ['F5', 'E5', 'D5', 'C5'], ['B4', 'D5', 'E5', 'G#5']];
    for (let k = 0; k < PLUCK.length; k++) {
      const b = Math.ceil(offCut) + k;
      if (b >= S.live) break;
      PLUCK[k].forEach((n, j) => { const t = T(b, j * 0.75 + (j > 1 ? 0.25 : 0)); q(pluck, t, () => pluck.triggerAttackRelease(n, beat * 0.9, t, 0.7)); });
    }
    // The hook's ticking clock: a high pluck on every beat while the question is asked.
    for (let b = 2; b < 4; b++) for (let j = 0; j < 4; j++) { const t = T(b, j); q(pluck, t, () => pluck.triggerAttackRelease(j === 0 ? 'A5' : 'E5', 0.1, t, j === 0 ? 0.5 : 0.3)); }
    // Hook bass: a long sub drone that starts pulsing in eighths once the question lands.
    q(sub, 0, () => sub.triggerAttackRelease('A1', bar * 2, 0, 0.3));
    for (let b = 2; b < 7.75 - 1e-6; b += 0.125) {
      const c = chordAt(Math.floor(b), 0);
      const t = b * bar, v = 0.5 + 0.4 * (b / 8);
      q(sub, t, () => sub.triggerAttackRelease(c.root, step * 1.6, t, v));
      q(saw, t, () => saw.triggerAttackRelease(up(c.root, 12), step * 1.4, t, v * 0.45));
    }
    // The outro's last chord rings out.
    const last = T(S.outro + 4);
    stabVoices.forEach((v, i) => q(v, last, () => v.triggerAttackRelease(CHORDS.A.stab[i], bar * 1.5, last, 1)));
    q(lead, last, () => lead.triggerAttackRelease('A5', bar * 1.2, last, 0.6));
    q(leadBell, last, () => leadBell.triggerAttackRelease('A6', 1.2, last, 0.5));

    // Now trigger every queued note, in time order per instrument.
    for (const list of queues.values()) for (const [, fn] of list.sort((a, b) => a[0] - b[0])) fn();

    // Swells: noise that rises into a downbeat and stops dead on it.
    swellNoise.start(0);
    swellGain.gain.setValueAtTime(0, 0);
    swells.sort((a, b) => a[0] - b[0]);
    for (const [a, z, level] of swells) {
      swellGain.gain.setValueAtTime(0.0001, a);
      swellGain.gain.exponentialRampToValueAtTime(level, z - 0.01);
      swellGain.gain.linearRampToValueAtTime(0, z);
    }
    swellNoise.stop(duration);
  })();
  const scheduled = performance.now();
  const rendered = await offline.render(false);
  if (opts.profile) console.warn(`schedule ${(scheduled - t0).toFixed(0)} ms, render ${(performance.now() - scheduled).toFixed(0)} ms`);
  return rendered;
  } finally {
    Tone.setContext(original);
  }
};
