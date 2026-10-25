"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  slug?: string;
};

interface NewsSectionProps {
  items: NewsItem[];
}

export function NewsSection({ items }: NewsSectionProps) {
  return (
    <section id="actualites" className="py-14 lg:py-20 bg-champagne/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <SectionHeading
            eyebrow="Actualités"
            title="Dernières nouvelles"
            description="Annonces, temps forts et infos sur nos événements."
            className="mb-0 text-left sm:text-left mx-0 max-w-xl"
            align="left"
          />
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group shrink-0"
          >
            Voir plus
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Aucune actualité publiée pour le moment."
            description="Les contenus sont ajoutés depuis le tableau de bord admin."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={i * 80}>
                <article className="group card-elevated gold-ring overflow-hidden h-full flex flex-col">
                  <div className="relative aspect-[16/10] bg-champagne-dark overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gold/30">
                        <Newspaper size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed line-clamp-3 flex-1">{item.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
