"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const slides = [
  {
    id: "astana",
    name: "ASTANA",
    type: "Восточный • Древесный • Цветочный",
    description: "Этот аромат переносит вас в благоухающий сад на рассвете, где природа пробуждается, наполняя воздух свежестью и сладостью.",
    image: "/assets/perfumes/astana_box.png",
    poster: "/assets/posters/astana.jpg",
  },
  {
    id: "almaty",
    name: "ALMATY",
    type: "Фруктовый • Гурманский",
    description: "Воплощение сладкого наслаждения, словно изысканный коктейль, поданный в золотых лучах заката.",
    image: "/assets/perfumes/almaty_box.png",
    poster: "/assets/posters/almaty.jpg",
  },
  {
    id: "ulytau",
    name: "ULYTAU",
    type: "Белый Цветочный • Восточный",
    description: "Искрящийся коктейль эмоций, в котором свежесть, сладость и глубина сплетаются в завораживающий танец.",
    image: "/assets/perfumes/ulytau_box.png",
    poster: "/assets/posters/ulytau.jpg",
  },
  {
    id: "qara_altyn",
    name: "QARA ALTYN",
    type: "Восточный • Древесный",
    description: "История о тепле, загадочности и утончённой дерзости. Раскрывается пряным вихрем специй.",
    image: "/assets/perfumes/qara_altyn_box.png",
    poster: "/assets/posters/qara_altyn.jpg",
  },
];

function getClass(index, active, total) {
  if (index === active) return "active";
  if (index === (active + 1) % total) return "next";
  if (index === (active - 1 + total) % total) return "previous";
  return "inactive";
}

export default function PerfumeSlider() {
  const [active, setActive] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(timer);
  }, [total]);

  const current = slides[active];

  return (
    <section className="ps-slider-main">
      {/* Backgrounds — synced with active */}
      <div className="ps-backgrounds">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="ps-background"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <Image
              src={slide.poster}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
          </div>
        ))}
      </div>

      {/* Left: text — synced with active */}
      <div className="ps-container">
        <div className="ps-content-wrap">
          <div className="ps-content">
            <p className="ps-subtitle">The Spirit of Kazakhstan</p>
            <h2 className="ps-heading">{current.name}</h2>
            <p className="ps-text">«{current.description}»</p>
            <p className="ps-type">{current.type}</p>
          </div>
        </div>
      </div>

      {/* Right: images — synced with active via CSS classes */}
      <div className="ps-images">
        {slides.map((slide, i) => (
          <img
            key={slide.id}
            className={`ps-image ${getClass(i, active, total)}`}
            src={slide.image}
            alt={slide.name}
          />
        ))}
      </div>
    </section>
  );
}
