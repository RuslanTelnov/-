"use client";

import { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion, useSpring } from 'framer-motion';
import Image from 'next/image';

export default function HeroBackground() {
    const container = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const moveX = (clientX / window.innerWidth - 0.5) * 40; // max 20px move
            const moveY = (clientY / window.innerHeight - 0.5) * 40;
            setMousePos({ x: moveX, y: moveY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const springX = useSpring(mousePos.x, { stiffness: 50, damping: 20 });
    const springY = useSpring(mousePos.y, { stiffness: 50, damping: 20 });

    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end start']
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 0.5, 0.2]);
    const blur = useTransform(scrollYProgress, [0, 1], [0, 10]);

    return (
        <div ref={container} className="h-full w-full relative bg-dark-900 overflow-hidden">
            <motion.div
                style={{
                    scale,
                    opacity,
                    filter: `blur(${blur}px)`,
                    x: springX,
                    y: springY
                }}
                className="w-full h-full absolute inset-0 origin-center scale-110"
            >
                <Image
                    src="/assets/baiterek_bg_new.png"
                    alt="Baiterek Cinematic Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                    quality={100}
                />

                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-dark-900/30 via-transparent to-dark-900/90" />
            </motion.div>

            {/* Dynamic Light Blobs for extra Wow */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"
            />
        </div>
    );
}
