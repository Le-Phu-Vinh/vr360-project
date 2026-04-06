import React, { useState, useEffect } from 'react';
import { 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Glasses,
  Info,
  MapPin
} from 'lucide-react';
import VRViewer from './components/VRViewer';

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleAutoRotate = () => {
    setIsAutoRotate(prev => !prev);
  };

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <div className="app-title" style={{ marginTop: '20px' }}>Loading VR Experience...</div>
        </div>
      )}

      {/* Header UI */}
      <div className="overlay-header">
        <div className="logo-container">
          <Glasses className="logo-icon" size={32} />
          <h1 className="app-title">VR360 Explorer</h1>
        </div>
      </div>

      {/* Right Side Info Panel */}
      {!isLoading && (
        <div className="glass-panel">
          <h2 className="panel-title">Royal Esplanade</h2>
          <p className="panel-content">
            Experience the stunning 360° panoramic view of this breathtaking location. 
            Drag your mouse or use touch devices to look around. Scroll to zoom in and out.
          </p>
          
          <div className="info-item">
            <MapPin size={20} color="#6366f1" />
            <span>Virtual Tour Location</span>
          </div>
          
          <div className="info-item">
            <Info size={20} color="#a855f7" />
            <span>High Resolution 360° Panorama</span>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {!isLoading && (
        <div className="overlay-controls">
          <div 
            className="control-btn" 
            onClick={toggleAutoRotate}
            title={isAutoRotate ? "Pause Rotation" : "Auto Rotate"}
          >
            {isAutoRotate ? <Pause size={24} /> : <Play size={24} />}
          </div>
          <div 
            className="control-btn" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <VRViewer isAutoRotate={isAutoRotate} />
    </div>
  );
}

export default App;
