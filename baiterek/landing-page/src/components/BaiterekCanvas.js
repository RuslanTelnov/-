"use client";

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { useScroll } from 'framer-motion';
import BaiterekModel from './BaiterekModel';

export default function BaiterekCanvas() {
    const container = useRef(null);

    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end start']
    });

    return (
        <div ref={container} className="w-full h-full absolute inset-0 z-20">
            <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
                {/* Soft lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} color="#FFD700" />
                <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#4A90E2" />

                {/* The Model */}
                <BaiterekModel />

                {/* Environment mapping for reflections */}
                <Environment preset="city" />

                {/* Orbit controls enabled for rotation */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
}
