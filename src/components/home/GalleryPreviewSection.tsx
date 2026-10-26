"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  imageUrl: string;
  title?: string | null;
};

interface GalleryPreviewSectionProps {
  items: GalleryItem[];
}

export function GalleryPreviewSection({ items }: GalleryPreviewSectionProps) {
  return (
    <section id="galerie" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <SectionHeading
            eyebrow="Galerie"
            title="Moments d'excellence"
            description="Les photos de nos événements."
            className="mb-0 text-left sm:text-left mx-0 max-w-xl"
            align="left"
          />
          <Link href="/galerie" className="link-lux shrink-0 no-underline group">
            Toute la galerie
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState title="La galerie sera bientôt disponible." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[220px] gap-3 lg:gap-4">
            {items.slice(0, 6).map((item, i) => (
              <Reveal
                key={item.id}
                delay={(i % 3) * 80}
                className={cn(
                  "relative overflow-hidden group bg-champagne-dark",
                  i === 0 && "col-span-2 row-span-2",
                  i === 3 && "md:col-span-2"
                )}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Galerie"}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-[1.06] transition-transform duration-[1200ms] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-onyx/80 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-sm">{item.title}</p>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
