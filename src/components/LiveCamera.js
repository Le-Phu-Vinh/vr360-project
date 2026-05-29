import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import ArtifactModel from './ArtifactModel';
import useGamepad from '../hooks/useGamepad';
import { useArtifacts } from '../context/ArtifactContext';
import './LiveCamera.css';

const LiveCamera = () => {
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [isJoyRotationActive, setIsJoyRotationActive] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  // Trạng thái cài đặt màn hình thủ công
  const [showSettings, setShowSettings] = useState(false);
  const [settingGap, setSettingGap] = useState(0);
  const [settingEyeWidth, setSettingEyeWidth] = useState(38);
  const [settingEyeHeight, setSettingEyeHeight] = useState(85);

  const { gamepad, buttonStates, axes } = useGamepad();
  const { artifacts } = useArtifacts();

  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Xử lý nút bấm Gamepad và Bàn phím (Mouse Mode)
  useEffect(() => {
    const handleKeyDown = (e) => {
        const key = e.key.toLowerCase();
        if (key === '@' || key === 'm') {
            setIsJoyRotationActive(prev => !prev);
        }
        if (key === 'i') {
            setShowInfo(prev => !prev);
        }
        if (key === 'v') {
            setShowVideo(prev => !prev);
        }
        // Tay cầm VR thường map nút 'C' sang Volume Up / Down ở chế độ media
        if (
            key === 'c' || 
            e.key === 'AudioVolumeUp' || 
            e.code === 'VolumeUp' ||
            e.key === 'AudioVolumeDown' ||
            e.code === 'VolumeDown'
        ) {
            setShowSettings(prev => !prev);
            if(e.cancelable) e.preventDefault();
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    if (gamepad) {
        if (buttonStates[0]) setShowInfo(prev => !prev);
        if (buttonStates[1]) {
            setCurrentArtifact(null);
            setShowInfo(false);
            setShowVideo(false);
        }
        if (buttonStates[2]) setShowVideo(prev => !prev);
        if (buttonStates[3]) setIsJoyRotationActive(prev => !prev);
    }

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [buttonStates, gamepad]);

  // Show info automatically when a new artifact is scanned or loaded
  useEffect(() => {
    if (currentArtifact) {
      setShowInfo(true);
      setShowVideo(false);
    } else {
      setShowInfo(false);
      setShowVideo(false);
    }
  }, [currentArtifact]);

  // Load artifact from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artifactId = params.get('artifact');
    if (artifactId && artifacts && artifacts.length > 0) {
      const found = artifacts.find(a => a.id === artifactId || a.artifactId === artifactId);
      if (found && (!currentArtifact || currentArtifact.id !== found.id)) {
        setCurrentArtifact(found);
      }
    }
  }, [artifacts]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự động gán stream khi refs đã sẵn sàng
  useEffect(() => {
    if (hasPermission && streamRef.current && leftVideoRef.current && rightVideoRef.current) {
        const setupVideos = async () => {
            leftVideoRef.current.srcObject = streamRef.current;
            rightVideoRef.current.srcObject = streamRef.current;
            
            try {
                await Promise.all([
                    leftVideoRef.current.play(),
                    rightVideoRef.current.play()
                ]);
                console.log("Camera videos playing");
            } catch (err) {
                console.warn("Auto-play blocked, waiting for user interaction", err);
            }
            
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = setInterval(scanQRCode, 500);
        };
        setupVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = {
        video: { 
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback cho một số trình duyệt không hỗ trợ ideal environment
      try {
        const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = simpleStream;
        setHasPermission(true);
      } catch (fallbackErr) {
        setHasPermission(false);
      }
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
        let scannedId = code.data;
        try {
          const url = new URL(code.data);
          const urlParams = new URLSearchParams(url.search);
          if (urlParams.has('artifact')) {
            scannedId = urlParams.get('artifact');
          }
        } catch (e) {
          // Not a valid URL, fallback to raw string
        }
        
        const found = artifacts.find(a => a.id === scannedId || a.artifactId === scannedId);
        if (found) {
            setCurrentArtifact(prev => prev?.id !== found.id ? found : prev);
        }
      }
    }
  };

  const enterFullscreen = async () => {
    const elem = document.documentElement;
    
    // Đảm bảo video chạy khi người dùng tương tác (khắc phục lỗi màn hình đen ở một số trình duyệt)
    if (leftVideoRef.current) leftVideoRef.current.play().catch(e => console.log("Play error:", e));
    if (rightVideoRef.current) rightVideoRef.current.play().catch(e => console.log("Play error:", e));

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
    const matchingVideo = currentArtifact.videoUrl
      ? { videoUrl: currentArtifact.videoUrl, title: currentArtifact.videoTitle }
      : null;

    return (
      <div className="artifact-card">
        {showInfo && (
          <div className="card-info-section">
            <div className="card-header">
              <div className="card-id">ID: {currentArtifact.id}</div>
              <h2 className="card-title">{currentArtifact.name}</h2>
              <div className="status-row">
                  {gamepad && <div className="gamepad-status active">🎮 Connected</div>}
              </div>
            </div>
            <div className="card-body">
              <p className="card-detail"><span>Nguồn gốc:</span> {currentArtifact.origin}</p>
              <p className="card-detail"><span>Niên đại:</span> {currentArtifact.period}</p>
              <p className="card-detail"><span>Vật liệu:</span> {currentArtifact.material}</p>
              <p className="card-desc">{currentArtifact.description}</p>
            </div>
          </div>
        )}
        
        {currentArtifact.modelUrl && currentArtifact.textureUrl && (
          <div className={`card-model-section ${!(showInfo || showVideo) ? 'centered' : ''}`}>
            <ArtifactModel 
              plyUrl={currentArtifact.modelUrl} 
              textureUrl={currentArtifact.textureUrl} 
              axes={axes}
              mouseRotation={isJoyRotationActive}
            />
          </div>
        )}

        {showVideo && matchingVideo && (
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
    );
  };

  const VRToolbar = () => {
    if (!currentArtifact || showSettings) return null;
    return (
      <div className="vr-toolbar" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <button 
          className={`toolbar-btn ${showInfo ? 'active' : ''}`}
          onClick={() => setShowInfo(!showInfo)}
        >
          📄
        </button>
        <button 
          className={`toolbar-btn ${showVideo ? 'active' : ''}`}
          onClick={() => setShowVideo(!showVideo)}
        >
          🎬
        </button>
        <button 
          className={`toolbar-btn ${isJoyRotationActive ? 'active' : ''}`}
          onClick={() => setIsJoyRotationActive(!isJoyRotationActive)}
        >
          🔄
        </button>
        <button 
          className="toolbar-btn reset-btn"
          onClick={() => {
            setCurrentArtifact(null);
            setShowInfo(false);
            setShowVideo(false);
          }}
        >
          🗑️
        </button>
      </div>
    );
  };

  const SettingsMenu = () => {
    if (!showSettings) return null;
    return (
      <div className="settings-menu" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <div className="settings-title">Chỉnh Màn Hình VR</div>
        
        <div className="setting-item">
          <span>Khoảng cách: {settingGap.toFixed(1)}vw</span>
          <div className="setting-btns">
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingGap(v => Math.max(0, v - 0.5)); }}>-</button>
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingGap(v => v + 0.5); }}>+</button>
          </div>
        </div>
        
        <div className="setting-item">
          <span>Chiều rộng: {settingEyeWidth.toFixed(1)}vw</span>
          <div className="setting-btns">
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingEyeWidth(v => Math.max(10, v - 1)); }}>-</button>
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingEyeWidth(v => Math.min(100, v + 1)); }}>+</button>
          </div>
        </div>
        
        <div className="setting-item">
          <span>Chiều cao: {settingEyeHeight.toFixed(1)}vh</span>
          <div className="setting-btns">
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingEyeHeight(v => Math.max(10, v - 1)); }}>-</button>
            <button onPointerDown={(e) => { e.stopPropagation(); setSettingEyeHeight(v => Math.min(100, v + 1)); }}>+</button>
          </div>
        </div>

        <div className="setting-item">
          <span>Tắt (Phím C)</span>
          <div className="setting-btns">
            <button style={{width: 'auto', padding: '0 8px'}} onPointerDown={(e) => { e.stopPropagation(); setShowSettings(false); }}>Đóng</button>
          </div>
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
    <div className="camera-container" style={{ gap: `${settingGap}vw` }} onClick={enterFullscreen}>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <div className="eye-view left-eye" style={{ width: `${settingEyeWidth}vw`, height: `${settingEyeHeight}vh` }}>
        <video ref={leftVideoRef} autoPlay playsInline muted className="camera-video" />
        <HUD />
        <VRToolbar />
        <SettingsMenu />
        
        {!showSettings && (
          <button 
             className="floating-settings-btn"
             onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
             onPointerDown={(e) => { e.stopPropagation(); setShowSettings(true); }}
             title="Cài đặt VR"
          >
            ⚙️
          </button>
        )}
      </div>

      <div className="divider"></div>

      <div className="eye-view right-eye" style={{ width: `${settingEyeWidth}vw`, height: `${settingEyeHeight}vh` }}>
        <video ref={rightVideoRef} autoPlay playsInline muted className="camera-video" />
        <HUD />
        <VRToolbar />
        <SettingsMenu />
        
        {!showSettings && (
          <button 
             className="floating-settings-btn"
             onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
             onPointerDown={(e) => { e.stopPropagation(); setShowSettings(true); }}
             title="Cài đặt VR"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveCamera;
