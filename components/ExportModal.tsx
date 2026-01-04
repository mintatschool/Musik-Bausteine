import React from 'react';

interface ExportModalProps {
    qrUrl: string;
    showFullQr: boolean;
    onShowFullQr: () => void;
    onHideFullQr: () => void;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    qrUrl,
    showFullQr,
    onShowFullQr,
    onHideFullQr,
    onClose
}) => {
    return (
        <>
            <div className="modal-bg">
                <div className="modal" style={{ textAlign: 'center' }}>
                    <h3 style={{ marginTop: 0 }}>Song teilen</h3>
                    <p style={{ fontSize: '15px', color: '#666', marginBottom: '20px' }}>
                        Dein Song ist in der URL gespeichert. Scanne diesen QR-Code, um ihn auf einem anderen Gerät zu öffnen.
                    </p>
                    <p style={{ fontSize: '13px', color: '#999', marginBottom: '10px' }}>
                        Tippe auf den QR-Code, um ihn zu vergrößern.
                    </p>

                    <div className="qr-container">
                        {qrUrl ? (
                            <img
                                src={qrUrl}
                                alt="QR Code"
                                className="qr-canvas"
                                onClick={onShowFullQr}
                            />
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center' }}>Lade...</div>
                        )}
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button onClick={onClose} className="btn btn-primary">Schließen</button>
                    </div>
                </div>
            </div>

            {/* Fullscreen QR Overlay */}
            {showFullQr && qrUrl && (
                <div className="qr-fullscreen-overlay" onClick={onHideFullQr}>
                    <img src={qrUrl} alt="QR Fullscreen" />
                    <p>Zum Schließen tippen</p>
                </div>
            )}
        </>
    );
};
