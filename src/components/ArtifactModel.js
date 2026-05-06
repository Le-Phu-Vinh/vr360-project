import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { TextureLoader } from 'three';
import { OrbitControls, PerspectiveCamera, Center, Float } from '@react-three/drei';

const Model = ({ plyUrl, textureUrl, axes = [0, 0, 0, 0], mouseRotation = false }) => {
  const meshRef = useRef();
  const groupRef = useRef();
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
        
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        // Chỉ cập nhật nếu đây không phải là lần di chuyển đầu tiên (tránh nhảy vọt)
        if (lastMousePos.current.x !== 0 && Math.abs(deltaX) < 100 && Math.abs(deltaY) < 100) {
            meshRef.current.rotation.y += deltaX * 0.01;
            meshRef.current.rotation.x += deltaY * 0.01;
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseRotation]);

  useFrame(() => {
    // Sử dụng performance.now() để đồng bộ tuyệt đối giữa 2 mắt (Canvas riêng biệt)
    const t = performance.now() / 1000;

    // 1. Hiệu ứng trôi nổi (Float) đồng bộ
    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.15;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
        groupRef.current.rotation.x = Math.cos(t * 0.5) * 0.05;
    }

    // 2. Logic xoay tự động (AutoRotate) đồng bộ
    const isJoyStickActive = Math.abs(axes[0] || 0) > 0.1 || 
                             Math.abs(axes[1] || 0) > 0.1 || 
                             Math.abs(axes[2] || 0) > 0.1 || 
                             Math.abs(axes[3] || 0) > 0.1;

    if (!isJoyStickActive && !mouseRotation && meshRef.current) {
        // Tăng dần rotation y theo thời gian thực thay vì cộng dồn delta để tránh lệch phase
        meshRef.current.rotation.y = t * 0.5; 
        meshRef.current.rotation.x = 0; // Reset x khi ở chế độ auto
    }

    // 3. Điều khiển bằng Gamepad/Joystick
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

    if (meshRef.current && (Math.abs(xMove) > 0.05 || Math.abs(yMove) > 0.05)) {
        meshRef.current.rotation.y += xMove * 0.08;
        meshRef.current.rotation.x += yMove * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
        <Center>
            <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial map={texture} roughness={0.5} metalness={0.5} />
            </mesh>
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
      
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        autoRotate={false} 
      />
    </Canvas>
  );
};

export default ArtifactModel;
