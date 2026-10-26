import Link from "next/link";
import Image from "next/image";
import { VoteButton } from "@/components/payments/VoteButton";
import { cn } from "@/lib/utils";
import { displayVoteCount } from "@/lib/votes-display";

export interface CandidateCardData {
  id: string;
  name: string;
  slug: string;
  number: number;
  photo: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  voteCount: number;
  categoryName?: string | null;
  categoryId?: string | null;
  event: { slug: string; name: string; id?: string; votePrice?: number };
}

interface CandidateCardProps {
  candidate: CandidateCardData;
  /** « spotlight » : carte de l'accueil. « list » : carte de la page candidates. */
  variant?: "spotlight" | "list";
  className?: string;
}

function CandidateVote({ candidate, className }: { candidate: CandidateCardData; className: string }) {
  const { event } = candidate;
  if (event.id && event.votePrice) {
    return (
      <VoteButton
        className={className}
        candidate={{ id: candidate.id, name: candidate.name, number: candidate.number, photo: candidate.photo }}
        event={{ id: event.id, name: event.name, votePrice: event.votePrice }}
      />
    );
  }
  return (
    <Link href={`/vote?event=${event.slug}&candidate=${candidate.slug}`} className={cn(className, "no-underline")}>
      Voter
    </Link>
  );
}

export function CandidateCard({ candidate, variant = "list", className }: CandidateCardProps) {
  const profileHref = `/candidats/${candidate.event.slug}/${candidate.slug}`;
  const votes = displayVoteCount(candidate.voteCount).toLocaleString("fr-FR");
  const subtitle = [candidate.city, candidate.categoryName].filter(Boolean).join(" • ");

  return (
    <article className={cn("group card-elevated overflow-hidden flex flex-col", className)}>
      <Link
        href={profileHref}
        className={cn(
          "relative block w-full bg-onyx overflow-hidden no-underline",
          variant === "spotlight" ? "aspect-[4/5]" : "aspect-[4/3]"
        )}
      >
        {candidate.photo ? (
          <Image
            src={candidate.photo}
            alt={candidate.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/15">
            {candidate.number}
          </span>
        )}
        <span className="absolute top-3 left-3 bg-white text-foreground text-xs font-semibold px-2 py-1 rounded">
          N° {candidate.number}
        </span>
      </Link>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-base font-semibold text-foreground leading-snug">{candidate.name}</h3>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          {variant === "list" && candidate.bio && (
            <p className="mt-2 text-sm text-muted line-clamp-2">{candidate.bio}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground tabular-nums">{votes}</span> votes
          </p>
          <div className="flex items-center gap-2">
            <Link href={profileHref} className="btn-soft !min-h-9 !px-3 !text-[13px] no-underline">
              Profil
            </Link>
            <CandidateVote candidate={candidate} className="btn-gold !min-h-9 !px-4 !text-[13px]" />
          </div>
        </div>
      </div>
    </article>
  );
}
