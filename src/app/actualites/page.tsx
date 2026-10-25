import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { findMany } from "@/lib/db/crud";
import { safeQuery } from "@/lib/safe-db";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Actualités et annonces Queen of Excellence.",
};

export default async function ActualitesPage() {
  const news = await safeQuery(
    "news.list",
    () => findMany("project", "published = 1", [], "`order` ASC"),
    []
  );

  const items = news as {
    id: string;
    title: string;
    description: string;
    image?: string | null;
  }[];

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Actualités"
        title="Nos actualités"
        description="Annonces, temps forts et nouvelles de la plateforme."
      />

      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <EmptyState title="Aucune actualité publiée pour le moment." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 80} className="group card-elevated overflow-hidden">
                  {item.image && (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="font-serif text-lg text-foreground mb-2">{item.title}</h2>
                    <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
