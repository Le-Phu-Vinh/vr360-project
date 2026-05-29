import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ artifact, onClose }) => {
  const canvasContainerRef = useRef(null);

  if (!artifact) return null;

  const handleDownload = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${artifact.artifactId || artifact.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>QR Code - ${artifact.artifactId || artifact.id}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { width: 300px; height: 300px; }
            h2 { margin: 16px 0 4px; font-size: 20px; }
            p { margin: 0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <img src="${url}" alt="QR Code" />
          <h2>${artifact.name}</h2>
          <p>Mã: ${artifact.artifactId || artifact.id}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="qr-close-btn" onClick={onClose}>✕</button>

        <div className="qr-header">
          <div className="qr-badge">{artifact.artifactId || artifact.id}</div>
          <h2 className="qr-name">{artifact.name}</h2>
          <p className="qr-hint">Quét mã này bằng kính VR360 để xem thông tin hiện vật</p>
        </div>

        <div className="qr-canvas-wrapper" ref={canvasContainerRef}>
          <QRCodeCanvas
            value={`${window.location.origin}/?artifact=${artifact.artifactId || artifact.id}`}
            size={240}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="qr-actions">
          <button className="qr-btn qr-btn-download" onClick={handleDownload}>
            <span>⬇</span> Tải PNG
          </button>
          <button className="qr-btn qr-btn-print" onClick={handlePrint}>
            <span>🖨</span> In QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
