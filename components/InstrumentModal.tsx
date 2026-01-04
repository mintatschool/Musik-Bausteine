import React from 'react';
import { InstrumentType } from '../types';
import { INSTR_CONFIG } from '../constants';

interface InstrumentModalProps {
    onAddTrack: (type: InstrumentType) => void;
    onClose: () => void;
}

export const InstrumentModal: React.FC<InstrumentModalProps> = ({ onAddTrack, onClose }) => {
    const instruments = [
        { type: 'drums' as InstrumentType, label: 'Drums' },
        { type: 'bass' as InstrumentType, label: 'Bass' },
        { type: 'guitar' as InstrumentType, label: 'Gitarre' },
        { type: 'keyboard' as InstrumentType, label: 'Keyboard' }
    ];

    return (
        <div className="modal-bg">
            <div className="modal">
                <h3 style={{ marginTop: 0 }}>Neue Spur hinzufügen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {instruments.map(opt => (
                        <button
                            key={opt.type}
                            onClick={() => onAddTrack(opt.type)}
                            className="btn"
                            style={{ height: '60px', justifyContent: 'center', gap: '10px' }}
                        >
                            <span style={{ fontSize: '20px' }}>{INSTR_CONFIG[opt.type].icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn">Abbrechen</button>
                </div>
            </div>
        </div>
    );
};
