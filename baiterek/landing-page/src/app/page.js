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
    bgImage: "/assets/generated/bg_astana_day.jpg",
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
            className="object-cover opacity-90"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/20 via-transparent to-dark-900/40" />
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



      {/* ═══════════ BRAND STORY + CREATORS ═══════════ */}
      <section id="about" className="relative z-10 bg-dark-900 overflow-hidden">
        {/* Background — 4 posters side by side */}
        <div className="absolute inset-0 flex opacity-50">
          {[
            "/assets/posters/astana.jpg",
            "/assets/posters/almaty.jpg",
            "/assets/posters/ulytau.jpg",
            "/assets/posters/qara_altyn.jpg",
          ].map((src, i) => (
            <div key={i} className="relative w-1/4 h-full">
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/40 via-dark-900/50 to-dark-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/50 via-transparent to-dark-900/50" />
        </div>

        {/* Floating gold diamonds + dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`dot-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-gold-500/20 animate-float-particle"
              style={{
                left: `${8 + Math.floor(i * 9.1) % 84}%`,
                top: `${5 + Math.floor(i * 11.3) % 85}%`,
                animationDelay: `${(i * 1.2) % 10}s`,
                animationDuration: `${8 + (i % 4)}s`,
              }}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`diamond-${i}`}
              className="absolute w-2 h-2 rotate-45 border border-gold-500/15 animate-float-particle"
              style={{
                left: `${12 + Math.floor(i * 15.7) % 76}%`,
                top: `${10 + Math.floor(i * 13.9) % 75}%`,
                animationDelay: `${(i * 1.8) % 10}s`,
                animationDuration: `${10 + (i % 3)}s`,
              }}
            />
          ))}
        </div>
        {/* Text */}
        <div className="relative z-10 w-full flex items-center justify-center py-40 md:py-52 border-b border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-4xl mx-auto px-8 md:px-16 text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-base md:text-lg text-white/40 leading-relaxed mb-4"
            >
              Первая Казахстанская парфюмерная фабрика
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={0.08}
              className="text-lg md:text-xl text-white/60 leading-relaxed mb-6"
            >
              ТОО «АРОМАТ» представляет премиальные ароматы бренда
            </motion.p>

            <motion.h2
              variants={fadeUp}
              custom={0.15}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 tracking-[0.15em] mb-10"
            >
              THE SPIRIT OF KAZAKHSTAN
            </motion.h2>

            <motion.div
              variants={fadeUp}
              custom={0.25}
              className="w-20 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-10"
            />

            <motion.p
              variants={fadeUp}
              custom={0.3}
              className="text-lg md:text-xl text-white/50 leading-relaxed mb-6 max-w-2xl mx-auto"
            >
              Новая парфюмерная линейка, созданная в 2025 году, представляет собой ароматы, которые символизируют нашу страну, наш любимый Казахстан.
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={0.4}
              className="text-base md:text-lg text-gold-500/70 italic"
            >
              Произведено в Казахстане, г. Астана
            </motion.p>
          </motion.div>
        </div>

        {/* Creators */}
        <div className="relative z-10 w-full py-40 md:py-56 border-b border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-6xl mx-auto px-8 md:px-16"
          >
            <motion.h3
              variants={fadeUp}
              custom={0}
              className="text-center text-2xl md:text-3xl font-light text-white mb-4"
            >
              Создатели{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 font-bold">
                ароматов
              </span>
            </motion.h3>

            <motion.div
              variants={fadeUp}
              custom={0.1}
              className="w-12 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-16"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24">
              {[
                {
                  photo: "/assets/creators/quentin.jpg",
                  name: "Квентин Биш",
                  nameEn: "Quentin Bisch",
                  role: "Создатель ASTANA",
                  company: "Givaudan",
                  desc: "Автор Fleur Narcotique Ex Nihilo, Angel Muse Mugler, Mandarina Corsica L'Artisan Parfumeur.",
                  brands: "Zara, Gucci, Amouage, Kenzo, YSL, Chloé, Mugler, Penhaligon's, Carolina Herrera, Jean Paul Gaultier",
                  count: "145",
                },
                {
                  photo: "/assets/creators/ayse.jpg",
                  name: "Айше Сиркеджиоглу",
                  nameEn: "Ayşe Sirkecioğlu",
                  role: "Создатель ALMATY",
                  company: "EPS Fragrances",
                  desc: "Работала с Superz., Soleil de Grâce, Max Volmer. Автор Patchouli Dream для Soleil de Grâce.",
                  brands: "Superz., Soleil de Grâce, Max Volmer",
                  count: "6",
                },
                {
                  photo: "/assets/creators/gael.jpg",
                  name: "Гаэль Монтеро",
                  nameEn: "Gaël Montero",
                  role: "Создатель ULYTAU и QARA ALTYN",
                  company: "Givaudan",
                  desc: "Работал с Zara, Attar Collection, Ex Nihilo, Memo, The Merchant of Venice, Genyum, Maison Crivelli.",
                  brands: "Zara, Gucci, Amouage, Kenzo, YSL, Chloé, Van Cleef & Arpels, Rabanne, Loewe, Parfums de Marly",
                  count: "145",
                },
              ].map((creator, i) => (
                <motion.div
                  key={creator.nameEn}
                  variants={fadeUp}
                  custom={i * 0.15 + 0.15}
                  className="text-center group hover:-translate-y-4 transition-transform duration-500"
                >
                  {/* Photo */}
                  <div className="w-40 h-40 mx-auto mb-8 rounded-full overflow-hidden border-2 border-gold-500/15 group-hover:border-gold-500/50 transition-all duration-700 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.25)]">
                    <Image
                      src={creator.photo}
                      alt={creator.nameEn}
                      width={400}
                      height={400}
                      className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>

                  {/* Name */}
                  <h4 className="text-xl font-bold text-white mb-1">{creator.name}</h4>
                  <p className="text-gold-500 text-sm font-medium mb-2">{creator.nameEn}</p>

                  {/* Role badge */}
                  <p className="text-gold-500/80 text-xs tracking-[0.15em] uppercase mb-2 font-semibold">{creator.role}</p>
                  <p className="text-white/30 text-xs mb-6">{creator.company} · {creator.count} ароматов</p>

                  {/* Divider */}
                  <div className="w-10 h-px bg-gold-500/20 mx-auto mb-6" />

                  {/* Description */}
                  <p className="text-sm text-white/45 leading-relaxed mb-5 max-w-xs mx-auto">
                    {creator.desc}
                  </p>

                  {/* Brands */}
                  <p className="text-xs text-white/25 leading-relaxed max-w-xs mx-auto">
                    {creator.brands}
                  </p>
                </motion.div>
              ))}
            </div>
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
