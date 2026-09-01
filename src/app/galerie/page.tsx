import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Moments d'excellence capturés lors de nos événements.",
};

export default async function GaleriePage() {
  const items = await prisma.galleryItem.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { event: { select: { name: true } } },
  });

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <PublicLayout>
      <section className="py-20 lg:py-24 bg-champagne">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Galerie</p>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-tight tracking-tight">
              Moments d&apos;excellence
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="py-4 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {items.length === 0 ? (
            <EmptyState title="Aucune photo disponible pour le moment." />
          ) : (
            <>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-12">
                  {categories.map((cat) => (
                    <span key={cat} className="px-4 py-1.5 text-xs bg-champagne rounded-full text-muted transition-colors hover:bg-gold-light/40">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, i) => (
                  <Reveal key={item.id} delay={(i % 6) * 80} className="group relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Galerie"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(item.title || item.event) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        {item.title && <p className="text-white text-sm font-medium">{item.title}</p>}
                        {item.event && <p className="text-white/70 text-xs">{item.event.name}</p>}
                      </div>
                    )}
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
