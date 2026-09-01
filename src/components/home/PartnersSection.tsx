"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Handshake, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
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

const PER_SLIDE = 4;

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const content = (
    <div className="group flex w-64 sm:w-72 lg:w-80 h-48 sm:h-52 lg:h-56 shrink-0 items-center justify-center rounded-2xl border border-gold/10 bg-white p-6 transition-all duration-500 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-1">
      <Image
        src={partner.logo}
        alt={partner.name}
        width={340}
        height={220}
        className="max-h-36 sm:max-h-40 lg:max-h-44 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
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
  const slides = chunk(partners, PER_SLIDE);
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

  if (partners.length === 0) {
    return (
      <section id="partenaires" className="py-16 lg:py-20 bg-[whitesmoke]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-gold/15 mb-6">
              <Handshake size={24} className="text-gold" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Partenaires</p>
              <span className="h-px w-8 bg-gold/60" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-5">
              Devenez partenaire
            </h2>
            <p className="text-muted leading-relaxed text-[15px] mb-8 max-w-xl mx-auto">
              Nous n&apos;avons pas encore de sponsor officiel pour cet événement. Votre marque
              souhaite s&apos;associer à la célébration de l&apos;excellence féminine ?
              Contactez-nous pour devenir partenaire.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group"
            >
              Nous contacter
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section id="partenaires" className="py-16 lg:py-20 bg-[whitesmoke]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Partenaires"
          title="Ils nous font confiance"
          description="Des organisations engagées à nos côtés pour célébrer l'excellence féminine."
          align="center"
        />

        <Reveal className="relative">
          <div className="relative min-h-[28rem] sm:min-h-[14rem] lg:min-h-[15rem]">
            {slides.map((group, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-wrap items-center justify-center gap-4 lg:gap-6 transition-opacity duration-700 ease-in-out",
                  i === current ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"
                )}
              >
                {group.map((partner) => (
                  <PartnerLogo key={partner.id} partner={partner} />
                ))}
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Partenaires précédents"
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gold/30 bg-white flex items-center justify-center text-gold hover:bg-gold/10 hover:border-gold/50 transition-all duration-300"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                aria-label="Partenaires suivants"
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gold/30 bg-white flex items-center justify-center text-gold hover:bg-gold/10 hover:border-gold/50 transition-all duration-300"
              >
                <ChevronRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-2 mt-8">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Aller au groupe ${i + 1}`}
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      i === current ? "w-8 bg-gold" : "w-3 bg-gold/25 hover:bg-gold/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </Reveal>
      </div>
    </section>
  );
}
