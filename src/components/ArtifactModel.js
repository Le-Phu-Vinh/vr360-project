import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { TextureLoader } from 'three';
import { OrbitControls, PerspectiveCamera, Center, Float } from '@react-three/drei';

const Model = ({ plyUrl, textureUrl, axes = [0, 0, 0, 0], mouseRotation = false }) => {
  const meshRef = useRef();
  const geometry = useLoader(PLYLoader, plyUrl);
  const texture = useLoader(TextureLoader, textureUrl);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Tính toán normals nếu model không có sẵn để hiển thị đúng ánh sáng
  useMemo(() => {
    if (geometry) {
      geometry.computeVertexNormals();
      geometry.rotateX(Math.PI); // Lật lại vật thể nếu bị ngược đầu
    }
    if (texture) {
      texture.flipY = false;
    }
  }, [geometry, texture]);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
        if (!mouseRotation || !meshRef.current) return;
        
        // Tính độ lệch chuột (hoặc joystick ở chế độ mouse)
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        // Chỉ cộng dồn nếu độ lệch vừa phải (tránh nhảy vọt khi mới bật mode)
        if (Math.abs(deltaX) < 100 && Math.abs(deltaY) < 100) {
            meshRef.current.rotation.y += deltaX * 0.01;
            meshRef.current.rotation.x += deltaY * 0.01;
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseRotation]);

  useFrame(() => {
    // Polling trực tiếp từ Gamepad API để có độ trễ thấp nhất và chính xác nhất
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0] || gamepads[1]; // Kiểm tra cả 2 slot đầu tiên
    
    let xMove = 0;
    let yMove = 0;

    if (gp) {
        // Cộng dồn các trục (một số tay cầm dùng 0,1; một số dùng 2,3)
        xMove = (gp.axes[0] || 0) + (gp.axes[2] || 0);
        yMove = (gp.axes[1] || 0) + (gp.axes[3] || 0);
    } else {
        // Fallback dùng state từ prop nếu polling trực tiếp không có
        xMove = (axes[0] || 0) + (axes[2] || 0);
        yMove = (axes[1] || 0) + (axes[3] || 0);
    }

    if (meshRef.current && (Math.abs(xMove) > 0.05 || Math.abs(yMove) > 0.05)) {
        meshRef.current.rotation.y += xMove * 0.08;
        meshRef.current.rotation.x += yMove * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.5} />
    </mesh>
  );
};

const ArtifactModel = ({ plyUrl, textureUrl, axes = [0, 0, 0, 0], mouseRotation = false }) => {
  const isJoyStickActive = Math.abs(axes[0] || 0) > 0.1 || 
                           Math.abs(axes[1] || 0) > 0.1 || 
                           Math.abs(axes[2] || 0) > 0.1 || 
                           Math.abs(axes[3] || 0) > 0.1;

  return (
    <Canvas style={{ width: '100%', height: '100%' }} shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      <Suspense fallback={null}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Center>
            <Model 
              plyUrl={plyUrl} 
              textureUrl={textureUrl} 
              axes={axes} 
              mouseRotation={mouseRotation} 
            />
          </Center>
        </Float>
      </Suspense>
      
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        autoRotate={!isJoyStickActive && !mouseRotation}
        autoRotateSpeed={1}
      />
    </Canvas>
  );
};

export default ArtifactModel;
