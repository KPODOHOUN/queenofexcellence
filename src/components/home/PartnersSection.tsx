"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type Partner = {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  description: string | null;
};

interface PartnersSectionProps {
  partners: Partner[];
}

const AUTOPLAY_MS = 4500;

function useVisibleCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCount(3);
      else if (w >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const content = (
    <div className="group mx-2 sm:mx-3 flex h-36 sm:h-40 lg:h-44 items-center justify-center border border-border bg-white p-6 transition-colors duration-300 hover:border-foreground">
      <img
        src={partner.logo}
        alt={partner.name}
        className="max-h-24 sm:max-h-28 lg:max-h-32 w-auto max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );

  if (partner.website) {
    return (
      <Link href={partner.website} target="_blank" rel="noopener noreferrer" title={partner.name}>
        {content}
      </Link>
    );
  }

  return <div title={partner.name}>{content}</div>;
}

export function PartnersSection({ partners }: PartnersSectionProps) {
  const visibleCount = useVisibleCount();
  const maxIndex = Math.max(0, partners.length - visibleCount);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      if (partners.length === 0) return;
      setIndex(((next % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1));
    },
    [maxIndex, partners.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (partners.length <= visibleCount || paused) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next, partners.length, visibleCount, paused]);

  if (partners.length === 0) {
    return (
      <section id="partenaires" className="relative py-20 lg:py-28 bg-background overflow-hidden">
        <div className="absolute inset-0 section-pattern opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Partenaires"
            title="Ils nous font confiance"
            description="Des organisations engagées à nos côtés pour célébrer l'excellence féminine."
            align="center"
          />
          <EmptyState
            title="Aucun partenaire publié pour le moment."
            description="Ajoutez les logos depuis Admin → Partenaires (case « Publié » cochée)."
          />
        </div>
      </section>
    );
  }

  const showControls = partners.length > visibleCount;
  const slidePercent = 100 / visibleCount;

  return (
    <section id="partenaires" className="relative py-20 lg:py-28 bg-background overflow-hidden">
      <div className="absolute inset-0 section-pattern opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Partenaires"
          title="Ils nous font confiance"
          description="Des organisations engagées à nos côtés pour célébrer l'excellence féminine."
          align="center"
        />

        <Reveal className="relative">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
          <div className="relative px-10 sm:px-12">
            {showControls && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Partenaires précédents"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 border border-border bg-white flex items-center justify-center text-foreground hover:border-foreground transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Partenaires suivants"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 border border-border bg-white flex items-center justify-center text-foreground hover:border-foreground transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${index * slidePercent}%)` }}
              >
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="shrink-0"
                    style={{ width: `${slidePercent}%` }}
                  >
                    <PartnerLogo partner={partner} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-[3px] w-8 transition-colors",
                    i === index ? "bg-foreground" : "bg-border hover:bg-muted"
                  )}
                />
              ))}
            </div>
          )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
