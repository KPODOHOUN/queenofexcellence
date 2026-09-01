import { cn, getEventStatusLabel, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, ArrowUpRight } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    shortDesc: string | null;
    description: string;
    date: Date | string;
    location: string;
    status: string;
    _count?: { candidates: number };
  };
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const candidateCount = event._count?.candidates ?? 0;

  return (
    <Link href={`/events/${event.slug}`} className={cn("group card-elevated overflow-hidden block", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-champagne-dark">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-serif text-gold/15">Q</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        <span className="absolute top-4 left-4 px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase bg-white/95 backdrop-blur-sm rounded-full text-foreground shadow-sm">
          {getEventStatusLabel(event.status)}
        </span>
      </div>

      <div className="p-6 lg:p-7">
        <h3 className="font-serif text-xl lg:text-[1.35rem] text-foreground mb-2.5 group-hover:text-gold transition-colors duration-300 leading-snug">
          {event.name}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mb-5 leading-relaxed">
          {event.shortDesc || event.description}
        </p>

        <div className="flex flex-col gap-2.5 text-[13px] text-muted mb-6 pb-6 border-b border-border/80">
          <span className="flex items-center gap-2.5">
            <Calendar size={14} className="text-gold shrink-0" />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-2.5">
            <MapPin size={14} className="text-gold shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </span>
          <span className="flex items-center gap-2.5">
            <Users size={14} className="text-gold shrink-0" />
            {candidateCount} candidate{candidateCount !== 1 ? "s" : ""}
          </span>
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-medium text-gold group-hover:text-gold-dark transition-colors">
          Voir l&apos;événement
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
