"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function BaiterekModel({ isScrolling, scrollProgress }) {
    const groupRef = useRef();

    useFrame((state) => {
        // Gentle rotation of the whole structure over time
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;

            // Only tilt if it's the hero version (passed via scrollProgress)
            if (scrollProgress > 0) {
                groupRef.current.rotation.z = Math.sin(scrollProgress * Math.PI) * 0.1;
                // Scale down slightly as user scrolls past hero
                const initialScale = 1;
                const targetScale = Math.max(0.6, 1 - scrollProgress * 0.5);
                groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
            }
        }
    });

    return (
        <Float
            speed={2} // Animation speed, defaults to 1
            rotationIntensity={0.2} // XYZ rotation intensity, defaults to 1
            floatIntensity={0.5} // Up/down float intensity, works like a multiplier with floatingRange,defaults to 1
            floatingRange={[-0.1, 0.1]} // Range of y-axis values the object will float within, defaults to [-0.1,0.1]
        >
            <group ref={groupRef} position={[0, -2, 0]}>

                {/* The Golden Sphere (Samruk's Egg) */}
                <Sphere args={[1.5, 64, 64]} position={[0, 5, 0]}>
                    <MeshDistortMaterial
                        color="#FFD700"
                        emissive="#FFD700"
                        emissiveIntensity={0.8}
                        metalness={0.9}
                        roughness={0.1}
                        distort={0.1} // Subtle pulsing/distortion
                        speed={2}
                    />
                </Sphere>

                {/* The glowing core inside the sphere */}
                <pointLight position={[0, 5, 0]} color="#FFD700" intensity={10} distance={10} />

                {/* The Trunk (Tree of Life) */}
                {/* Main central pillar */}
                <Cylinder args={[0.3, 0.6, 8, 32]} position={[0, 0, 0]}>
                    <meshStandardMaterial
                        color="#E0E0E0"
                        metalness={0.6}
                        roughness={0.2}
                        transparent={true}
                        opacity={0.9}
                    />
                </Cylinder>

                {/* Outer structural branches */}
                <group position={[0, 0, 0]}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                        const angle = (i * Math.PI * 2) / 8;
                        const radius = 0.8;
                        return (
                            <group key={i} rotation={[0, angle, 0]}>
                                <Cylinder
                                    args={[0.05, 0.2, 8.5, 16]}
                                    position={[0, 0, radius]}
                                    rotation={[0.1, 0, 0]}
                                >
                                    <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
                                </Cylinder>
                                {/* Branch connecting to the sphere */}
                                <Cylinder
                                    args={[0.02, 0.05, 3, 16]}
                                    position={[0, 4.5, radius * 1.5]}
                                    rotation={[-0.6, 0, 0]}
                                >
                                    <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
                                </Cylinder>
                            </group>
                        );
                    })}
                </group>

                {/* Base */}
                <Cylinder args={[2, 2.5, 0.5, 32]} position={[0, -4, 0]}>
                    <meshStandardMaterial color="#333333" metalness={0.4} roughness={0.6} />
                </Cylinder>
                <Cylinder args={[3, 3, 0.2, 32]} position={[0, -4.3, 0]}>
                    <meshStandardMaterial color="#1a1a1a" />
                </Cylinder>

            </group>
        </Float>
    );
}
