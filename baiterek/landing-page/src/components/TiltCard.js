"use client";

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import ErrorBoundary from './ErrorBoundary';

const ProductModel = dynamic(() => import('./ProductModel'), {
    ssr: false,
    loading: () => <div className="text-gold-500/50 text-sm font-bold tracking-widest animate-pulse flex items-center justify-center w-full h-full">LOADING 3D...</div>
});

const BaiterekModel = dynamic(() => import('./BaiterekModel'), {
    ssr: false
});

// Custom 3D Tilt Card based on Framer Motion
export default function TiltCard({ title, bgImage, productImage, description, modelSrc, isBaiterek }) {
    const ref = useRef(null);
    const [hovered, setHovered] = useState(false);

    // Mouse tracking
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    // Map mouse coordinates to rotation
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className="relative w-full max-w-sm aspect-[3/4] rounded-2xl cursor-pointer group glass-dark transition-all duration-300"
        >
            {/* Clean Glass Background container */}
            <div
                className="absolute inset-2 rounded-2xl overflow-hidden opacity-10 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-tr from-white/10 to-transparent backdrop-blur-sm"
                style={{ transform: "translateZ(-30px)" }}
            >
            </div>

            {/* Main Product Image or 3D Model (Pops out in 3D) */}
            <motion.div
                className={`absolute inset-0 flex items-center justify-center drop-shadow-2xl ${(modelSrc || isBaiterek) ? '' : 'pointer-events-none'}`}
                style={{ transform: "translateZ(80px)" }}
            >
                {isBaiterek ? (
                    <div className="w-full h-full p-4" onPointerDown={(e) => e.stopPropagation()}>
                        <div className="w-full h-full cursor-grab active:cursor-grabbing">
                            <ProductModel isBaiterek />
                        </div>
                    </div>
                ) : modelSrc ? (
                    <ErrorBoundary fallback={
                        <Image
                            src={productImage}
                            alt={title}
                            width={350}
                            height={450}
                            className={`object-contain transition-transform duration-500 scale-100 drop-shadow-[0_0_40px_rgba(212,175,55,0.6)]`}
                        />
                    }>
                        <div className="w-full h-full p-8 cursor-grab active:cursor-grabbing" onPointerDown={(e) => e.stopPropagation()}>
                            <ProductModel url={modelSrc} />
                        </div>
                    </ErrorBoundary>
                ) : (
                    <Image
                        src={productImage}
                        alt={title}
                        width={350}
                        height={450}
                        className={`object-contain transition-transform duration-500 ${hovered ? 'scale-110 drop-shadow-[0_0_40px_rgba(212,175,55,0.6)]' : 'scale-100'}`}
                    />
                )}
            </motion.div>

            {/* Content overlay */}
            <div
                className="absolute bottom-6 left-6 right-6 text-center pointer-events-none text-white"
                style={{ transform: "translateZ(100px)" }}
            >
                <h3 className="text-3xl font-black tracking-widest uppercase mb-1 drop-shadow-lg glow-text">{title}</h3>
                <p className="text-sm text-gold-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {description}
                </p>
            </div>

            {/* Glare effect */}
            <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${hovered ? (x.get() + 0.5) * 100 : 50}% ${hovered ? (y.get() + 0.5) * 100 : 50}%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
                    transform: "translateZ(10px)"
                }}
            />
        </motion.div>
    );
}
