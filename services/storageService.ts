import LZString from 'lz-string';
import { TrackData, GridResolution, KeyOption } from '../types';

interface SongState {
  tempo: number;
  resolution: GridResolution;
  bars: number;
  key?: KeyOption; // Optional for backward compatibility
  tracks: TrackData[];
}

export const encodeSong = (state: SongState): string => {
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
};

export const decodeSong = (hash: string): SongState | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to decode song", e);
    return null;
  }
};