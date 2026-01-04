import React from 'react';
import { GridResolution, ScaleType, KeyOption } from '../types';
import { KEY_LABELS } from '../constants';

interface SettingsModalProps {
    resolution: GridResolution;
    onResolutionChange: (resolution: GridResolution) => void;
    globalScale: ScaleType;
    globalKey: KeyOption;
    onGlobalSettingsChange: (scale: ScaleType, key: KeyOption) => void;
    bars: number;
    onBarsChange: (bars: number) => void;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    resolution,
    onResolutionChange,
    globalScale,
    globalKey,
    onGlobalSettingsChange,
    bars,
    onBarsChange,
    onClose
}) => {
    return (
        <div className="modal-bg">
            <div className="modal">
                <h3 style={{ marginTop: 0 }}>Einstellungen</h3>

                <div className="settings-group">
                    <label>Raster</label>
                    <select
                        value={resolution}
                        onChange={(e) => onResolutionChange(e.target.value as GridResolution)}
                        style={{ width: '100%' }}
                    >
                        <option value="4n">1/4 Note (Grob)</option>
                        <option value="8n">1/8 Note (Standard)</option>
                        <option value="16n">1/16 Note (Fein)</option>
                    </select>
                </div>

                <div className="settings-group">
                    <label>Tonleiter-Typ</label>
                    <select
                        value={globalScale}
                        onChange={(e) => onGlobalSettingsChange(e.target.value as ScaleType, globalKey)}
                        style={{ width: '100%' }}
                    >
                        <option value="pentatonic">Pentatonik (5 Töne)</option>
                        <option value="whole">Tonleiter (8 Töne)</option>
                    </select>
                </div>

                <div className="settings-group">
                    <label>Tonart</label>
                    <select
                        value={globalKey}
                        onChange={(e) => onGlobalSettingsChange(globalScale, e.target.value as KeyOption)}
                        style={{ width: '100%' }}
                    >
                        {Object.entries(KEY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="settings-group">
                    <label>Länge (Takte)</label>
                    <div className="settings-row">
                        <select
                            value={bars}
                            onChange={(e) => onBarsChange(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <option key={n} value={n}>{n} Takt{n !== 1 ? 'e' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn btn-primary">Fertig</button>
                </div>
            </div>
        </div>
    );
};
