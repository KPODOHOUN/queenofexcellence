import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CandidateCardProps {
  candidate: {
    id: string;
    name: string;
    slug: string;
    number: number;
    photo: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    voteCount: number;
    event: { slug: string; name: string };
  };
  className?: string;
}

export function CandidateCard({ candidate, className }: CandidateCardProps) {
  return (
    <article className={cn("group relative card-elevated gold-ring overflow-hidden", className)}>
      <Link
        href={`/candidats/${candidate.event.slug}/${candidate.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Voir le profil de ${candidate.name}`}
      />
      <div className="relative aspect-[3/4] overflow-hidden bg-champagne-dark pointer-events-none">
        {candidate.photo ? (
          <Image
            src={candidate.photo}
            alt={candidate.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-champagne">
            <span className="text-7xl font-serif text-gold/15">{candidate.number}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 w-11 h-11 rounded-full gold-gradient flex items-center justify-center text-white font-serif text-lg shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {candidate.number}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/60 text-[11px] tracking-wider uppercase mb-1 truncate">
            {candidate.event.name}
          </p>
          <h3 className="font-serif text-xl text-white leading-tight">{candidate.name}</h3>
        </div>
      </div>

      <div className="relative z-10 p-5 lg:p-6 pointer-events-none">
        {(candidate.city || candidate.country) && (
          <p className="text-xs text-muted mb-3 tracking-wide">
            {[candidate.city, candidate.country].filter(Boolean).join(" · ")}
          </p>
        )}
        {candidate.bio && (
          <p className="text-sm text-muted line-clamp-2 mb-5 leading-relaxed">{candidate.bio}</p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/80">
          <div>
            <p className="font-serif text-2xl text-gold leading-none">{candidate.voteCount}</p>
            <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">votes</p>
          </div>
          <Link
            href={`/vote?event=${candidate.event.slug}&candidate=${candidate.slug}`}
            className="group/vote relative z-20 pointer-events-auto inline-flex items-center gap-1 px-4 py-2 text-xs font-medium text-white gold-gradient rounded-full transition-all duration-300 hover:opacity-90 hover:shadow-md hover:shadow-gold/30"
          >
            Voter
            <ArrowUpRight size={12} className="group-hover/vote:translate-x-0.5 group-hover/vote:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
