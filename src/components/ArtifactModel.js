import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { TextureLoader } from 'three';
import { PerspectiveCamera, Center } from '@react-three/drei';

// Shared state for all instances of ArtifactModel to ensure perfect synchronization
const sharedSyncState = {
  manualRotation: { x: 0, y: 0 },
  lastUpdate: performance.now(),
  instances: new Set() // Track instances to designate a primary one for updates
};

const Model = ({ plyUrl, textureUrl, axes = [0, 0, 0, 0], mouseRotation = false }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const instanceId = useRef(Math.random());
  const geometry = useLoader(PLYLoader, plyUrl);
  const texture = useLoader(TextureLoader, textureUrl);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useMemo(() => {
    if (geometry) {
      geometry.computeVertexNormals();
      // NOTE: We no longer call geometry.rotateX(Math.PI) here because it mutates 
      // the shared cached geometry, causing mismatches between eyes.
      // Rotation is now handled by a wrapper group in the JSX.
    }
    if (texture) {
      texture.flipY = false;
    }
  }, [geometry, texture]);

  useEffect(() => {
    sharedSyncState.instances.add(instanceId.current);
    
    const handleMouseMove = (e) => {
        if (!mouseRotation) return;
        
        // Only the first instance processes the mouse event to update the shared state
        const instances = Array.from(sharedSyncState.instances);
        if (instances[0] !== instanceId.current) return;

        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        if (lastMousePos.current.x !== 0 && Math.abs(deltaX) < 100 && Math.abs(deltaY) < 100) {
            sharedSyncState.manualRotation.y += deltaX * 0.01;
            sharedSyncState.manualRotation.x += deltaY * 0.01;
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        sharedSyncState.instances.delete(instanceId.current);
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseRotation]);

  useFrame(() => {
    const now = performance.now();
    const t = now / 1000;
    const dt = Math.min((now - sharedSyncState.lastUpdate) / 1000, 0.1);
    
    // Designated primary instance updates the shared state
    const instances = Array.from(sharedSyncState.instances);
    const isPrimary = instances[0] === instanceId.current;

    if (isPrimary) {
        // 1. Update Manual Rotation from Gamepad
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0] || gamepads[1];
        
        let xMove = 0, yMove = 0;
        if (gp) {
            xMove = (gp.axes[0] || 0) + (gp.axes[2] || 0);
            yMove = (gp.axes[1] || 0) + (gp.axes[3] || 0);
        } else {
            xMove = (axes[0] || 0) + (axes[2] || 0);
            yMove = (axes[1] || 0) + (axes[3] || 0);
        }

        if (Math.abs(xMove) > 0.05 || Math.abs(yMove) > 0.05) {
            sharedSyncState.manualRotation.y += xMove * 0.08;
            sharedSyncState.manualRotation.x += yMove * 0.08;
        }
        
        sharedSyncState.lastUpdate = now;
    }

    // 2. Apply Synchronized Animations
    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.15;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
        groupRef.current.rotation.x = Math.cos(t * 0.5) * 0.05;
    }

    if (meshRef.current) {
        const isJoyStickActive = Math.abs(axes[0] || 0) > 0.1 || 
                                 Math.abs(axes[1] || 0) > 0.1 || 
                                 Math.abs(axes[2] || 0) > 0.1 || 
                                 Math.abs(axes[3] || 0) > 0.1;

        if (!isJoyStickActive && !mouseRotation) {
            // Auto-rotate logic: deterministic based on time
            meshRef.current.rotation.y = t * 0.5; 
            meshRef.current.rotation.x = 0;
            // Sync the manual state to the current auto state to avoid jumps when switching
            sharedSyncState.manualRotation.y = meshRef.current.rotation.y;
            sharedSyncState.manualRotation.x = 0;
        } else {
            // Manual rotation logic: use shared state
            meshRef.current.rotation.y = sharedSyncState.manualRotation.y;
            meshRef.current.rotation.x = sharedSyncState.manualRotation.x;
        }
    }
  });

  return (
    <group ref={groupRef}>
        <Center>
            {/* Added a rotation group to handle the vertical flip consistently across all instances */}
            <group rotation={[Math.PI, 0, 0]}>
                <mesh ref={meshRef} geometry={geometry}>
                    <meshStandardMaterial map={texture} roughness={0.5} metalness={0.5} />
                </mesh>
            </group>
        </Center>
    </group>
  );
};

const ArtifactModel = ({ plyUrl, textureUrl, axes = [0, 0, 0, 0], mouseRotation = false }) => {
  return (
    <Canvas style={{ width: '100%', height: '100%' }} shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      <Suspense fallback={null}>
        <Model 
          plyUrl={plyUrl} 
          textureUrl={textureUrl} 
          axes={axes} 
          mouseRotation={mouseRotation} 
        />
      </Suspense>
    </Canvas>
  );
};

export default ArtifactModel;
