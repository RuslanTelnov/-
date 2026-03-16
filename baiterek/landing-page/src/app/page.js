"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import ProductSection from "@/components/ProductSection";

const HeroBackground = dynamic(() => import("@/components/HeroBackground"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full" style={{ background: "#080808" }} />
  ),
});

const products = [
  {
    id: "astana",
    title: "ASTANA",
    type: "ВОСТОЧНЫЙ • ДРЕВЕСНЫЙ • ЦВЕТОЧНЫЙ",
    description:
      "Этот аромат переносит вас в благоухающий сад на рассвете, где природа пробуждается, наполняя воздух свежестью и сладостью. Воплощение утренней свежести и природной красоты, идеально подходящий для тех, кто ценит изящество и естественность.",
    notes: {
      top: "Личи, грейпфрут, красная смородина",
      mid: "Роза, древесные ноты, персик",
      base: "Ветивер, ваниль",
    },
    bgImage: "/assets/generated/bg_astana.png",
    productImage: "/assets/perfumes/4870236881454 Astana (1).png",
  },
  {
    id: "almaty",
    title: "ALMATY",
    type: "ФРУКТОВЫЙ • ГУРМАНСКИЙ",
    description:
      "Воплощение сладкого наслаждения, словно изысканный коктейль, поданный в золотых лучах заката. Сладкое искушение, в котором сочетаются игривость, элегантность и манящая тайна.",
    notes: {
      top: "Яблоко, чёрная смородина, нектарин, шампанское",
      mid: "Жасмин, карамель, маршмеллоу",
      base: "Пачули, сандал, ваниль, амбра, мускус",
    },
    bgImage: "/assets/generated/bg_almaty.png",
    productImage: "/assets/perfumes/4870236881461 Almaty (1).png",
  },
  {
    id: "ulytau",
    title: "ULYTAU",
    type: "БЕЛЫЙ ЦВЕТОЧНЫЙ • ВОСТОЧНЫЙ",
    description:
      "Искрящийся коктейль эмоций, в котором свежесть, сладость и глубина сплетаются в завораживающий танец. Аромат, который невозможно забыть — он пленяет, обволакивает и заставляет сердца биться чаще.",
    notes: {
      top: "Мандарин, имбирь, шафран, чёрная смородина",
      mid: "Герань, гелиотроп, цветы апельсина, малина",
      base: "Пачули, ваниль, кожа, амбра",
    },
    bgImage: "/assets/generated/bg_ulytau.png",
    productImage: "/assets/perfumes/4870236881478 Ulytau (1).png",
  },
  {
    id: "qara-altyn",
    title: "QARA ALTYN",
    type: "ВОСТОЧНЫЙ • ДРЕВЕСНЫЙ",
    description:
      "История о тепле, загадочности и утончённой дерзости. Раскрывается пряным вихрем специй, пробуждая чувства и интригуя с первых мгновений. Как загадка, которую хочется разгадывать снова и снова.",
    notes: {
      top: "Специи, миндаль",
      mid: "Гваяковое дерево, дым",
      base: "Ваниль, дуб",
    },
    bgImage: "/assets/generated/bg_qara_altyn.png",
    productImage: "/assets/perfumes/4870236881485 qara altyn (1).png",
  },
];

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Home() {
  return (
    <main className="relative bg-dark-900">
      {/* ═══════════ HERO ═══════════ */}
      <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* WebGL Background */}
        <div className="absolute inset-0 z-0">
          <HeroBackground />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="inline-block text-gold-500/50 text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-[0.4em] uppercase mb-4"
            >
              Парфюмерная коллекция
            </motion.span>

            <motion.h1
              initial={{ letterSpacing: "0.5em", opacity: 0 }}
              animate={{ letterSpacing: "0.15em", opacity: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 glow-gold select-none"
            >
              BAITEREK
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
            className="mt-4 md:mt-6 text-sm sm:text-base md:text-lg tracking-[0.4em] uppercase text-white/60 font-light"
          >
            The Spirit of Kazakhstan
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"
          />

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8, ease: "easeOut" }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto"
          >
            <a href="#collection" onClick={(e) => { e.preventDefault(); document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn-gold">
              Открыть коллекцию
            </a>
            <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn-gold-outline">
              О бренде
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/30">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-gold-500/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ═══════════ BRAND STORY ═══════════ */}
      <section id="about" className="relative z-10 py-28 md:py-36 bg-dark-900">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-block text-gold-500/70 text-[0.65rem] font-bold tracking-[0.35em] uppercase mb-4"
            >
              The Spirit of Kazakhstan
            </motion.span>

            <motion.h2
              variants={fadeUp}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4"
            >
              Искусство Парфюмерии
            </motion.h2>

            <motion.div
              variants={fadeUp}
              custom={0.2}
              className="gold-divider mx-auto my-8"
            />

            <motion.p
              variants={fadeUp}
              custom={0.3}
              className="text-white/55 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
            >
              Линейка ароматов производится в Казахстане, на фабрике полного
              цикла в г. Астана — единственном производстве такого масштаба на
              территории Центральной Азии.
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={0.45}
              className="mt-6 text-gold-500/80 text-sm md:text-base italic tracking-wide"
            >
              Парфюмерные компоненты произведены во Франции
            </motion.p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { value: "4", label: "Уникальных аромата" },
              { value: "100%", label: "Произведено в РК" },
              { value: "FR", label: "Французские компоненты" },
              { value: "2025", label: "Год основания" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i * 0.1 + 0.2}
                className="glass-gold rounded-xl p-5 text-center"
              >
                <div className="text-2xl md:text-3xl font-black text-gold-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-[0.7rem] text-white/40 uppercase tracking-widest">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PRODUCT SHOWCASE ═══════════ */}
      <div id="collection">
        {products.map((product, index) => (
          <div key={product.id}>
            {index > 0 && (
              <div className="relative z-10 flex items-center justify-center py-4 bg-dark-900">
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
                <div className="mx-3 w-2 h-2 rotate-45 border border-gold-500/40" />
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              </div>
            )}
            <ProductSection product={product} index={index} />
          </div>
        ))}
      </div>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="relative z-10 py-28 md:py-36 bg-dark-900 overflow-hidden">
        {/* Gold divider top */}
        <div className="flex items-center justify-center mb-16">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
          <div className="mx-3 w-2 h-2 rotate-45 border border-gold-500/40" />
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        </div>

        {/* CSS gold particles */}
        <div className="absolute inset-0 cta-particles" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative z-10 text-center max-w-2xl mx-auto px-6"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4"
          >
            Откройте свой аромат
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={0.15}
            className="text-white/50 text-base md:text-lg mb-10"
          >
            Каждый аромат — это путешествие
          </motion.p>
          <motion.a
            variants={fadeUp}
            custom={0.3}
            href="https://thespiritofkazakhstan.kz"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-block"
          >
            Перейти в магазин
          </motion.a>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="contacts" className="relative z-10 bg-dark-950 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm">
            {/* Manufacturer */}
            <div>
              <h5 className="text-white/80 font-semibold uppercase tracking-[0.2em] text-xs mb-4">
                Производитель
              </h5>
              <p className="text-white/35 leading-relaxed">
                ТОО «Аромат»
                <br />
                Республика Казахстан, г. Астана
                <br />
                р-н Алматы, ул. Актекше, здание 4
              </p>
            </div>

            {/* Brand center */}
            <div className="text-center flex flex-col items-center">
              <h2 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                BAITEREK
              </h2>
              <span className="text-[0.6rem] tracking-[0.3em] uppercase text-white/25 mt-1">
                The Spirit of Kazakhstan
              </span>
              <div className="gold-divider mt-4 mb-3" />
              <span className="text-white/20 text-xs">Est. 2025</span>
            </div>

            {/* Links */}
            <div className="text-right md:text-right flex flex-col items-end">
              <h5 className="text-white/80 font-semibold uppercase tracking-[0.2em] text-xs mb-4">
                Контакты
              </h5>
              <a
                href="https://thespiritofkazakhstan.kz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/35 hover:text-gold-500 transition-colors duration-300"
              >
                thespiritofkazakhstan.kz
              </a>
              <p className="text-white/25 text-xs mt-4 tracking-wider">
                Следите за нами
              </p>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-white/15 text-xs tracking-wider">
              © {new Date().getFullYear()} BAITEREK. Все права защищены.
            </p>
            <button
              onClick={() => document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/25 hover:text-gold-500 transition-colors duration-300 text-xs uppercase tracking-[0.15em] flex items-center gap-2"
            >
              Наверх
              <span className="inline-block w-px h-4 bg-gradient-to-t from-transparent to-gold-500/50" />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
