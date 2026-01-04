import * as Tone from 'tone';
import { InstrumentType } from '../types';

// Helper: Wraps synths that don't accept pitch (Noise, Metal) to ignore the note argument
// effectively unifying the interface to triggerAttackRelease(note, duration, time)
const wrapPercussion = (synth: Tone.NoiseSynth | Tone.MetalSynth | any) => {
  return {
    triggerAttackRelease: (_note: any, duration: any, time: any) => {
      // Noise/Metal synths take (duration, time) or (duration, time, velocity)
      // We ignore the 'note' argument passed by the sequencer
      synth.triggerAttackRelease(duration, time);
    },
    volume: synth.volume,
    connect: (dest: any) => synth.connect(dest),
    toDestination: () => synth.toDestination(),
    dispose: () => synth.dispose(),
    releaseAll: () => { if (synth.releaseAll) synth.releaseAll(); }
  } as unknown as Tone.PolySynth; // Cast to satisfy the generic array type
};

export const createSynths = (type: InstrumentType): (Tone.PolySynth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[] => {
  if (type === 'drums') {
    // 1. KICK (BASS): MembraneSynth accepts pitch, so use directly.
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.0, attackCurve: "exponential" },
      volume: -4
    }).toDestination();

    // 2. SNARE: NoiseSynth (Needs wrapper to ignore pitch arg)
    const snareNoise = new Tone.NoiseSynth({
      volume: -4,
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
    }).toDestination();
    const snare = wrapPercussion(snareNoise);

    // 3. HI-HAT: MetalSynth (Needs wrapper)
    const hihatRaw = new Tone.MetalSynth({
      volume: -12,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    const hihat = wrapPercussion(hihatRaw);

    // 4, 5, 6. TOMS: MembraneSynth (Accepts pitch, safe to use directly)
    const createTom = (_pitch: string) => new Tone.MembraneSynth({
      volume: -4,
      pitchDecay: 0.1,
      octaves: 2.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.01, release: 1 }
    }).toDestination();

    // 7. CRASH: MetalSynth (Needs wrapper)
    const crashRaw = new Tone.MetalSynth({
      volume: -5,
      envelope: { attack: 0.001, decay: 2.0, release: 2.0 },
      harmonicity: 5.1,
      modulationIndex: 64,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    const crash = wrapPercussion(crashRaw);

    return [kick, snare, hihat, createTom("F1"), createTom("A1"), createTom("D2"), crash];
  }

  // Melodic instruments: Use a single PolySynth with 8 voices instead of 8 separate PolySynths
  // This significantly reduces resource consumption while maintaining the same functionality
  if (type === 'guitar') {
    const synth = new Tone.PolySynth(Tone.AMSynth, {
      volume: -2,
      harmonicity: 3,
      modulation: { type: "square" },
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 },
      modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination();
    synth.maxPolyphony = 8;
    // Return array with all slots pointing to the same synth for compatibility
    return Array(8).fill(synth);
  }

  if (type === 'bass') {
    const synth = new Tone.PolySynth(Tone.Synth, {
      volume: 2,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.5 }
    }).toDestination();
    synth.maxPolyphony = 8;
    return Array(8).fill(synth);
  }

  // Keyboard: Changed to Square wave for distinct sound
  const synth = new Tone.PolySynth(Tone.Synth, {
    volume: -10,
    oscillator: { type: "square" },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 }
  }).toDestination();
  synth.maxPolyphony = 8;
  return Array(8).fill(synth);
};

export const getStepsPerBar = (res: string) => {
  if (res === '4n') return 4;
  if (res === '8n') return 8;
  if (res === '16n') return 16;
  return 8;
};