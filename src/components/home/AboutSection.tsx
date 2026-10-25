"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { DEFAULT_ABOUT_IMAGE } from "@/lib/content-fallback";
import { Reveal } from "@/components/ui/Reveal";

interface AboutSectionProps {
  title?: string;
  content?: string;
  image?: string;
}

export function AboutSection({ title, content, image }: AboutSectionProps) {
  if (!content) return null;

  const displayImage = image || DEFAULT_ABOUT_IMAGE;

  return (
    <section id="a-propos" className="relative py-14 lg:py-20 bg-white overflow-hidden">
      <div className="absolute inset-0 section-pattern opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <Reveal>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-champagne-dark shadow-lg shadow-gold/10">
              <Image
                src={displayImage}
                alt={title || "À propos"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={displayImage.startsWith("/uploads/")}
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">À propos</p>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight tracking-tight mb-4">
              {title || "Queen of Excellence"}
            </h2>
            <p className="text-muted leading-relaxed text-sm mb-6">{content}</p>
            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group"
            >
              En savoir plus
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
