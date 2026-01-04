import { InstrumentType, KeyOption, ScaleType } from './types';

// Updated Drum Names: All Toms are just "TOM"
export const DRUM_NAMES = ['BASS', 'SNARE', 'HI-HAT', 'TOM', 'TOM', 'TOM', 'CRASH'];

export const INSTR_CONFIG: Record<InstrumentType, { name: string; icon: string }> = {
  drums: { name: 'Schlagz.', icon: '🥁' },
  bass: { name: 'Bass', icon: '🎸' },
  guitar: { name: 'Git.', icon: '🪕' },
  keyboard: { name: 'Keyb.', icon: '🎹' }
};

export const KEY_LABELS: Record<KeyOption, string> = {
  C: 'C-Dur',
  F: 'F-Dur',
  G: 'G-Dur',
  D: 'D-Dur',
  Am: 'a-Moll',
  Dm: 'd-Moll',
  Em: 'e-Moll',
  Hm: 'h-Moll'
};

// Helper to construct notes
const getScaleNotes = (key: KeyOption, mode: ScaleType, instrument: InstrumentType): string[] => {
  // Define scales relative to Key Root. 
  // We'll define specific notes for each Key to ensure requested mappings (e.g. Harmonic Minor).

  const isBass = instrument === 'bass';

  // Bass needs to be low (~E1-E2 range). Melody needs to be mid (~C3-C4 range).
  // We define full pitch strings for each Key/Mode/Instrument combo.

  /*
   Color mappings required:
   Cis (C#), Dis (D#), Fis (F#), Gis (G#), B (Bb/A#)
  */

  if (key === 'C') { // C-Dur
    if (mode === 'pentatonic') {
      if (isBass) return ['C2', 'D2', 'E2', 'G2', 'A2']; // Bass range adjusted to C2
      return ['C3', 'D3', 'E3', 'G3', 'A3'];
    } else {
      if (isBass) return ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'];
      return ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
    }
  }

  if (key === 'F') { // F-Dur (Bb)
    if (mode === 'pentatonic') {
      if (isBass) return ['F1', 'G1', 'A1', 'C2', 'D2'];
      return ['F3', 'G3', 'A3', 'C4', 'D4'];
    } else {
      if (isBass) return ['F1', 'G1', 'A1', 'Bb1', 'C2', 'D2', 'E2', 'F2'];
      return ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4'];
    }
  }

  if (key === 'G') { // G-Dur (F#)
    if (mode === 'pentatonic') {
      if (isBass) return ['G1', 'A1', 'B1', 'D2', 'E2'];
      return ['G3', 'A3', 'B3', 'D4', 'E4'];
    } else {
      if (isBass) return ['G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F#2', 'G2'];
      return ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4'];
    }
  }

  if (key === 'D') { // D-Dur (F#, C#)
    if (mode === 'pentatonic') {
      if (isBass) return ['D2', 'E2', 'F#2', 'A2', 'B2'];
      return ['D3', 'E3', 'F#3', 'A3', 'B3'];
    } else {
      if (isBass) return ['D2', 'E2', 'F#2', 'G2', 'A2', 'B2', 'C#3', 'D3'];
      return ['D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C#4', 'D4'];
    }
  }

  // MINOR KEYS (Harmonic for "Whole", Standard Minor for Pentatonic)

  if (key === 'Am') { // a-Moll (G# in Harmonic)
    if (mode === 'pentatonic') {
      if (isBass) return ['A1', 'C2', 'D2', 'E2', 'G2'];
      return ['A3', 'C4', 'D4', 'E4', 'G4'];
    } else {
      // Harmonic: A H C D E F Gis A
      if (isBass) return ['A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G#2', 'A2'];
      return ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4'];
    }
  }

  if (key === 'Dm') { // d-Moll (Bb, C# in Harmonic)
    if (mode === 'pentatonic') {
      if (isBass) return ['D2', 'F2', 'G2', 'A2', 'C3'];
      return ['D3', 'F3', 'G3', 'A3', 'C4'];
    } else {
      // Harmonic: D E F G A Bb C# D
      if (isBass) return ['D2', 'E2', 'F2', 'G2', 'A2', 'Bb2', 'C#3', 'D3'];
      return ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C#4', 'D4'];
    }
  }

  if (key === 'Em') { // e-Moll (F#, D# in Harmonic)
    if (mode === 'pentatonic') {
      if (isBass) return ['E1', 'G1', 'A1', 'B1', 'D2'];
      return ['E3', 'G3', 'A3', 'B3', 'D4'];
    } else {
      // Harmonic: E F# G A B C D# E
      if (isBass) return ['E1', 'F#1', 'G1', 'A1', 'B1', 'C2', 'D#2', 'E2'];
      return ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D#4', 'E4'];
    }
  }

  if (key === 'Hm') { // h-Moll (B Minor) (F#, C#, A# in Harmonic)
    // German H is B-natural.
    if (mode === 'pentatonic') {
      if (isBass) return ['B1', 'D2', 'E2', 'F#2', 'A2'];
      return ['B3', 'D4', 'E4', 'F#4', 'A4'];
    } else {
      // Harmonic: B C# D E F# G A# B
      if (isBass) return ['B1', 'C#2', 'D2', 'E2', 'F#2', 'G2', 'A#2', 'B2'];
      return ['B3', 'C#4', 'D4', 'E4', 'F#4', 'G4', 'A#4', 'B4'];
    }
  }

  // Fallback
  return mode === 'pentatonic' ? ['C3', 'D3', 'E3', 'G3', 'A3'] : ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
};

export const getNotes = (instrument: InstrumentType, scale: ScaleType, key: KeyOption): string[] => {
  if (instrument === 'drums') return [];
  return getScaleNotes(key, scale, instrument);
};