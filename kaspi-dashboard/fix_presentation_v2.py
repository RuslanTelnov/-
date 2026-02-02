
import os

# Define the content carefully
valid_content = """
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Play, Pause, Maximize } from "lucide-react";

const slides = [
  {
    id: 1,
    image: "/slides/slide1.png",
    title: "Полный контроль склада",
    subtitle: "Единый центр управления",
    description: "Объедините все ваши склады — Китай, основной сток, транзит — в одной интуитивной панели. Система обрабатывает миллионные обороты в реальном времени, исключая человеческий фактор. Забудьте про разрозненные таблицы Excel — теперь вы видите каждый товар, каждое перемещение и каждый тиын вашего капитала.",
    accent: "text-red-500",
  },
  {
    id: 2,
    image: "/slides/slide2.png",
    title: "Точный расчет прибыли",
    subtitle: "Финансовая прозрачность",
    description: "Больше никаких скрытых убытков. Velveto Analytics автоматически рассчитывает чистую маржу по каждой единице товара, учитывая логистику, комиссии и себестоимость. Вы получаете детализированную финансовую отчетность мгновенно, что позволяет масштабировать только прибыльные позиции и отсекать балласт.",
    accent: "text-green-500",
  },
  {
    id: 3,
    image: "/slides/slide3.png",
    title: "AI Бизнес-аналитик",
    subtitle: "Бизнес на автопилоте",
    description: "Ваш личный стратегический консультант, доступный 24/7. Наш RAG-модуль анализирует ваши данные и отвечает на сложные вопросы: 'Где заморожены деньги?', 'Что нужно срочно закупить?', 'Какой товар станет хитом?'. Получайте готовые решения за секунды, а не часы ручного анализа.",
    accent: "text-blue-500",
  },
  {
    id: 4,
    image: "/slides/slide4.png",
    title: "Динамика Роста",
    subtitle: "Масштабирование бизнеса",
    description: "Отслеживайте ключевые метрики роста в динамике. Визуализируйте тренды продаж, сезонность и эффективность маркетинга. Наша система не просто показывает прошлое, она помогает прогнозировать будущее, обеспечивая уверенный рост и стабильность вашего бизнеса при любых объемах.",
    accent: "text-purple-500",
  },
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval; 
    if (isPlaying) {
      interval = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center p-8 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Velveto Analytics
        </div>
        <div className="flex items-center gap-6">
            <button 
                onClick={toggleFullScreen}
                className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Full Screen"
            >
                <Maximize size={24} />
            </button>
            <div className="text-lg font-light opacity-70 tracking-widest uppercase">
            Investor Pitch 2026
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse" />

        <div className="w-full px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 h-full max-w-[1800px] mx-auto">
          
          {/* Text Content */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700 key={currentSlide} className="flex flex-col justify-center">
             <div className={`inline-block px-4 py-2 rounded-full border border-white/10 text-base font-mono uppercase tracking-widest ${slide.accent} w-max`}>
               0{slide.id} / 0{len(slides)}
             </div>
             
             <h1 className="text-7xl md:text-9xl font-bold leading-none tracking-tight">
               {slide.title}
             </h1>
             
             <h2 className="text-4xl md:text-5xl text-gray-400 font-light tracking-wide">
               {slide.subtitle}
             </h2>
             
             <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed border-l-8 border-white/20 pl-10 max-w-3xl">
               {slide.description}
             </p>

             <div className="pt-4">
                <button className="bg-white text-black px-12 py-6 rounded-full font-bold text-2xl hover:scale-105 transition-transform flex items-center gap-4 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                Get Started <ArrowRight size={32} />
                </button>
             </div>
          </div>

          {/* Image Content */}
          <div className="relative group perspective-1000 h-[50vh] lg:h-[75vh] flex items-center justify-center">
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-3xl transition-all duration-700 transform rotate-y-6 group-hover:rotate-0 bg-black/50 backdrop-blur-sm">
               <img 
                 src={slide.image} 
                 alt={slide.title}
                 className="w-full h-full object-contain p-4"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                 <span className="text-xl font-mono text-white/80 tracking-widest">INTERACTIVE DEMO PREVIEW</span>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* Controls */}
      <footer className="fixed bottom-0 w-full p-10 flex justify-between items-center bg-gradient-to-t from-black via-black/90 to-transparent z-50">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 rounded-full hover:bg-white/10 transition-colors border border-white/5"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          <div className="flex items-center gap-3 text-xl font-mono text-gray-500">
             <span className="text-white">0{currentSlide + 1}</span>
             <span className="opacity-30">/</span>
             <span>0{len(slides)}</span>
          </div>
        </div>

        <div className="flex gap-6">
          <button 
            onClick={prevSlide}
            className="p-5 rounded-full border border-white/10 hover:bg-white text-white hover:text-black transition-all hover:scale-110"
          >
            <ArrowLeft size={28} />
          </button>
          <button 
            onClick={nextSlide}
            className="p-5 rounded-full border border-white/10 hover:bg-white text-white hover:text-black transition-all hover:scale-110"
          >
            <ArrowRight size={28} />
          </button>
        </div>
      </footer>
    </div>
  );
}
""".strip()

# NOTE: I used len(slides) in python string but this is for TSX file. 
# I need to fix `len(slides)` to `slides.length` inside the string before writing, 
# because I am writing python code that contains JS code.
# Actually, in the f-string/string above:
# `0{len(slides)}` -> this is python f-string syntax if I used f-string. But I used triple quotes.
# Wait, `0{slides.length}` is valid JS.
# I see `0{len(slides)}` in the python string above. That is WRONG for the JS file result.
# I must correct it to `0{slides.length}`.

valid_content = valid_content.replace("{len(slides)}", "{slides.length}")

target_file = "/home/wik/antigravity/scratch/moysklad-automation/kaspi-dashboard/app/presentation/page.tsx"
with open(target_file, "w", encoding="utf-8") as f:
    f.write(valid_content)

print(f"Successfully wrote clean content to {target_file}")
