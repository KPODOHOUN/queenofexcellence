import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur Queen of Excellence.",
};

export default async function FAQPage() {
  const faqs = await prisma.fAQ.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicLayout>
      <section className="py-20 lg:py-24 bg-champagne">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">FAQ</p>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-tight tracking-tight">
              Questions fréquentes
            </h1>
          </Reveal>
        </div>
      </section>

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
