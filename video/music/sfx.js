// Original sound design for the demo video, synthesised with Tone.js (no samples).
// Each effect renders to its own short file, and the edit places them on the beat. They are kept
// apart from the score so a licensed track can replace the music without losing them.
//
//   stamp      a verdict tag pressed onto paper: a low thud, a paper slap and a wooden knock
//   deny       a refused charge: the stamp's thud with a short, low buzz under it
//   register   "paid": two mechanical ticks and a bright two-note bell, cash-register style
//   whoosh     a transition: filtered air sweeping up and across
//   tap        a finger tap on a button: a tiny click
//   powerdown  the off switch: a click, then everything sinks in pitch and goes dark

/* global Tone */
window.SFX = {
  stamp: { seconds: 0.9, build() {
    const out = new Tone.Gain(1).toDestination();
    const thud = new Tone.MembraneSynth({ pitchDecay: 0.07, octaves: 2.6, envelope: { attack: 0.001, decay: 0.32, sustain: 0 }, volume: -2 }).connect(out);
    const slap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 }, volume: -8 });
    slap.chain(new Tone.Filter(1700, 'bandpass'), out);
    const knock = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 1.2, envelope: { attack: 0.001, decay: 0.07, sustain: 0 }, volume: -12 }).connect(out);
    thud.triggerAttackRelease('D2', 0.3, 0.004, 1);
    slap.triggerAttackRelease(0.04, 0, 1);
    knock.triggerAttackRelease('A3', 0.06, 0.002, 0.9);
  } },

  deny: { seconds: 0.9, build() {
    const out = new Tone.Gain(1).toDestination();
    const thud = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 2.4, envelope: { attack: 0.001, decay: 0.36, sustain: 0 }, volume: -2 }).connect(out);
    const slap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -8 });
    slap.chain(new Tone.Filter(1500, 'bandpass'), out);
    const buzzA = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.004, decay: 0.05, sustain: 0.7, release: 0.06 }, volume: -20 });
    const buzzB = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.004, decay: 0.05, sustain: 0.7, release: 0.06 }, volume: -20 });
    const lp = new Tone.Filter(1100, 'lowpass').connect(out);
    buzzA.connect(lp); buzzB.connect(lp);
    thud.triggerAttackRelease('C2', 0.3, 0.004, 1);
    slap.triggerAttackRelease(0.045, 0, 1);
    buzzA.triggerAttackRelease(98, 0.2, 0.03, 0.8);
    buzzB.triggerAttackRelease(103.5, 0.2, 0.03, 0.8);
  } },

  register: { seconds: 1.4, build() {
    const out = new Tone.Gain(1).toDestination();
    const tick = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.0005, decay: 0.012, sustain: 0 }, volume: -10 });
    tick.chain(new Tone.Filter(3200, 'highpass'), out);
    const clunk = new Tone.MembraneSynth({ pitchDecay: 0.015, octaves: 1.5, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -14 }).connect(out);
    const bellA = new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.4 }, modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 }, volume: -9 });
    const bellB = new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 1.0, sustain: 0, release: 0.4 }, modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 }, volume: -10 });
    const shine = new Tone.Filter(9000, 'lowpass').connect(out);
    bellA.connect(shine); bellB.connect(shine);
    tick.triggerAttackRelease(0.01, 0, 0.9);
    clunk.triggerAttackRelease('E4', 0.04, 0.0, 0.7);
    tick.triggerAttackRelease(0.01, 0.075, 1);
    clunk.triggerAttackRelease('A4', 0.04, 0.075, 0.8);
    bellA.triggerAttackRelease('E7', 0.5, 0.11, 0.9);
    bellB.triggerAttackRelease('A7', 0.7, 0.165, 0.8);
  } },

  whoosh: { seconds: 0.9, build() {
    const noise = new Tone.Noise('pink');
    const bp = new Tone.Filter(300, 'bandpass');
    bp.Q.value = 1.4;
    const gain = new Tone.Gain(0);
    const pan = new Tone.Panner(-0.6);
    noise.chain(bp, gain, pan, Tone.getDestination());
    noise.start(0).stop(0.85);
    bp.frequency.setValueAtTime(300, 0);
    bp.frequency.exponentialRampToValueAtTime(5200, 0.42);
    bp.frequency.exponentialRampToValueAtTime(1400, 0.85);
    gain.gain.setValueAtTime(0.0001, 0);
    gain.gain.exponentialRampToValueAtTime(1, 0.38);
    gain.gain.exponentialRampToValueAtTime(0.0001, 0.85);
    pan.pan.setValueAtTime(-0.6, 0);
    pan.pan.linearRampToValueAtTime(0.6, 0.85);
  } },

  tap: { seconds: 0.15, build() {
    const out = new Tone.Gain(1).toDestination();
    const blip = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 }, volume: -6 }).connect(out);
    const click = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.0005, decay: 0.006, sustain: 0 }, volume: -12 });
    click.chain(new Tone.Filter(2500, 'highpass'), out);
    blip.triggerAttackRelease(1900, 0.02, 0, 0.8);
    click.triggerAttackRelease(0.005, 0, 1);
  } },

  powerdown: { seconds: 1.8, build() {
    const out = new Tone.Gain(1).toDestination();
    const click = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.06, sustain: 0 }, volume: -8 }).connect(out);
    click.triggerAttackRelease('C4', 0.05, 0, 1);
    const lp = new Tone.Filter(5000, 'lowpass', -24).connect(out);
    const a = new Tone.Oscillator(440, 'sawtooth');
    const b = new Tone.Oscillator(443, 'square');
    const gain = new Tone.Gain(0).connect(lp);
    a.connect(gain); b.connect(gain);
    a.start(0.02).stop(1.6); b.start(0.02).stop(1.6);
    for (const o of [a, b]) { o.frequency.setValueAtTime(o === a ? 440 : 443, 0.02); o.frequency.exponentialRampToValueAtTime(28, 1.5); }
    lp.frequency.setValueAtTime(5000, 0.02);
    lp.frequency.exponentialRampToValueAtTime(160, 1.5);
    gain.gain.setValueAtTime(0.0001, 0.02);
    gain.gain.exponentialRampToValueAtTime(0.22, 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, 1.58);
  } },
};

window.renderSfx = async function renderSfx(name, sampleRate) {
  const fx = window.SFX[name];
  const original = Tone.getContext();
  const offline = new Tone.OfflineContext(2, fx.seconds, sampleRate);
  Tone.setContext(offline);
  try {
    fx.build();
    return await offline.render(false);
  } finally {
    Tone.setContext(original);
  }
};
