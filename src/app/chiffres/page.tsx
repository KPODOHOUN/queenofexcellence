import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { getSiteStats } from "@/lib/data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chiffres clés",
  description: "Les statistiques de Queen of Excellence.",
};

export default async function ChiffresPage() {
  const stats = await getSiteStats();

  const items = [
    { label: "Événements organisés", value: stats.events, desc: "Concours et événements premium" },
    { label: "Candidates accompagnées", value: stats.candidates, desc: "Talents mis en lumière" },
    { label: "Votes enregistrés", value: stats.votes, desc: "Soutien du public" },
    { label: "Supporters engagés", value: stats.supporters, desc: "Participants uniques" },
    { label: "Billets vendus", value: stats.ticketsSold, desc: "Spectateurs aux événements" },
  ];

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Chiffres"
        title="Nos chiffres clés"
        description="Des données calculées en temps réel depuis notre plateforme."
      />

      <section className="py-20 lg:py-28 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute inset-0 section-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {items.map((item, i) => (
              <Reveal key={item.label} delay={i * 100} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/25 transition-colors group">
                <p className="font-serif text-4xl lg:text-5xl gold-gradient-text mb-3 group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={item.value} />
                </p>
                <h3 className="text-[13px] text-white/80 font-medium mb-1.5">{item.label}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
