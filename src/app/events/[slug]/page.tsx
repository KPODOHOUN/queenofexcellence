import { PublicLayout } from "@/components/layout/PublicLayout";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { getEventBlockReason } from "@/lib/events";
import { formatDate, getEventStatusLabel } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, MapPin, Clock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return { title: "Événement introuvable" };
  return {
    title: event.name,
    description: event.shortDesc || event.description,
    openGraph: { images: event.image ? [event.image] : [] },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug, published: true },
    include: {
      candidates: {
        where: { published: true, status: "APPROVED" },
        orderBy: { number: "asc" },
        include: { event: { select: { slug: true, name: true } } },
      },
      gallery: { where: { published: true }, orderBy: { order: "asc" } },
      _count: { select: { candidates: true } },
    },
  });

  if (!event) notFound();

  const blockReason = getEventBlockReason(event);
  const votingAllowed = !blockReason;

  return (
    <PublicLayout>
      {/* Banner */}
      <section className="relative h-[50vh] min-h-[400px]">
        {event.banner || event.image ? (
          <Image
            src={event.banner || event.image!}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-champagne" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/90 rounded-full text-foreground mb-4">
              {getEventStatusLabel(event.status)}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4">{event.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Calendar size={16} /> {formatDate(event.date)}
              </span>
              {event.time && (
                <span className="flex items-center gap-2">
                  <Clock size={16} /> {event.time}
                </span>
              )}
              <span className="flex items-center gap-2">
                <MapPin size={16} /> {event.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <Reveal>
                <h2 className="font-serif text-2xl mb-4">Présentation</h2>
                <p className="text-muted leading-relaxed whitespace-pre-line">
                  {event.presentation || event.description}
                </p>
              </Reveal>

              {event.rules && (
                <Reveal>
                  <h2 className="font-serif text-2xl mb-4">Règlement</h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">{event.rules}</p>
                </Reveal>
              )}

              {/* Candidates */}
              <Reveal>
                <h2 className="font-serif text-2xl mb-6">
                  Candidates ({event.candidates.length})
                </h2>
                {event.candidates.length === 0 ? (
                  <EmptyState title="Aucune candidate disponible pour cet événement." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {event.candidates.map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                )}
              </Reveal>

              {/* Gallery */}
              {event.gallery.length > 0 && (
                <Reveal>
                  <h2 className="font-serif text-2xl mb-6">Galerie</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery.map((item) => (
                      <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.title || ""}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal delay={150} className="space-y-6">
              {blockReason && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
                  <p className="font-medium mb-1">Votes et billetterie suspendus</p>
                  <p>{blockReason}</p>
                </div>
              )}
              <div className="p-6 border border-border rounded-2xl sticky top-24 transition-shadow duration-300 hover:shadow-lg hover:shadow-gold/10">
                <p className="text-sm text-muted mb-2">Prix du vote</p>
                <p className="font-serif text-3xl text-gold mb-6">
                  {event.votePrice.toLocaleString("fr-FR")} FCFA
                </p>
                {votingAllowed ? (
                  <>
                    <Link
                      href={`/vote?event=${event.slug}`}
                      className="block w-full text-center px-6 py-3 text-sm font-medium text-white gold-gradient rounded-full hover:opacity-90 transition-opacity"
                    >
                      Voter maintenant
                    </Link>
                    <Link
                      href={`/billetterie?event=${event.slug}`}
                      className="block w-full text-center mt-3 px-6 py-3 text-sm font-medium text-foreground border border-border rounded-full hover:bg-champagne transition-colors"
                    >
                      Acheter un billet
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-muted text-center py-3">
                    Les votes et achats sont temporairement indisponibles.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
