import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { query } from "@/lib/db/connection";
import { camelKeys } from "@/lib/db/helpers";
import { safeQuery } from "@/lib/safe-db";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Galerie",
  description: "Moments d'excellence capturés lors de nos événements.",
};

async function findPublishedGalleryItems() {
  const rows = await query(
    `SELECT g.*, e.name AS event_name
     FROM \`gallery_item\` g
     LEFT JOIN \`event\` e ON e.id = g.event_id
     WHERE g.published = 1
     ORDER BY g.\`order\` ASC`
  );

  return rows.map((row) => {
    const item = camelKeys(row)! as Record<string, unknown>;
    const { eventName, ...rest } = item;
    return {
      ...rest,
      event: eventName ? { name: eventName as string } : null,
    };
  });
}

export default async function GaleriePage() {
  const items = await safeQuery("gallery.list", () => findPublishedGalleryItems(), []);

  const categories = [
    ...new Set(
      items
        .map((i) => (i as Record<string, unknown>).category as string | null | undefined)
        .filter(Boolean)
    ),
  ] as string[];

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Galerie"
        title="Moments d'excellence"
        description="Revivez les instants les plus marquants de nos événements."
      />

      <section className="py-4 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {items.length === 0 ? (
            <EmptyState title="Aucune photo disponible pour le moment." />
          ) : (
            <>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-12">
                  {categories.map((cat) => (
                    <span key={cat as string} className="px-4 py-1.5 text-xs bg-champagne rounded-full text-muted transition-colors hover:bg-gold-light/40">
                      {cat as string}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, i) => {
                  const g = item as {
                    id: string;
                    imageUrl: string;
                    title?: string | null;
                    event?: { name: string } | null;
                  };
                  return (
                  <Reveal key={g.id} delay={(i % 6) * 80} className="group relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src={g.imageUrl}
                      alt={g.title || "Galerie"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(g.title || g.event) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        {g.title && <p className="text-white text-sm font-medium">{g.title}</p>}
                        {g.event && <p className="text-white/70 text-xs">{g.event.name}</p>}
                      </div>
                    )}
                  </Reveal>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
