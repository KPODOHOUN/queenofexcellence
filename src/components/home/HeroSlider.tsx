"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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

const SLIDE_DURATION = 6000;

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || slides.length === 0) return;
      setIsTransitioning(true);
      setCurrent((index + slides.length) % slides.length);
      setProgressKey((k) => k + 1);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning, slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  return (
    <section className="relative h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden bg-[#0a0a0a]">
      {/* Background slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn(
              "object-cover",
              i === current && "animate-ken-burns"
            )}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-gold/25 via-transparent to-gold/10 mix-blend-soft-light" />
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
        <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-gold/20 blur-3xl animate-float" aria-hidden />
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-gold/10 blur-[100px]" aria-hidden />
      </div>

      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent z-20" />

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-32 text-center">
          <div key={slide.id} className="max-w-3xl mx-auto">
            {slide.subtitle && (
              <p className="inline-flex items-center justify-center gap-3 text-[11px] sm:text-xs tracking-[0.35em] uppercase text-gold mb-5 font-medium animate-fade-in-up stagger-1">
                <span className="w-8 h-px bg-gold/70" />
                {slide.subtitle}
                <span className="w-8 h-px bg-gold/70" />
              </p>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.08] mb-6 tracking-tight drop-shadow-lg animate-fade-in-blur stagger-2">
              {slide.title}
            </h1>
            {slide.description && (
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto font-light animate-fade-in-up stagger-3">
                {slide.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up stagger-4">
              {slide.ctaPrimary && (
                <Link
                  href={slide.ctaPrimary.href}
                  className="btn-shimmer inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40 hover:scale-[1.03] active:scale-[0.98]"
                >
                  {slide.ctaPrimary.label}
                </Link>
              )}
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondary.href}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white border border-gold/40 rounded-full hover:bg-gold/15 backdrop-blur-md transition-all duration-300 hover:border-gold/60 hover:scale-[1.02] active:scale-[0.98]"
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
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-gold/25 hover:border-gold/50 hover:scale-110 transition-all duration-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Slide suivant"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-gold/25 hover:border-gold/50 hover:scale-110 transition-all duration-300 active:scale-95"
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
                    "relative h-1 rounded-full overflow-hidden transition-all duration-500",
                    i === current ? "w-10 bg-white/20" : "w-4 bg-white/30 hover:bg-gold/50"
                  )}
                >
                  {i === current && (
                    <span
                      key={progressKey}
                      className="absolute inset-0 origin-left bg-gold rounded-full shadow-[0_0_12px_rgba(244,208,63,0.6)]"
                      style={{ animation: `slide-progress ${SLIDE_DURATION}ms linear forwards` }}
                    />
                  )}
                </button>
              ))}
            </div>
            <span className="text-gold/70 text-xs tracking-widest font-light">
              {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        aria-label="Défiler vers le contenu"
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/50 hover:text-gold transition-colors duration-300 animate-bounce-soft"
      >
        <span className="text-[10px] tracking-[0.25em] uppercase">Découvrir</span>
        <ChevronDown size={20} />
      </button>

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[16] bg-gradient-to-t from-[#0c0c0c] via-black/40 to-transparent pointer-events-none" />
    </section>
  );
}
