import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { fallbackFaqs } from "@/lib/content-fallback";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur Queen of Excellence.",
};

export default async function FAQPage() {
  const dbFaqs = await safeQuery(
    "faq.list",
    () =>
      prisma.fAQ.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
      }),
    []
  );

  const faqs = dbFaqs.length > 0 ? dbFaqs : fallbackFaqs;

  return (
    <PublicLayout>
      <PageHero
        eyebrow="FAQ"
        title="Questions fréquentes"
        description="Tout ce que vous devez savoir pour participer, voter ou devenir partenaire."
      />

      <section className="py-4 lg:py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {faqs.length === 0 ? (
            <EmptyState title="Aucune question disponible pour le moment." />
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Reveal key={faq.id} delay={Math.min(i, 8) * 50}>
                  <details className="group card-elevated overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="px-6 py-5 cursor-pointer font-medium text-foreground hover:text-gold transition-colors list-none flex justify-between items-center gap-4">
                      <span className="text-[15px] leading-snug">{faq.question}</span>
                      <span className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-gold group-open:rotate-45 transition-transform duration-300 text-lg leading-none">
                        +
                      </span>
                    </summary>
                    <div className="px-6 pb-5 text-sm text-muted leading-relaxed border-t border-border/60 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
