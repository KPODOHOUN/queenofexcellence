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
    <section id="galerie" className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <SectionHeading
            eyebrow="Galerie"
            title="Moments d'excellence"
            description="Photos et temps forts de nos événements."
            className="mb-0 text-left sm:text-left mx-0 max-w-xl"
            align="left"
          />
          <Link
            href="/galerie"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group shrink-0"
          >
            Voir plus
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState title="La galerie sera bientôt disponible." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
            {items.slice(0, 6).map((item, i) => (
              <Reveal
                key={item.id}
                delay={(i % 3) * 80}
                className={cn(
                  "relative overflow-hidden rounded-2xl group",
                  i === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto md:min-h-[280px]" : "aspect-square"
                )}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Galerie"}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-sm font-medium">{item.title}</p>
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
