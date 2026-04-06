import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const SphereBackground = ({ textureUrl }) => {
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  const meshRef = useRef();

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* 
        A huge sphere inside which the camera will be placed. 
        Inverting the X scale flips the normals inwards so we see the image from inside.
      */}
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

const VRViewer = ({ isAutoRotate }) => {
  return (
    <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
      {/* Enables user interaction to rotate the 360 view */}
      <OrbitControls 
        enableZoom={true} 
        enablePan={false} 
        enableDamping={true}
        dampingFactor={0.05}
        autoRotate={isAutoRotate}
        autoRotateSpeed={0.5}
        rotateSpeed={-0.5} /* Negative to make drag direction feel natural inside a sphere */
      />
      
      {/* Suspense is needed when using useLoader */}
      <React.Suspense fallback={null}>
        <SphereBackground textureUrl="/pano.jpg" />
      </React.Suspense>
    </Canvas>
  );
};

export default VRViewer;
