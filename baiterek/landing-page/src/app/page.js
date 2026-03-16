"use client";

import Image from "next/image";
import HeroBackground from "@/components/HeroBackground";
import TiltCard from "@/components/TiltCard";
import { motion } from "framer-motion";

export default function Home() {
  const products = [
    {
      id: "astana",
      title: "ASTANA",
      subtitle: "The Spirit of Kazakhstan",
      description: "Этот аромат переносит вас в благоухающий сад на рассвете, где природа пробуждается, наполняя воздух свежестью и сладостью. Воплощение утренней свежести и природной красоты, идеально подходящий для тех, кто ценит изящество и естественность.",
      notes: "ВЕРХНИЕ НОТЫ: личи, грейпфрут, красная смородина | СРЕДНИЕ НОТЫ: роза, древесный, персик/абрикос | БАЗОВЫЕ НОТЫ: ветивер, ваниль, гурманский",
      type: "ВОСТОЧНЫЙ • ДРЕВЕСНЫЙ • ЦВЕТОЧНЫЙ",
      bgImage: "/assets/generated/bg_astana.png",
      productImage: "/assets/perfumes/4870236881454 Astana (1).png"
    },
    {
      id: "almaty",
      title: "ALMATY",
      subtitle: "The Spirit of Kazakhstan",
      description: "Этот аромат — воплощение сладкого наслаждения, словно изысканный коктейль, поданный в золотых лучах заката. Сладкое искушение, в котором сочетаются игривость, элегантность и манящая тайна.",
      notes: "ВЕРХНИЕ НОТЫ: яблоко, черная смородина, нектарин, шампанское | СРЕДНИЕ НОТЫ: жасмин, карамель, маршмеллоу | БАЗОВЫЕ НОТЫ: пачули, сандал, ветивер, ваниль, амбра, мускус",
      type: "ФРУКТОВЫЙ • ГУРМАНСКИЙ",
      bgImage: "/assets/generated/bg_almaty.png",
      productImage: "/assets/perfumes/4870236881461 Almaty (1).png"
    },
    {
      id: "ulytau",
      title: "ULYTAU",
      subtitle: "The Spirit of Kazakhstan",
      description: "Искрящийся коктейль эмоций, в котором свежесть, сладость и глубина сплетаются в завораживающий танец. Аромат, который невозможно забыть — он пленяет, обволакивает и заставляет сердца биться чаще.",
      notes: "ВЕРХНИЕ НОТЫ: мандарин, имбирь, шафран, черная смородина | СРЕДНИЕ НОТЫ: герань, гелиотроп, цветы апельсина, малина | БАЗОВЫЕ НОТЫ: пачули, ваниль, кожистые ноты, амбра",
      type: "БЕЛЫЙ ЦВЕТОЧНЫЙ • ВОСТОЧНЫЙ",
      bgImage: "/assets/generated/bg_ulytau.png",
      productImage: "/assets/perfumes/4870236881478 Ulytau (1).png"
    },
    {
      id: "qara-altyn",
      title: "QARA ALTYN",
      subtitle: "The Spirit of Kazakhstan",
      description: "История о тепле, загадочности и утончённой дерзости. Раскрывается пряным вихрем специй, пробуждая чувства и интригуя с первых мгновений. Как загадка, которую хочется разгадывать снова и снова.",
      notes: "ВЕРХНИЕ НОТЫ: специи, миндаль | СРЕДНИЕ НОТЫ: гваяковое дерево, дым | БАЗОВЫЕ НОТЫ: ваниль, дуб",
      type: "ВОСТОЧНЫЙ • ДРЕВЕСНЫЙ",
      bgImage: "/assets/generated/bg_qara_altyn.png",
      productImage: "/assets/perfumes/4870236881485 qara altyn (1).png"
    }
  ];

  return (
    <main className="relative min-h-screen bg-dark-900 overflow-hidden">
      {/* 
        The background will be fixed and contain the stunning generated video / animated element. 
        It will smoothly parallax as the user scrolls.
      */}
      <div className="fixed inset-0 z-0">
        <HeroBackground />
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-10 w-full">
        {/* Full Screen Hero Section */}
        <section className="relative h-[95vh] w-full flex flex-col items-center justify-center p-8">
          {/* 3D Model Canvas overlaying the Hero */}


          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-[-10vh] z-20 pointer-events-none"
          >
            <h1 className="text-6xl md:text-[8rem] font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gold-500 to-gold-600 glow-text drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              BAITEREK
            </h1>
            <motion.p
              initial={{ opacity: 0, letterSpacing: "1em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              className="text-xl md:text-3xl font-light uppercase text-white/90"
            >
              The Essence of Greatness
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 animate-bounce text-white/50"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </section>

        {/* Collection Introduction */}
        <section className="bg-dark-900 border-t border-white/10 relative z-20 py-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-7xl mx-auto px-8 text-center"
          >
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-gold-500 mb-4">THE SPIRIT OF KAZAKHSTAN</h2>
            <h3 className="text-4xl md:text-5xl text-white font-medium mb-8">Искусство Парфюмерии</h3>
            <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg leading-relaxed">
              Линейка ароматов производится в Казахстане, на фабрике полного цикла в г. Астана.
              Это единственное производство такого масштаба на территории Центральной Азии.
              <br /><br />
              <span className="text-gold-500 font-semibold italic">Парфюмерные компоненты произведены во Франции.</span>
            </p>
          </motion.div>
        </section>

        {/* Full-Screen Product Sections */}
        <div className="flex flex-col">
          {products.map((product, index) => {
            const isEven = index % 2 === 0;
            return (
              <section key={product.id} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden border-t border-white/10">

                {/* Immersive Bright Full-Screen Background */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={product.bgImage}
                    alt={`${product.title} background`}
                    fill
                    className="object-cover opacity-100 transition-transform duration-1000 hover:scale-105 contrast-125 saturate-110 brightness-110"
                  />
                  {/* Softer overlay to keep the background bright but text readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/30 to-dark-900/80" />
                  <div className="absolute inset-0 bg-dark-900/10" />
                </div>

                <div className={`relative z-10 max-w-7xl mx-auto w-full px-8 flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 lg:gap-24 py-24 min-h-[70vh]`}>

                  {/* 3D Product Card Side */}
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className="w-full max-w-sm h-[500px] md:h-[600px]">
                      <TiltCard
                        title={product.title}
                        description="3D ИНТЕРАКТИВНЫЙ"
                        bgImage={product.bgImage}
                        productImage={product.productImage}
                        modelSrc={product.modelSrc}
                        isBaiterek={product.isBaiterek}
                      />
                    </div>
                  </div>

                  {/* Textual Description Side */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full md:w-1/2 flex flex-col justify-center text-left"
                  >
                    <h4 className="text-gold-500 font-bold tracking-[0.2em] mb-2 uppercase text-sm drop-shadow-md">
                      {product.subtitle}
                    </h4>
                    <h2 className="text-6xl md:text-8xl font-black mb-6 text-white glow-text drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                      {product.title}
                    </h2>
                    <p className="text-gold-400/80 font-bold tracking-[0.1em] text-xs mb-4 uppercase">
                      {product.type}
                    </p>
                    <p className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-lg mb-8 outline-none border-l-4 border-gold-500 pl-6 backdrop-blur-md bg-dark-900/40 shadow-xl py-4 rounded-r-xl">
                      {product.description}
                    </p>

                    <div className="glass-dark p-6 rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] w-fit backdrop-blur-xl">
                      <p className="text-sm md:text-base text-gold-500 font-medium tracking-widest leading-loose uppercase drop-shadow-lg flex flex-col gap-2">
                        {product.notes.split(' | ').map((note, i) => (
                          <span key={i}>{note}</span>
                        ))}
                      </p>
                    </div>
                  </motion.div>

                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="bg-black py-16 border-t border-white/5 relative z-20">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-white/50 text-sm">
            <div>
              <h5 className="text-white font-bold mb-4 uppercase tracking-widest">Производитель</h5>
              <p>ТОО «Аромат»</p>
              <p>Республика Казахстан, г. Астана</p>
              <p>р-он Алматы, ул. Актекше здание 4</p>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-gold-500 mb-2 tracking-tighter">BAITEREK</h2>
              <p className="uppercase tracking-[0.3em]">The Spirit of Kazakhstan</p>
              <p className="mt-4">Launched in 2025</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <h5 className="text-white font-bold mb-4 uppercase tracking-widest">Digital</h5>
              <a href="https://thespiritofkazakhstan.kz" className="hover:text-gold-500 transition-colors">thespiritofkazakhstan.kz</a>
              <p className="mt-4">© 2025 All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
