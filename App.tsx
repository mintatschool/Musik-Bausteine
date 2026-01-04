import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import * as Tone from 'tone';
// @ts-ignore
import QRCode from 'qrcode';
import { InstrumentType, TrackData, GridResolution, ScaleType, KeyOption } from './types';
import { createSynths, getStepsPerBar } from './services/audioService';
import { DRUM_NAMES, getNotes } from './constants';
import { TrackRow } from './components/TrackRow';
import { encodeSong, decodeSong } from './services/storageService';

// Lazy-loaded modal components for code-splitting
const InstrumentModal = lazy(() => import('./components/InstrumentModal').then(m => ({ default: m.InstrumentModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(110);
  const [resolution, setResolution] = useState<GridResolution>('8n');
  const [bars, setBars] = useState(2);
  const [globalScale, setGlobalScale] = useState<ScaleType>('pentatonic');
  const [globalKey, setGlobalKey] = useState<KeyOption>('C');
  const [tracks, setTracks] = useState<TrackData[]>([]);

  // History State
  const [history, setHistory] = useState<TrackData[][]>([]);
  const [future, setFuture] = useState<TrackData[][]>([]);

  const [currentStep, setCurrentStep] = useState(-1);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [modals, setModals] = useState<{ instrument: boolean; settings: boolean; export: boolean }>({
    instrument: false,
    settings: false,
    export: false
  });
  const [qrUrl, setQrUrl] = useState('');
  const [showFullQr, setShowFullQr] = useState(false);

  // Refs for audio objects
  const synthsRef = useRef<Map<string, any[]>>(new Map());
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // --- Initialization ---

  // Load from URL or Default
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const init = async () => {
      const hash = window.location.hash.slice(1);
      let loaded = false;

      if (hash) {
        const state = decodeSong(hash);
        if (state) {
          initializedRef.current = true;
          setTempo(state.tempo);
          setResolution(state.resolution);
          setBars(state.bars);
          if (state.key) setGlobalKey(state.key);

          const firstMelodic = state.tracks.find(t => t.type !== 'drums');
          if (firstMelodic) setGlobalScale(firstMelodic.scale);

          const migratedTracks = state.tracks.map(t => {
            if (t.type === 'drums' && t.activeSteps.length < DRUM_NAMES.length) {
              const diff = DRUM_NAMES.length - t.activeSteps.length;
              const newSteps = [...t.activeSteps];
              for (let i = 0; i < diff; i++) newSteps.push([]);
              return { ...t, activeSteps: newSteps };
            }
            return t;
          });

          migratedTracks.forEach(t => {
            if (!synthsRef.current.has(t.id)) {
              synthsRef.current.set(t.id, createSynths(t.type));
            }
          });
          setTracks(migratedTracks);
          loaded = true;
        }
      }

      if (!loaded) {
        // Use a functional update to check actual current state length
        setTracks(prev => {
          if (prev.length === 0) {
            initializedRef.current = true;
            const id = crypto.randomUUID();
            synthsRef.current.set(id, createSynths('drums'));
            return [{
              id,
              type: 'drums',
              scale: globalScale,
              volume: 0,
              muted: false,
              solo: false,
              activeSteps: Array(DRUM_NAMES.length).fill([]).map(() => [])
            }];
          }
          return prev;
        });
      }
    };
    init();
  }, []);

  // Generate QR when export modal opens
  useEffect(() => {
    if (modals.export) {
      const state = { tempo, resolution, bars, tracks, key: globalKey };
      const hash = encodeSong(state);
      const url = `${window.location.origin}${window.location.pathname}#${hash}`;

      QRCode.toDataURL(url, { width: 400, margin: 2 })
        .then((url: string) => setQrUrl(url))
        .catch((err: any) => console.error(err));
    } else {
      setShowFullQr(false);
    }
  }, [modals.export, tempo, resolution, bars, tracks, globalKey]);

  // --- History Logic ---

  const saveToHistory = () => {
    // Limit history depth to 20
    const newHistory = [...history, JSON.parse(JSON.stringify(tracks))];
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setFuture([]); // Clear future on new action
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    setFuture([JSON.parse(JSON.stringify(tracks)), ...future]);
    setHistory(newHistory);

    // Restore state
    // Note: We might need to handle synth syncing if tracks were added/removed
    // For simplicity, we just sync synths based on IDs in the effect loop or ensure integrity
    setTracks(previous);

    // Sync Synths for potential deleted/added tracks in undo
    previous.forEach(t => {
      if (!synthsRef.current.has(t.id)) {
        synthsRef.current.set(t.id, createSynths(t.type));
      }
    });
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setHistory([...history, JSON.parse(JSON.stringify(tracks))]);
    setFuture(newFuture);
    setTracks(next);

    next.forEach(t => {
      if (!synthsRef.current.has(t.id)) {
        synthsRef.current.set(t.id, createSynths(t.type));
      }
    });
  };

  // --- Audio Logic ---

  const addTrack = (e: any, type: InstrumentType) => {
    if (e) saveToHistory(); // Save before changing

    const id = crypto.randomUUID();
    const notes = type === 'drums'
      ? []
      : getNotes(type, globalScale, globalKey);
    const noteCount = type === 'drums' ? DRUM_NAMES.length : notes.length;

    const newTrack: TrackData = {
      id,
      type,
      scale: globalScale,
      volume: 0,
      muted: false,
      solo: false,
      activeSteps: Array(noteCount).fill([]).map(() => [])
    };

    synthsRef.current.set(id, createSynths(type));
    setTracks(prev => [...prev, newTrack]);
    setModals(m => ({ ...m, instrument: false }));
  };

  const removeTrack = (id: string) => {
    if (confirm('Spur wirklich löschen?')) {
      saveToHistory(); // Save before deleting
      const synthList = synthsRef.current.get(id);
      synthList?.forEach((s: any) => s.dispose());
      synthsRef.current.delete(id);
      setTracks(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTrack = (id: string, updates: Partial<TrackData>) => {
    // We only save to history for Mute/Solo/Volume changes if distinct click
    // For volume sliders, this might fill history too fast. 
    // Ideally we'd use onMouseUp for history, but for now we accept it or skip history for volume.
    // Let's Add history for Mute/Solo but skip for Volume to keep it usable.
    if (updates.muted !== undefined || updates.solo !== undefined) {
      saveToHistory();
    }
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Update all melodic tracks when global scale OR KEY changes
  const updateGlobalSettings = (newScale: ScaleType, newKey: KeyOption) => {
    saveToHistory();
    setGlobalScale(newScale);
    setGlobalKey(newKey);

    setTracks(prev => prev.map(t => {
      if (t.type === 'drums') return t;
      // Reset active steps because grid height might change with note count
      const notes = getNotes(t.type, newScale, newKey);
      return {
        ...t,
        scale: newScale,
        activeSteps: Array(notes.length).fill([]).map(() => [])
      };
    }));
  };

  const toggleStep = async (trackId: string, noteIndex: number, absPos: number) => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    // Save history before modifying
    saveToHistory();

    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;

      // Auto-expand if needed (safety fallback)
      if (noteIndex >= t.activeSteps.length) {
        return t; // Should be handled by migration, but play safe
      }

      const newActiveSteps = [...t.activeSteps];
      const stepArr = [...newActiveSteps[noteIndex]];

      const existingIdx = stepArr.findIndex(p => Math.abs(p - absPos) < 0.001);

      if (existingIdx !== -1) {
        stepArr.splice(existingIdx, 1);
      } else {
        stepArr.push(absPos);
        const synths = synthsRef.current.get(trackId);
        if (synths && synths[noteIndex]) {
          const notes = t.type === 'drums'
            ? []
            : getNotes(t.type, t.scale, globalKey);

          // Trigger sound
          let noteToPlay = "";
          if (t.type === 'drums') {
            noteToPlay = "C2";
          } else {
            noteToPlay = notes[noteIndex];
          }

          if (synths[noteIndex]) {
            synths[noteIndex].triggerAttackRelease(noteToPlay, "16n");
          }
        }
      }

      newActiveSteps[noteIndex] = stepArr;
      return { ...t, activeSteps: newActiveSteps };
    }));
  };

  // --- Transport Logic ---

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  useEffect(() => {
    if (sequenceRef.current) sequenceRef.current.dispose();

    const spb = getStepsPerBar(resolution);
    const totalSteps = bars * spb;
    const stepIndices = Array.from({ length: totalSteps }, (_, i) => i);

    sequenceRef.current = new Tone.Sequence((time, step) => {
      Tone.Draw.schedule(() => {
        setCurrentStep(step);
      }, time);

      const absPos = step / spb;

      tracks.forEach(track => {
        const anySolo = tracks.some(t => t.solo);
        const shouldPlay = anySolo ? (track.solo && !track.muted) : !track.muted;

        if (!shouldPlay) return;

        const synths = synthsRef.current.get(track.id);
        if (!synths) return;

        const notes = track.type === 'drums'
          ? []
          : getNotes(track.type, track.scale, globalKey);

        track.activeSteps.forEach((steps, noteIndex) => {
          if (steps.some(p => Math.abs(p - absPos) < 0.001)) {
            if (track.type !== 'drums' && !notes[noteIndex]) return;

            if (synths[noteIndex]) {
              const noteToPlay = track.type === 'drums' ? "C2" : notes[noteIndex];
              synths[noteIndex].triggerAttackRelease(noteToPlay, "8n", time);
            }
          }
        });
      });

    }, stepIndices, resolution).start(0);

    return () => {
      if (sequenceRef.current) sequenceRef.current.dispose();
    };
  }, [tracks, resolution, bars, globalKey]);

  const togglePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();

    if (isPlaying) {
      Tone.Transport.stop();
      setCurrentStep(-1);
      synthsRef.current.forEach(list => list.forEach((s: any) => {
        if (s.releaseAll) s.releaseAll();
      }));
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlay = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    synthsRef.current.forEach(list => list.forEach((s: any) => {
      if (s.releaseAll) s.releaseAll();
    }));
  };

  const stepsPerBarVal = getStepsPerBar(resolution);
  const isAnySolo = tracks.some(t => t.solo);

  return (
    <>
      <div id="main-toolbar">
        <div className="toolbar-left">
          <strong style={{ fontSize: '15px', marginRight: '10px' }}>🎹 Musik-Bausteine</strong>
          <button onClick={togglePlay} className={`btn btn-success ${isPlaying ? 'active-play' : ''}`}>
            <span className="icon-triangle"></span> PLAY
          </button>
          <button onClick={stopPlay} className="btn btn-danger">
            <span className="icon-square"></span> STOP
          </button>
        </div>

        <div className="toolbar-center">
          {/* Undo / Redo Buttons - Grey solid background with clean white SVG arrows */}
          <button
            className="btn btn-square btn-secondary"
            onClick={undo}
            disabled={history.length === 0}
            title="Rückgängig"
            style={{ marginRight: '5px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
          </button>
          <button
            className="btn btn-square btn-secondary"
            onClick={redo}
            disabled={future.length === 0}
            title="Wiederholen"
            style={{ marginRight: '15px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 14 5-5-5-5" />
              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
            </svg>
          </button>

          {/* Tempo Buttons - Reverted to Standard */}
          <button className="btn btn-square" onClick={() => setTempo(t => Math.max(60, t - 1))}>-</button>
          <input
            type="range"
            min="60"
            max="180"
            value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value))}
            style={{ width: '150px' }}
          />
          <button className="btn btn-square" onClick={() => setTempo(t => Math.min(180, t + 1))}>+</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '25px', textAlign: 'center' }}>{tempo}</span>
        </div>

        <div className="toolbar-right">
          <button
            onClick={() => setIsZoomedOut(!isZoomedOut)}
            className={`btn btn-square btn-secondary ${isZoomedOut ? 'active-toggle' : ''}`}
            title={isZoomedOut ? "Vergrößern" : "Verkleinern"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              {isZoomedOut && <line x1="11" y1="8" x2="11" y2="14"></line>}
            </svg>
          </button>
          <button
            onClick={() => setModals(m => ({ ...m, settings: true }))}
            className="btn btn-square btn-secondary"
            title="Einstellungen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
          <button
            onClick={() => setModals(m => ({ ...m, export: true }))}
            className="btn btn-square btn-secondary"
            title="Export / QR Code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
          <button onClick={() => setModals(m => ({ ...m, instrument: true }))} className="btn btn-primary">
            + SPUR
          </button>
        </div>
      </div>

      <div id="main">
        <div id="tracks-area" className={isZoomedOut ? 'compact' : ''}>
          {/* Ruler - FIXED ALIGNMENT */}
          <div className="track-row ruler">
            {/* Spacer logic handled by CSS via class */}
            <div className="ruler-spacer"></div>
            {/* Dummy sub-tracks wrapper to match TrackRow flex behavior */}
            <div className="sub-tracks">
              <div className="sub-track">
                {/* Dummy Label to align with track labels */}
                <div className="label-box" style={{ opacity: 0 }}></div>
                <div className="steps">
                  {Array.from({ length: bars * stepsPerBarVal }).map((_, i) => (
                    <div key={i} className={`step ruler-step ${i % stepsPerBarVal === 0 ? 'bar-start' : ''}`}>
                      {resolution === '4n'
                        ? (i % 4) + 1
                        : resolution === '8n'
                          ? (i % 2 === 0 ? (Math.floor(i / 2) % 4) + 1 : '+')
                          : (i % 4 === 0 ? (Math.floor(i / 4) % 4) + 1 : i % 4 === 2 ? '+' : '')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              totalSteps={bars * stepsPerBarVal}
              stepsPerBar={stepsPerBarVal}
              synths={synthsRef.current.get(track.id) || []}
              isAnySolo={isAnySolo}
              globalKey={globalKey}
              onUpdateTrack={updateTrack}
              onRemoveTrack={removeTrack}
              onToggleStep={toggleStep}
              currentStep={currentStep}
            />
          ))}
        </div>
      </div>

      {/* Lazy-loaded Modals */}
      <Suspense fallback={<div className="modal-bg"><div className="modal" style={{ textAlign: 'center' }}>Lade...</div></div>}>
        {modals.instrument && (
          <InstrumentModal
            onAddTrack={(type: InstrumentType) => addTrack(true, type)}
            onClose={() => setModals(m => ({ ...m, instrument: false }))}
          />
        )}

        {modals.settings && (
          <SettingsModal
            resolution={resolution}
            onResolutionChange={setResolution}
            globalScale={globalScale}
            globalKey={globalKey}
            onGlobalSettingsChange={updateGlobalSettings}
            bars={bars}
            onBarsChange={setBars}
            onClose={() => setModals(m => ({ ...m, settings: false }))}
          />
        )}

        {modals.export && (
          <ExportModal
            qrUrl={qrUrl}
            showFullQr={showFullQr}
            onShowFullQr={() => setShowFullQr(true)}
            onHideFullQr={() => setShowFullQr(false)}
            onClose={() => setModals(m => ({ ...m, export: false }))}
          />
        )}
      </Suspense>
    </>
  );
};

export default App;