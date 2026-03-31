"use client";

import { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Golden Particles ─── */
function GoldenParticles({ count = 1500 }) {
  const meshRef = useRef();

  const { positions, colors, speeds, angles, radii } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);

    const golds = [
      [0.83, 0.69, 0.22],
      [0.96, 0.84, 0.56],
      [0.72, 0.53, 0.04],
      [1.0, 0.9, 0.65],
      [0.9, 0.75, 0.3],
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 8 + 0.5;
      const y = (Math.random() - 0.5) * 20;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const c = golds[Math.floor(Math.random() * golds.length)];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];

      speeds[i] = Math.random() * 0.008 + 0.002;
      angles[i] = angle;
      radii[i] = radius;
    }

    return { positions, colors, speeds, angles, radii };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spiral upward
      angles[i] += 0.001 + speeds[i] * 0.05;
      pos[i3] = Math.cos(angles[i]) * radii[i];
      pos[i3 + 1] += speeds[i];
      pos[i3 + 2] = Math.sin(angles[i]) * radii[i];

      // Add gentle wave
      pos[i3] += Math.sin(t * 0.3 + i * 0.01) * 0.02;

      // Reset at top
      if (pos[i3 + 1] > 10) {
        pos[i3 + 1] = -10;
        radii[i] = Math.random() * 8 + 0.5;
        angles[i] = Math.random() * Math.PI * 2;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.04}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Central Glowing Orb ─── */
function GlowOrb() {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outerRef.current) {
      outerRef.current.scale.setScalar(1 + Math.sin(t * 0.4) * 0.15);
      outerRef.current.material.opacity = 0.06 + Math.sin(t * 0.6) * 0.03;
    }
    if (innerRef.current) {
      innerRef.current.scale.setScalar(0.5 + Math.sin(t * 0.7) * 0.05);
      innerRef.current.material.emissiveIntensity = 0.6 + Math.sin(t * 0.5) * 0.3;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
      {/* Outer glow sphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Inner core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.6}
          transparent
          opacity={0.15}
          metalness={1}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

/* ─── Scene ─── */
function Scene() {
  return (
    <>
      {/* transparent bg — photo shows through */}
      <fog attach="fog" args={["#111111", 8, 25]} />
      <ambientLight intensity={0.03} />
      <pointLight position={[0, 2, 0]} color="#FFD700" intensity={2} distance={20} />
      <pointLight position={[3, -1, 2]} color="#CCAC00" intensity={0.8} distance={15} />
      <pointLight position={[-3, 1, -2]} color="#FFE033" intensity={0.5} distance={12} />
      <GoldenParticles />
    </>
  );
}

/* ─── Main Export ─── */
export default function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full" style={{ background: "#111111" }} />
    );
  }

  return (
    <div className="h-full w-full">
      <Suspense
        fallback={<div className="h-full w-full" />}
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            gl.setClearColor("#000000", 0);
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
