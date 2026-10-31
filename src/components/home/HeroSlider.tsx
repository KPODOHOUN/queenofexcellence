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

/** Slider d'accueil : l'image, légèrement floutée mais reconnaissable, sert de fond. */
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
            <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className="object-cover object-top scale-105 blur-[6px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-onyx/75 via-onyx/45 to-onyx/25" />
        </div>
      ))}

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24 flex items-center min-h-[420px] lg:min-h-[520px]">
        <div key={slide.id} className="max-w-2xl flex flex-col items-start gap-4 animate-fade-in drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
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
