"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

const noteLabels = {
  top: { label: "ВЕРХНИЕ НОТЫ", icon: "✦" },
  mid: { label: "СРЕДНИЕ НОТЫ", icon: "◆" },
  base: { label: "БАЗОВЫЕ НОТЫ", icon: "●" },
};

const noteColors = {
  top: "from-gold-400/20 to-gold-400/5",
  mid: "from-gold-500/20 to-gold-500/5",
  base: "from-gold-700/20 to-gold-700/5",
};

function FragranceNotes({ notes }) {
  return (
    <div className="space-y-3">
      {Object.entries(notes).map(([key, items], i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          className={`relative overflow-hidden rounded-lg p-4 bg-gradient-to-r ${noteColors[key]} border border-gold-500/10 group/note hover:border-gold-500/30 transition-all duration-500`}
        >
          <div className="flex items-start gap-3">
            <span className="text-gold-500/50 text-xs mt-0.5 group-hover/note:text-gold-500 transition-colors duration-300">
              {noteLabels[key].icon}
            </span>
            <div>
              <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-gold-500/50 group-hover/note:text-gold-500/80 transition-colors duration-300">
                {noteLabels[key].label}
              </span>
              <p className="text-sm text-white/75 mt-1 leading-relaxed group-hover/note:text-white/90 transition-colors duration-300">
                {items}
              </p>
            </div>
          </div>
          {/* Hover shimmer */}
          <div className="absolute inset-0 opacity-0 group-hover/note:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover/note:translate-x-[200%] transition-transform duration-1000" />
        </motion.div>
      ))}
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useState(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  });
  return isMobile;
}

function ProductCard({ product, isEven }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 30 });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 30 });

  function handleMouseMove(e) {
    if (!cardRef.current || isMobile) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="relative w-full max-w-[380px] mx-auto cursor-pointer"
    >
      {/* Card container */}
      <div className="relative rounded-2xl overflow-hidden border border-gold-500/10 hover:border-gold-500/25 transition-all duration-700 bg-dark-900/60 backdrop-blur-xl">
        {/* Dynamic glow that follows mouse */}
        <motion.div
          className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background: `radial-gradient(400px circle at ${glowX}% ${glowY}%, rgba(212,175,55,0.12), transparent 60%)`,
          }}
        />

        {/* Image area */}
        <div className="relative h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-dark-800/50 to-dark-900/80">
          {/* Background shimmer */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500/[0.06] rounded-full blur-[80px] transition-transform duration-1000"
              style={{ transform: isHovered ? 'scale(1.3)' : 'scale(1)' }}
            />
          </div>

          {/* Product image with 3D transform */}
          <motion.div
            className="relative z-10"
            style={{ translateZ: isHovered ? "30px" : "0px" }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={product.productImage}
              alt={product.title}
              width={280}
              height={400}
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-700"
              style={{
                filter: isHovered
                  ? 'drop-shadow(0 0 40px rgba(212,175,55,0.35))'
                  : 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
              }}
            />
          </motion.div>

          {/* Corner accent */}
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[0.55rem] font-bold tracking-[0.3em] uppercase text-gold-500/30 bg-dark-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gold-500/10">
              {product.type.split('•')[0].trim()}
            </span>
          </div>
        </div>

        {/* Info area */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Title row */}
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white glow-gold">
              {product.title}
            </h3>
            <span className="text-gold-500/30 text-xs font-mono">
              {String(product.index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Type */}
          <p className="text-gold-500/40 text-[0.6rem] font-bold tracking-[0.25em] uppercase mb-4">
            {product.type}
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent mb-4" />

          {/* Description */}
          <p className="text-sm text-white/55 leading-relaxed mb-6 line-clamp-3 hover:line-clamp-none transition-all duration-500">
            {product.description}
          </p>

          {/* Notes */}
          <FragranceNotes notes={product.notes} />
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>
    </motion.div>
  );
}

export default function ProductSection({ product, index }) {
  const sectionRef = useRef(null);
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -30]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.7]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden group"
    >
      {/* Background image with parallax — cinematic & vivid */}
      <motion.div className="absolute inset-[-10%] z-0" style={{ y: bgY }}>
        <Image
          src={product.bgImage}
          alt={`${product.title} atmosphere`}
          fill
          className="object-cover scale-110 saturate-[1.15] contrast-[1.05] transition-transform duration-[2s] ease-out group-hover:scale-[1.15]"
          sizes="100vw"
          quality={90}
        />
        {/* Cinematic gradient — bright in center, dark at edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/70 via-transparent to-dark-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/60" />
        <div className="absolute inset-0 bg-gold-500/[0.03] mix-blend-overlay" />
      </motion.div>

      {/* Section number — large watermark style (hidden on small mobile) */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${isEven ? 'right-4 md:right-20' : 'left-4 md:left-20'} z-[1] hidden sm:block`}>
        <span className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-black text-white/[0.03] leading-none select-none pointer-events-none">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className={`relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        } items-center gap-8 lg:gap-16 py-20 md:py-0`}
      >
        {/* Product Card */}
        <div className="w-full md:w-5/12">
          <ProductCard product={{ ...product, index }} isEven={isEven} />
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: isEven ? 80 : -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full md:w-7/12 flex flex-col"
        >
          {/* Subtitle */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gold-500/50 text-[0.6rem] font-bold tracking-[0.35em] uppercase mb-3"
          >
            The Spirit of Kazakhstan
          </motion.span>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-2 glow-gold"
          >
            {product.title}
          </motion.h2>

          {/* Type badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap gap-2 mb-6 mt-3"
          >
            {product.type.split('•').map((t, i) => (
              <span
                key={i}
                className="text-[0.55rem] font-bold tracking-[0.2em] uppercase text-gold-500/60 bg-gold-500/[0.06] border border-gold-500/10 px-3 py-1 rounded-full"
              >
                {t.trim()}
              </span>
            ))}
          </motion.div>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="gold-divider origin-left mb-6"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-base md:text-lg text-white/65 leading-relaxed max-w-lg mb-8 italic"
          >
            «{product.description}»
          </motion.p>

          {/* Discover more prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex items-center gap-3 text-gold-500/40 hover:text-gold-500/70 transition-colors duration-300 cursor-pointer group/link"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Узнать больше</span>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
