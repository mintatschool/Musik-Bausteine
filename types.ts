import type * as Tone from 'tone';

export type InstrumentType = 'drums' | 'bass' | 'guitar' | 'keyboard';
export type ScaleType = 'pentatonic' | 'whole';
export type GridResolution = '4n' | '8n' | '16n';
export type KeyOption = 'C' | 'F' | 'G' | 'D' | 'Am' | 'Dm' | 'Em' | 'Hm';

export interface TrackData {
  id: string;
  type: InstrumentType;
  scale: ScaleType; // Kept for legacy compatibility, but app now uses global settings
  volume: number;
  muted: boolean;
  solo: boolean;
  activeSteps: number[][]; // Array of active steps (fractions of bar) per note index
}

export interface AudioTrack {
  synths: (Tone.PolySynth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[];
}