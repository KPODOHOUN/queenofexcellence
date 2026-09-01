"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  image: string;
  subtitle?: string;
  title: string;
  description?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || slides.length === 0) return;
      setIsTransitioning(true);
      setCurrent((index + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning, slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden bg-[#0a0a0a]">
      {/* Background slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-gold/5 to-gold/15 mix-blend-soft-light" />
        </div>
      ))}

      {/* Golden blur orbs */}
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] -right-[10%] w-[55%] h-[55%] rounded-full hero-gold-blur animate-[gold-glow_8s_ease-in-out_infinite]"
          aria-hidden
        />
        <div
          className="absolute -bottom-[25%] -left-[15%] w-[45%] h-[45%] rounded-full hero-gold-blur opacity-60 animate-[gold-glow_10s_ease-in-out_infinite_2s]"
          aria-hidden
        />
        <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-gold/10 blur-[100px]" aria-hidden />
      </div>

      {/* Frosted gold strip under header */}
      <div className="absolute top-0 left-0 right-0 h-28 z-[18] bg-gradient-to-b from-gold/10 via-gold/5 to-transparent backdrop-blur-[2px] pointer-events-none" />

      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent z-20" />

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-32 text-center">
          <div key={slide.id} className="max-w-3xl mx-auto animate-fade-in">
            {slide.subtitle && (
              <p className="inline-flex items-center justify-center gap-3 text-[11px] sm:text-xs tracking-[0.35em] uppercase text-gold mb-5 font-medium">
                <span className="w-8 h-px bg-gold/70" />
                {slide.subtitle}
                <span className="w-8 h-px bg-gold/70" />
              </p>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.08] mb-6 tracking-tight drop-shadow-lg">
              {slide.title}
            </h1>
            {slide.description && (
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
                {slide.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 justify-center">
              {slide.ctaPrimary && (
                <Link
                  href={slide.ctaPrimary.href}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40 hover:scale-[1.02]"
                >
                  {slide.ctaPrimary.label}
                </Link>
              )}
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondary.href}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white border border-gold/40 rounded-full hover:bg-gold/15 backdrop-blur-md transition-all duration-300 hover:border-gold/60"
                >
                  {slide.ctaSecondary.label}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide précédent"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-gold/25 hover:border-gold/50 transition-all duration-300"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Slide suivant"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-gold/25 hover:border-gold/50 transition-all duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots + progress */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-30">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  aria-label={`Aller au slide ${i + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i === current
                      ? "w-10 bg-gold shadow-[0_0_12px_rgba(244,208,63,0.6)]"
                      : "w-4 bg-white/30 hover:bg-gold/50"
                  )}
                />
              ))}
            </div>
            <span className="text-gold/70 text-xs tracking-widest font-light">
              {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      )}

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-[16] bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </section>
  );
}
