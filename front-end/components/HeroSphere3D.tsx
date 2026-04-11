"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function WireframeIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.15;
      meshRef.current.rotation.y = t * 0.2;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = -t * 0.25;
      innerRef.current.rotation.z = t * 0.18;
    }
  });

  return (
    <group>
      {/* Outer wireframe icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Inner solid icosahedron — emissive glow */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial
          color="#6b8fff"
          emissive="#6b8fff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* Center core */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.3}>
        <mesh>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial
            color="#9b6bff"
            emissive="#9b6bff"
            emissiveIntensity={1.5}
          />
        </mesh>
      </Float>

      {/* Vertex glow points on outer */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle1 = (i / 12) * Math.PI * 2;
        const angle2 = (i / 12) * Math.PI;
        const r = 2.6;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle1) * Math.sin(angle2) * r,
              Math.cos(angle2) * r,
              Math.sin(angle1) * Math.sin(angle2) * r,
            ]}
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
        );
      })}
    </group>
  );
}

export default function HeroSphere3D() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
          <pointLight position={[-10, -5, -10]} intensity={0.6} color="#9b6bff" />
          <pointLight position={[0, 0, 5]} intensity={0.5} color="#6b8fff" />

          <WireframeIcosahedron />
        </Suspense>
      </Canvas>
    </div>
  );
}
