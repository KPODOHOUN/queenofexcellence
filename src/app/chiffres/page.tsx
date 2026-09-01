import { PublicLayout } from "@/components/layout/PublicLayout";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteStats } from "@/lib/data";
import type { Metadata } from "next";

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
      <section className="py-20 lg:py-28 bg-champagne">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Chiffres</p>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight max-w-2xl">
              Nos chiffres clés
            </h1>
            <p className="mt-6 text-muted leading-relaxed max-w-lg text-lg">
              Des données calculées en temps réel depuis notre plateforme.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
            {items.map((item, i) => (
              <Reveal key={item.label} delay={i * 100} className="text-center py-8 sm:py-0 sm:px-6">
                <p className="font-serif text-4xl lg:text-5xl gold-gradient-text mb-3">
                  {item.value.toLocaleString("fr-FR")}
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
