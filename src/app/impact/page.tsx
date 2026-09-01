import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impact",
  description: "L'impact de Queen of Excellence sur les communautés.",
};

export default async function ImpactPage() {
  const impacts = await prisma.impact.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-champagne">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Impact</p>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight max-w-2xl">
              Notre impact
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="py-4 lg:py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {impacts.length === 0 ? (
            <EmptyState title="Aucune information d'impact disponible pour le moment." />
          ) : (
            impacts.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 6) * 70}>
                <div className="group flex items-baseline gap-6 lg:gap-10 py-8 border-t border-border first:border-t-0 transition-transform duration-300 hover:translate-x-1">
                  <span className="font-serif text-sm text-gold/50 shrink-0 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.value && (
                    <span className="font-serif text-3xl lg:text-5xl text-gold shrink-0 w-24 lg:w-32">
                      {item.value}
                    </span>
                  )}
                  <div>
                    <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-gold-dark transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
