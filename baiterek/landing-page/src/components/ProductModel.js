"use client";

import { Center, OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import BaiterekModel from './BaiterekModel';

function Model({ url, isBaiterek }) {
    if (isBaiterek) return <BaiterekModel scrollProgress={0} />;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gltf = useGLTF(url);

    useMemo(() => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                // Apply a very shiny gold material
                child.material = new THREE.MeshStandardMaterial({
                    color: "#d4af37",
                    metalness: 1.0,
                    roughness: 0.1,
                    envMapIntensity: 1.5
                });
            }
        });
    }, [gltf]);

    return (
        <Center>
            <primitive object={gltf.scene} rotation={[0, 0, 0]} scale={[5, 5, 5]} />
        </Center>
    );
}

export default function ProductModel({ url, isBaiterek }) {
    return (
        <div className="w-full h-full cursor-grab active:cursor-grabbing" style={{ pointerEvents: 'auto' }}>
            <Canvas camera={{ position: [0, 0, isBaiterek ? 15 : 10], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={isBaiterek ? 0.8 : 0.7} />
                <spotLight position={[10, 10, 10]} intensity={2.5} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#fffd" />
                <Environment preset="city" />
                <Model url={url} isBaiterek={isBaiterek} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={isBaiterek ? 3 : 2} />
            </Canvas>
        </div>
    );
}
