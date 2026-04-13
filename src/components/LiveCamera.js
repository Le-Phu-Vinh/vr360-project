import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { artifactsData } from '../data/artifacts';
import { artifactVideos } from '../data/videos';
import './LiveCamera.css';

const LiveCamera = () => {
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = mediaStream;
      setHasPermission(true);
      
      if (leftVideoRef.current && rightVideoRef.current) {
         leftVideoRef.current.srcObject = mediaStream;
         rightVideoRef.current.srcObject = mediaStream;

         leftVideoRef.current.onloadedmetadata = () => {
             leftVideoRef.current.play();
             scanIntervalRef.current = setInterval(scanQRCode, 500);
         };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const scanQRCode = () => {
    const video = leftVideoRef.current;
    const canvas = canvasRef.current;
    
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code && code.data) {
        const found = artifactsData.find(a => a.id === code.data);
        if (found) {
            setCurrentArtifact(prev => prev?.id !== found.id ? found : prev);
        }
      }
    }
  };

  const enterFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      }
      
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        await window.screen.orientation.lock('landscape');
      }
    } catch (err) {
      console.warn("Fullscreen or orientation lock error:", err);
    }
  };

  const HUD = () => {
    if (!currentArtifact) return null;
    const matchingVideo = artifactVideos.find(v => v.id === currentArtifact.id);

    return (
      <div className="artifact-card">
        <div className="card-header">
          <div className="card-id">ID: {currentArtifact.id}</div>
          <h2 className="card-title">{currentArtifact.name}</h2>
        </div>
        <div className="card-body">
          <p className="card-detail"><span>Nguồn gốc:</span> {currentArtifact.origin}</p>
          <p className="card-detail"><span>Niên đại:</span> {currentArtifact.period}</p>
          <p className="card-detail"><span>Vật liệu:</span> {currentArtifact.material}</p>
          <p className="card-desc">{currentArtifact.description}</p>
          {matchingVideo && (
            <div className="card-video-container">
               <video 
                 src={matchingVideo.videoUrl} 
                 autoPlay 
                 loop 
                 playsInline 
                 className="artifact-video"
               />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (hasPermission === false) {
    return (
      <div className="camera-container error-state">
        <p>Vui lòng cấp quyền truy cập camera để xem màn hình này.</p>
        <button onClick={startCamera}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="camera-container" onClick={enterFullscreen}>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <div className="eye-view left-eye">
        <video ref={leftVideoRef} autoPlay playsInline muted className="camera-video" />
        <HUD />
      </div>

      <div className="divider"></div>

      <div className="eye-view right-eye">
        <video ref={rightVideoRef} autoPlay playsInline muted className="camera-video" />
        <HUD />
      </div>
    </div>
  );
};

export default LiveCamera;
