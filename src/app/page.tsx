import Link from "next/link";
import Image from "next/image";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { PartnersSection } from "@/components/home/PartnersSection";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { getSiteContent, getSiteStats } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [heroSlides, about, events, stats, impacts, gallery, faqs, partners] = await Promise.all([
    prisma.heroSlide.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 4,
    }),
    getSiteContent("about"),
    prisma.event.findMany({
      where: { published: true, archived: false },
      orderBy: { date: "asc" },
      take: 6,
      include: { _count: { select: { candidates: true } } },
    }),
    getSiteStats(),
    prisma.impact.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 4,
    }),
    prisma.galleryItem.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 6,
    }),
    prisma.fAQ.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 4,
    }),
    prisma.partner.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const aboutData = about as {
    title?: string;
    content?: string;
  } | null;

  const slides: HeroSlide[] = heroSlides.map((slide) => ({
    id: slide.id,
    image: slide.image,
    subtitle: slide.subtitle || undefined,
    title: slide.title,
    description: slide.description || undefined,
    ctaPrimary:
      slide.ctaPrimaryLabel && slide.ctaPrimaryHref
        ? { label: slide.ctaPrimaryLabel, href: slide.ctaPrimaryHref }
        : undefined,
    ctaSecondary:
      slide.ctaSecondaryLabel && slide.ctaSecondaryHref
        ? { label: slide.ctaSecondaryLabel, href: slide.ctaSecondaryHref }
        : undefined,
  }));

  if (slides.length === 0 && gallery.length > 0) {
    slides.push({
      id: "fallback",
      image: gallery[0].imageUrl,
      subtitle: "Queen of Excellence",
      title: "Célébrez l'Excellence",
      description: "La plateforme événementielle qui met en lumière les femmes d'exception.",
      ctaPrimary: { label: "Voter maintenant", href: "/vote" },
      ctaSecondary: { label: "Découvrir", href: "/events" },
    });
  }

  return (
    <PublicLayout transparentHeader noHeaderOffset>
      <HeroSlider slides={slides} />

      {/* À propos */}
      {aboutData?.content && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="h-px w-8 bg-gold/60" />
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Le concours</p>
                <span className="h-px w-8 bg-gold/60" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-6">
                {aboutData.title || "À propos de Queen of Excellence"}
              </h2>
              <p className="text-muted leading-relaxed text-[15px] sm:text-base mb-8">
                {aboutData.content}
              </p>
              <Link
                href="/a-propos"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group"
              >
                En savoir plus
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <PartnersSection partners={partners} />

      {/* Events */}
      <section id="evenements" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-gold/60" />
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Événements</p>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-foreground leading-tight tracking-tight max-w-lg">
                Concours en cours
              </h2>
            </div>
            {events.length > 0 && (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group shrink-0"
              >
                Voir tous les événements
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </Reveal>
          {events.length === 0 ? (
            <EmptyState title="Aucun événement disponible pour le moment." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {events.map((event, i) => (
                <Reveal key={event.id} delay={i * 100}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 lg:py-28 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-white/10 lg:divide-y-0 lg:divide-x">
            {[
              { label: "Événements", value: stats.events },
              { label: "Candidates", value: stats.candidates },
              { label: "Votes", value: stats.votes },
              { label: "Supporters", value: stats.supporters },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100} className="text-center py-6 lg:py-0 lg:px-8">
                <p className="font-serif text-4xl lg:text-6xl gold-gradient-text mb-2">
                  {stat.value.toLocaleString("fr-FR")}
                </p>
                <p className="text-[13px] text-white/50 tracking-[0.2em] uppercase">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      {impacts.length > 0 && (
        <section className="py-24 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <Reveal className="lg:col-span-4">
                <div className="lg:sticky lg:top-32">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-px w-8 bg-gold/60" />
                    <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">Impact</p>
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-5">
                    Notre impact
                  </h2>
                  <p className="text-muted leading-relaxed text-[15px] mb-8">
                    Des actions concrètes pour accompagner et inspirer les femmes d&apos;exception.
                  </p>
                  <Link href="/impact" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group">
                    En savoir plus
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Reveal>
              <div className="lg:col-span-8">
                {impacts.map((item, i) => (
                  <Reveal key={item.id} delay={i * 80}>
                    <div className="group flex items-baseline gap-6 lg:gap-10 py-7 border-t border-border first:border-t-0 lg:first:border-t transition-transform duration-300 hover:translate-x-1">
                      <span className="font-serif text-sm text-gold/50 shrink-0 w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.value && (
                        <span className="font-serif text-3xl lg:text-4xl text-gold shrink-0 w-24 lg:w-28">
                          {item.value}
                        </span>
                      )}
                      <div>
                        <h3 className="font-serif text-lg text-foreground mb-1.5 group-hover:text-gold-dark transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-24 lg:py-32 bg-champagne-dark/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Galerie"
              title="Moments d'excellence"
              description="Revivez les instants les plus marquants de nos événements."
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
              {gallery.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={(i % 3) * 100}
                  className={cn(
                    "relative overflow-hidden rounded-2xl group",
                    i === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto md:min-h-[400px]" : "aspect-square"
                  )}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Galerie"}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-white text-sm font-medium">{item.title}</p>
                    </div>
                  )}
                </Reveal>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link href="/galerie" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group">
                Voir la galerie complète
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-24 lg:py-32 bg-[whitesmoke]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions fréquentes"
              description="Tout ce que vous devez savoir pour participer."
            />
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Reveal key={faq.id} delay={i * 60}>
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
            <div className="text-center mt-14">
              <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group">
                Toutes les questions
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA — transition vers le footer */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#080808]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(244,208,63,0.12),transparent)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-5">Contact</p>
          <h2 className="font-serif text-4xl lg:text-5xl text-white mb-5 leading-tight">
            Restons en contact
          </h2>
          <p className="text-white/55 mb-10 text-[15px] leading-relaxed max-w-md mx-auto">
            Une question ? Un projet ? Notre équipe est à votre écoute.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/20 hover:shadow-gold/35"
          >
            Nous contacter
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
