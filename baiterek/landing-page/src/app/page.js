"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
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
    productImage: "/assets/perfumes/astana_box.png",
    kaspiUrl: "https://kaspi.kz/shop/p/the-spirit-of-kazakhstan-astana-parfjumernaja-voda-edp-100-ml-uniseks-141140289/?m=30353973&ms=true",
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
    productImage: "/assets/perfumes/almaty_box.png",
    kaspiUrl: "https://kaspi.kz/shop/p/the-spirit-of-kazakhstan-almaty-parfjumernaja-voda-edp-100-ml-uniseks-141211866/?m=30353973&ms=true",
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
    productImage: "/assets/perfumes/ulytau_box.png",
    kaspiUrl: "https://kaspi.kz/shop/p/the-spirit-of-kazakhstan-ulytau-parfjumernaja-voda-edp-100-ml-uniseks-141211835/?m=30353973&ms=true",
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
    productImage: "/assets/perfumes/qara_altyn_box.png",
    kaspiUrl: "https://kaspi.kz/shop/p/the-spirit-of-kazakhstan-qara-altyn-parfjumernaja-voda-edp-100-ml-uniseks-141211823/?m=30353973&ms=true",
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
        {/* Hero Photo Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/hero_bottle.jpg"
            alt="Baiterek perfume"
            fill
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/20 to-dark-900/80" />
        </div>

        {/* WebGL Particles overlay */}
        <div className="absolute inset-0 z-[1]">
          <HeroBackground />
        </div>



        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 z-[2] flex flex-col items-center gap-2"
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



      {/* ═══════════ BRAND STORY — FULL WIDTH ═══════════ */}
      <section id="about" className="relative z-10">
        {/* Scrolling photo marquee background */}
        <div className="absolute inset-0 flex items-center overflow-hidden opacity-40 pointer-events-none">
          <div className="animate-marquee-wrapper">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-12 items-center px-6">
                {[
                  "/assets/perfumes/4870236881454 Astana (1).png",
                  "/assets/perfumes/4870236881461 Almaty (1).png",
                  "/assets/perfumes/4870236881478 Ulytau (1).png",
                  "/assets/perfumes/4870236881485 qara altyn (1).png",
                  "/assets/perfumes/4870236881454 Astana (3).png",
                  "/assets/perfumes/4870236881461 Almaty (3).png",
                  "/assets/perfumes/4870236881478 Ulytau (3).png",
                  "/assets/perfumes/4870236881485 qara altyn (3).png",
                ].map((src, i) => (
                  <Image
                    key={`${setIdx}-${i}`}
                    src={src}
                    alt="Baiterek perfume"
                    width={300}
                    height={400}
                    className="object-contain h-[50vh] w-auto flex-shrink-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-transparent to-dark-900" />
        <div className="absolute inset-0 bg-dark-900/30" />
        {/* Top section — title + description */}
        <div className="relative z-10 w-full min-h-[70vh] flex items-center py-32 md:py-40 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col md:flex-row items-start md:items-center gap-12 md:gap-20"
            >
              {/* Left — heading */}
              <motion.div variants={fadeUp} custom={0} className="md:w-1/2">
                <span className="text-gold-500 text-sm font-bold tracking-[0.3em] uppercase mb-6 block">
                  The Spirit of Kazakhstan
                </span>
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                  Искусство
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                    Парфюмерии
                  </span>
                </h2>
              </motion.div>

              {/* Right — text */}
              <motion.div variants={fadeUp} custom={0.2} className="md:w-1/2">
                <div className="w-16 h-0.5 bg-gold-500 mb-8" />
                <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-6">
                  Линейка ароматов производится в Казахстане, на фабрике полного цикла в г. Астана — единственном производстве такого масштаба на территории Центральной Азии.
                </p>
                <p className="text-lg text-gold-500/80 italic">
                  Парфюмерные компоненты произведены во Франции
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Stats — full width grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative z-10 w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 border-b border-white/5"
        >
          {[
            { value: "4", label: "Аромата" },
            { value: "100%", label: "Сделано в РК" },
            { value: "FR", label: "Компоненты" },
            { value: "2025", label: "Год запуска" },
            { value: "EDP", label: "Концентрация" },
            { value: "50", label: "мл объём" },
            { value: "1", label: "Фабрика в ЦА" },
            { value: "∞", label: "Вдохновение" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i * 0.08}
              className="py-20 md:py-28 text-center border-r border-b md:border-b-0 border-white/5 last:border-r-0 hover:bg-white/[0.02] transition-colors duration-500 group"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 mb-3">
                {stat.value}
              </div>
              <div className="text-[0.65rem] md:text-xs text-white/35 uppercase tracking-[0.2em] font-medium group-hover:text-white/50 transition-colors duration-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
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

      {/* ═══════════ CTA SECTION — FULL SCREEN ═══════════ */}
      <section className="relative z-10 h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/boxes_bg.jpg"
            alt="Baiterek collection boxes"
            fill
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900/50 to-dark-900" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="text-gold-500 text-sm md:text-base font-bold tracking-[0.4em] uppercase mb-8 block"
          >
            Найдите свой аромат
          </motion.span>

          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tight leading-[1.05] mb-8"
          >
            Откройте
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              свой аромат
            </span>
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={0.2}
            className="w-20 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-8"
          />

          <motion.p
            variants={fadeUp}
            custom={0.25}
            className="text-xl md:text-2xl text-white/40 mb-14 max-w-2xl mx-auto leading-relaxed"
          >
            Каждый аромат — это путешествие. Четыре истории, вдохновлённые духом Казахстана.
          </motion.p>


        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="contacts" className="relative z-10 bg-dark-950 border-t border-gold-500/10">
        <div className="max-w-[1600px] mx-auto px-10 md:px-24">

          {/* Main content — 4 columns */}
          <div className="py-28 md:py-36 grid grid-cols-1 md:grid-cols-4 gap-20 md:gap-20">

            {/* Brand */}
            <div className="md:col-span-1">
              <h2 className="text-3xl md:text-4xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 mb-3">
                BAITEREK
              </h2>
              <p className="text-xs tracking-[0.3em] uppercase text-white/25 mb-8">
                The Spirit of Kazakhstan
              </p>
              <div className="w-12 h-0.5 bg-gold-500/30 mb-8" />
              <p className="text-sm text-white/30 leading-loose">
                Парфюмерная линейка, созданная в 2025 году.
              </p>
              <p className="text-sm text-white/30 leading-loose mt-2">
                Символ нашей страны, нашего любимого Казахстана.
              </p>
            </div>

            {/* Production */}
            <div>
              <h5 className="text-white/60 font-bold uppercase tracking-[0.25em] text-xs mb-8">
                Производство
              </h5>
              <ul className="space-y-4">
                <li className="text-white/35 text-sm leading-relaxed">ТОО «Аромат»</li>
                <li className="text-white/35 text-sm leading-relaxed">г. Астана, Казахстан</li>
                <li className="text-white/35 text-sm leading-relaxed">ул. Актекше, здание 4</li>
                <li className="text-gold-500/50 text-sm leading-relaxed pt-4 border-t border-white/5">Фабрика полного цикла</li>
                <li className="text-gold-500/50 text-sm leading-relaxed">Единственная в Центральной Азии</li>
              </ul>
            </div>

            {/* Collection */}
            <div>
              <h5 className="text-white/60 font-bold uppercase tracking-[0.25em] text-xs mb-8">
                Коллекция
              </h5>
              <ul className="space-y-4">
                <li className="text-white/35 text-sm hover:text-gold-500 transition-colors cursor-pointer leading-relaxed">Astana</li>
                <li className="text-white/35 text-sm hover:text-gold-500 transition-colors cursor-pointer leading-relaxed">Almaty</li>
                <li className="text-white/35 text-sm hover:text-gold-500 transition-colors cursor-pointer leading-relaxed">Ulytau</li>
                <li className="text-white/35 text-sm hover:text-gold-500 transition-colors cursor-pointer leading-relaxed">Qara Altyn</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="text-white/60 font-bold uppercase tracking-[0.25em] text-xs mb-8">
                Контакты
              </h5>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://thespiritofkazakhstan.kz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-500/70 hover:text-gold-400 transition-colors duration-300 text-sm"
                  >
                    thespiritofkazakhstan.kz
                  </a>
                </li>
                <li className="text-white/35 text-sm leading-relaxed pt-4 border-t border-white/5">Компоненты из Франции</li>
                <li className="text-white/35 text-sm leading-relaxed">Концентрация: EDP</li>
                <li className="text-white/35 text-sm leading-relaxed">Объём: 50 мл</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="max-w-[1600px] mx-auto px-10 md:px-24 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs tracking-[0.15em]">
              © {new Date().getFullYear()} BAITEREK. Все права защищены.
            </p>
            <button
              onClick={() => document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/25 hover:text-gold-500 transition-colors duration-300 text-xs uppercase tracking-[0.2em] flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Наверх
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
