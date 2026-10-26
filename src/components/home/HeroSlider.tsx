"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  image: string | null;
  subtitle?: string;
  title: string;
  description?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

const SLIDE_DURATION = 6000;

/** Slider d'accueil : image floutée en fond, image nette à droite sur grand écran. */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const count = slides.length;

  const goTo = useCallback((i: number) => setCurrent(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => setCurrent((c) => (c + 1) % count), SLIDE_DURATION);
    return () => window.clearInterval(timer);
  }, [count, current]);

  if (count === 0) return null;
  const slide = slides[current];

  return (
    <section className="relative overflow-hidden bg-onyx text-white">
      {/* Fonds flous */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn("absolute inset-0 transition-opacity duration-1000", i === current ? "opacity-100" : "opacity-0")}
          aria-hidden
        >
          {s.image && (
            <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className="object-cover scale-110 blur-2xl" />
          )}
          <div className="absolute inset-0 bg-onyx/70" />
        </div>
      ))}

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-12 lg:py-20 grid gap-8 lg:grid-cols-2 lg:items-center lg:min-h-[460px]">
        <div key={slide.id} className="flex flex-col items-start gap-4 animate-fade-in">
          {slide.subtitle && <span className="eyebrow !text-gold">{slide.subtitle}</span>}
          <h1 className="text-[32px] leading-tight lg:text-5xl font-bold">
            {slide.title}
          </h1>
          {slide.description && <p className="text-[15px] leading-6 text-white/80 max-w-lg">{slide.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href={slide.ctaPrimary?.href || "/vote"} className="btn-gold no-underline">
              {slide.ctaPrimary?.label || "Voter"}
            </Link>
            <Link href={slide.ctaSecondary?.href || "/candidats"} className="btn-ghost-gold no-underline">
              {slide.ctaSecondary?.label || "Les candidates"}
            </Link>
          </div>
        </div>

        {slide.image && (
          <div key={`img-${slide.id}`} className="hidden lg:block relative h-[380px] rounded-lg overflow-hidden shadow-2xl animate-fade-in">
            <Image src={slide.image} alt={slide.title} fill sizes="50vw" className="object-cover object-top" />
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn("h-1 rounded-full transition-all", i === current ? "w-8 bg-gold" : "w-4 bg-white/40")}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => goTo(current - 1)} aria-label="Précédent" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => goTo(current + 1)} aria-label="Suivant" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
