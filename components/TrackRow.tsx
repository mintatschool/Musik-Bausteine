import React from 'react';
import { TrackData, KeyOption } from '../types';
import { INSTR_CONFIG, DRUM_NAMES, getNotes } from '../constants';
import * as Tone from 'tone';

interface TrackRowProps {
  track: TrackData;
  totalSteps: number;
  stepsPerBar: number;
  synths: (Tone.PolySynth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[];
  isAnySolo: boolean;
  globalKey: KeyOption;
  onUpdateTrack: (id: string, updates: Partial<TrackData>) => void;
  onRemoveTrack: (id: string) => void;
  onToggleStep: (trackId: string, noteIndex: number, stepIndex: number) => void;
  currentStep: number;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  totalSteps,
  stepsPerBar,
  synths,
  isAnySolo,
  globalKey,
  onUpdateTrack,
  onRemoveTrack,
  onToggleStep,
  currentStep
}) => {
  const notes = track.type === 'drums'
    ? DRUM_NAMES
    : getNotes(track.type, track.scale, globalKey);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    onUpdateTrack(track.id, { volume: vol });
    synths.forEach(s => {
      if (s.volume) s.volume.value = vol;
    });
  };

  const getNoteClass = (noteName: string) => {
    if (track.type === 'drums') return 'drum-part';

    // Normalize Note Name for CSS
    let base = noteName.replace(/\d/, '');

    // Mapping for specific color requests
    if (base.includes('C#')) return 'note-Cis';
    if (base.includes('D#')) return 'note-Dis';
    if (base.includes('F#')) return 'note-Fis';
    if (base.includes('G#')) return 'note-Gis';
    if (base.includes('A#')) return 'note-B'; // Map A# to B (Bb) color
    if (base.includes('Bb')) return 'note-B';

    base = base.replace('#', '').replace('H', 'B');
    return `note-${base}`;
  };

  const isDimmed = isAnySolo && !track.solo;

  return (
    <div className={`track-row ${track.muted ? 'muted-row' : ''} ${isDimmed ? 'dimmed-row' : ''}`}>
      {/* Controls - Left Side */}
      <div className="track-controls">
        <div className="track-header">
          <span className="track-icon">
            {INSTR_CONFIG[track.type].icon}
          </span>
          <span className="track-name">{INSTR_CONFIG[track.type].name}</span>
        </div>

        <div className="track-buttons">
          <button
            onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
            className={`ctrl-btn mute-btn ${track.muted ? 'active' : ''}`}
          >
            M
          </button>
          <button
            onClick={() => onUpdateTrack(track.id, { solo: !track.solo })}
            className={`ctrl-btn solo-btn ${track.solo ? 'active' : ''}`}
          >
            S
          </button>
        </div>

        {/* Footer with Delete and Slider side-by-side */}
        <div className="controls-footer">
          <button
            onClick={() => onRemoveTrack(track.id)}
            className="del-btn"
          >
            ✕
          </button>

          <div className="vol-wrap">
            <input
              type="range"
              className="vol-slider"
              min="-40"
              max="5"
              value={track.volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>

      {/* Grid - Right Side */}
      <div className="sub-tracks">
        {[...notes].reverse().map((note, idx) => {
          const noteIndex = notes.length - 1 - idx;

          // Display Logic: 
          // C# -> Cis, etc.
          // H -> H
          // Bb -> B
          let displayLabel = note.replace(/\d/, '');
          if (track.type !== 'drums') {
            displayLabel = displayLabel.replace('C#', 'Cis')
              .replace('D#', 'Dis')
              .replace('F#', 'Fis')
              .replace('G#', 'Gis')
              .replace('A#', 'B') // A# -> B (German Bb)
              .replace('Bb', 'B'); // Bb -> B
            // Handle B-natural: In "NOTES_WHOLE" logic or generic, B implies B-natural unless Bb.
            // But my getNotes returns "B" for B-natural. "B" in German is "H".
            // So if note is "B" (natural), display "H".
            // If note is "Bb", display "B".
            // The replace chain above handles sharps/flats. 
            // If we have plain "B" left, it matches natural B.
            if (note.includes('B') && !note.includes('b')) {
              displayLabel = displayLabel.replace('B', 'H');
            }

            // Apply lowercase for all melodic notes as requested
            displayLabel = displayLabel.toLowerCase();
          }

          return (
            <div key={`${track.id}-${noteIndex}`} className="sub-track">
              <div className="label-box">
                {displayLabel}
              </div>
              <div className="steps">
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const isActive = track.activeSteps[noteIndex]?.includes(stepIdx / stepsPerBar);
                  const isBarStart = stepIdx % stepsPerBar === 0 && stepIdx !== 0;
                  const isPlaying = currentStep === stepIdx;

                  // Determine beat pattern (e.g., shade every 2nd or 4th step depending on resolution)
                  // For 8n (default), a beat is 2 steps. For 16n, 4 steps. For 4n, 1 step.
                  // Simplistic approach: Shade odd numbered quarter-notes
                  const currentQuarterNote = Math.floor(stepIdx / (stepsPerBar / 4));
                  const isOffBeat = currentQuarterNote % 2 !== 0;

                  return (
                    <div
                      key={stepIdx}
                      onClick={() => onToggleStep(track.id, noteIndex, stepIdx / stepsPerBar)}
                      className={`
                        step 
                        ${isBarStart ? 'bar-start' : ''}
                        ${isActive ? `active ${getNoteClass(track.type === 'drums' ? 'Drums' : notes[noteIndex])}` : ''}
                        ${isPlaying ? 'playing' : ''}
                        ${isOffBeat ? 'beat-bg' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};