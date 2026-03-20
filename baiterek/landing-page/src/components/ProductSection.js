"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ProductSection({ product, index }) {
  const sectionRef = useRef(null);
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center overflow-hidden group"
    >
      {/* Background image with parallax */}
      <motion.div className="absolute inset-[-10%] z-0" style={{ y: bgY }}>
        <Image
          src={product.bgImage}
          alt={`${product.title} atmosphere`}
          fill
          className="object-cover saturate-[1.1] transition-transform duration-[2s] ease-out group-hover:scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-dark-900/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/30 via-transparent to-dark-900/50" />
      </motion.div>

      {/* Content */}
      <div
        className={`relative z-10 w-full flex flex-col ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        } items-center gap-6 md:gap-0 py-16 md:py-0`}
      >
        {/* Product Image — HUGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full md:w-1/2 flex ${isEven ? "justify-start" : "justify-end"}`}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 md:w-96 md:h-96 bg-gold-500/10 rounded-full blur-[100px] group-hover:bg-gold-500/20 transition-all duration-1000" />
            </div>

            <Image
              src={product.productImage}
              alt={product.title}
              width={800}
              height={1000}
              className={`object-contain relative z-10 drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)] group-hover:drop-shadow-[0_30px_80px_rgba(212,175,55,0.25)] transition-all duration-700 max-h-[85vh] `}
            />
          </motion.div>


        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: isEven ? 60 : -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full md:w-1/2 flex flex-col px-12 ${isEven ? "md:pl-[15%] md:pr-8" : "md:pr-[15%] md:pl-8"}`}
        >
          {/* Number */}
          <span className="text-gold-500/20 text-5xl md:text-6xl font-black leading-none mb-2">
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Title */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-4 [text-shadow:_0_4px_25px_rgba(0,0,0,0.7)]">
            {product.title}
          </h2>

          {/* Type */}
          <div className="flex flex-wrap gap-2 mb-7">
            {product.type.split('•').map((t, i) => (
              <span
                key={i}
                className="text-sm font-semibold tracking-[0.15em] uppercase text-gold-400 bg-dark-900/50 backdrop-blur-sm border border-gold-500/20 px-5 py-2 rounded-full"
              >
                {t.trim()}
              </span>
            ))}
          </div>

          {/* Gold line */}
          <div className="w-20 h-0.5 bg-gradient-to-r from-gold-500 to-transparent mb-7" />

          {/* Description */}
          <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-9 font-light [text-shadow:_0_2px_10px_rgba(0,0,0,0.5)]">
            {product.description}
          </p>

          {/* Notes */}
          <div className="space-y-4">
            {[
              { key: "top", label: "ВЕРХНИЕ НОТЫ", icon: "✦" },
              { key: "mid", label: "СРЕДНИЕ НОТЫ", icon: "◆" },
              { key: "base", label: "БАЗОВЫЕ НОТЫ", icon: "●" },
            ].map((note) => (
              product.notes[note.key] && (
                <div
                  key={note.key}
                  className="flex items-start gap-4 bg-dark-900/40 backdrop-blur-sm rounded-xl p-4 border border-gold-500/10"
                >
                  <span className="text-gold-500/50 text-sm mt-1">{note.icon}</span>
                  <div>
                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-gold-500/60">
                      {note.label}
                    </span>
                    <p className="text-base md:text-lg text-white/70 mt-1">
                      {product.notes[note.key]}
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Buy on Kaspi */}
          {product.kaspiUrl && (
            <motion.a
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              href={product.kaspiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-16 inline-flex items-center gap-4 px-14 py-4 border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-dark-900 font-bold text-sm uppercase tracking-[0.2em] rounded-full transition-all duration-500 group/buy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Купить на Kaspi
              <svg className="w-4 h-4 transition-transform duration-300 group-hover/buy:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          )}
        </motion.div>
      </div>
    </section>
  );
}
