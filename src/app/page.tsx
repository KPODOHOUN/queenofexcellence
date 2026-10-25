import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { AboutSection } from "@/components/home/AboutSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { NewsSection } from "@/components/home/NewsSection";
import { GalleryPreviewSection } from "@/components/home/GalleryPreviewSection";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { isDatabaseConfigured, query } from "@/lib/db/connection";
import { findMany } from "@/lib/db/crud";
import { findOngoingEvents } from "@/lib/db/models/events";
import { camelRows } from "@/lib/db/helpers";
import { DEFAULT_ABOUT } from "@/lib/content-fallback";
import { getSiteContent, getSiteStats } from "@/lib/data";
import { sliceHeroSlides, HERO_SLIDE_COUNT } from "@/lib/home-fallback";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type HomeRecord = Record<string, unknown>;

async function loadLimited(
  table: string,
  where: string,
  params: unknown[],
  orderBy: string,
  limit: number
): Promise<HomeRecord[]> {
  const rows = await query(
    `SELECT * FROM \`${table}\` WHERE ${where} ORDER BY ${orderBy} LIMIT ?`,
    [...params, limit]
  );
  return camelRows<HomeRecord>(rows);
}

async function loadHomePageData() {
  const empty = {
    heroSlides: [] as HomeRecord[],
    about: null as HomeRecord | null,
    events: [] as HomeRecord[],
    stats: await getSiteStats(),
    gallery: [] as HomeRecord[],
    news: [] as HomeRecord[],
    faqs: [] as HomeRecord[],
    partners: [] as HomeRecord[],
  };

  if (!isDatabaseConfigured()) return empty;

  try {
    const [heroSlides, about, events, stats, gallery, news, faqs, partners] = await Promise.all([
      loadLimited("hero_slide", "published = 1", [], "`order` ASC, created_at DESC", HERO_SLIDE_COUNT),
      getSiteContent("about"),
      findOngoingEvents(6),
      getSiteStats(),
      loadLimited("gallery_item", "published = 1", [], "`order` ASC", 6),
      loadLimited("project", "published = 1", [], "`order` ASC", 3),
      loadLimited("faq", "published = 1", [], "`order` ASC", 6),
      findMany<HomeRecord>("partner", "published = 1", [], "`order` ASC"),
    ]);

    return {
      heroSlides,
      about: about ?? null,
      events,
      stats,
      gallery,
      news,
      faqs,
      partners,
    };
  } catch (error) {
    console.error("HomePage:", error);
    return empty;
  }
}

export default async function HomePage() {
  const { heroSlides, about, events, stats, gallery, news, faqs, partners } =
    await loadHomePageData();

  const aboutRaw = (about ?? {}) as { title?: string; content?: string; image?: string };
  const aboutData = {
    title: aboutRaw.title || DEFAULT_ABOUT.title,
    content: aboutRaw.content || DEFAULT_ABOUT.content,
    image: aboutRaw.image || DEFAULT_ABOUT.image,
  };

  const dbSlides: HeroSlide[] = heroSlides.map((slide) => ({
    id: slide.id as string,
    image: slide.image as string,
    subtitle: (slide.subtitle as string) || undefined,
    title: slide.title as string,
    description: (slide.description as string) || undefined,
    ctaPrimary:
      slide.ctaPrimaryLabel && slide.ctaPrimaryHref
        ? { label: slide.ctaPrimaryLabel as string, href: slide.ctaPrimaryHref as string }
        : undefined,
    ctaSecondary:
      slide.ctaSecondaryLabel && slide.ctaSecondaryHref
        ? { label: slide.ctaSecondaryLabel as string, href: slide.ctaSecondaryHref as string }
        : undefined,
  }));

  const slides = sliceHeroSlides(dbSlides);

  return (
    <PublicLayout transparentHeader floatingHeader noHeaderOffset>
      {slides.length > 0 && <HeroSlider slides={slides} />}

      {aboutData.content && (
        <AboutSection
          title={aboutData.title}
          content={aboutData.content}
          image={aboutData.image}
        />
      )}

      {/* Événements en cours uniquement */}
      <section id="evenements" className="relative py-14 lg:py-20 bg-champagne/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 section-divider" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <SectionHeading
              eyebrow="Événements"
              title="Concours en cours"
              description="Les événements actifs ouverts au vote et à la billetterie."
              className="mb-0 text-left mx-0 max-w-xl"
              align="left"
            />
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group shrink-0"
            >
              Voir tous les événements
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
          {events.length === 0 ? (
            <EmptyState
              title="Aucun événement en cours pour le moment."
              action={{ label: "Voir tous les événements", href: "/events" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const ev = event as HomeRecord;
                return (
                  <Reveal key={ev.id as string} delay={i * 80}>
                    <EventCard event={event as Parameters<typeof EventCard>[0]["event"]} />
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Chiffres clés */}
      <section id="chiffres" className="py-14 lg:py-20 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute inset-0 section-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Chiffres clés"
            title="Notre impact en chiffres"
            description="Statistiques en temps réel de la plateforme."
            align="center"
            className="mb-10 [&_h2]:text-white [&_p]:text-white/50"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {[
              { label: "Événements", value: stats.events },
              { label: "Candidates", value: stats.candidates },
              { label: "Votes", value: stats.votes },
              { label: "Partenaires", value: stats.partners },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100} className="text-center py-6 lg:py-0">
                <p className="font-serif text-3xl lg:text-4xl gold-gradient-text mb-1.5">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-[12px] text-white/50 tracking-[0.2em] uppercase">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <GalleryPreviewSection
        items={gallery.map((item) => ({
          id: item.id as string,
          imageUrl: item.imageUrl as string,
          title: item.title as string | null,
        }))}
      />

      <NewsSection
        items={news.map((item) => ({
          id: item.id as string,
          title: item.title as string,
          description: item.description as string,
          image: item.image as string | null,
        }))}
      />

      <PartnersSection
        partners={partners.map((p) => ({
          id: p.id as string,
          name: p.name as string,
          logo: p.logo as string,
          website: (p.website as string | null) ?? null,
          description: (p.description as string | null) ?? null,
        }))}
      />

      {faqs.length > 0 && (
        <section id="faq" className="py-14 lg:py-20 bg-[whitesmoke]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions fréquentes"
              description="Tout ce qu'il faut savoir pour participer."
              align="center"
            />
            <FaqAccordion
              items={faqs.map((f) => ({
                id: f.id as string,
                question: f.question as string,
                answer: f.answer as string,
              }))}
            />
            <div className="text-center mt-8">
              <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors group">
                Voir plus
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
