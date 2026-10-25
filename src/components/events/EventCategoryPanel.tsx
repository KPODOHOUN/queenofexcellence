"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Heart } from "lucide-react";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatCurrency } from "@/lib/utils";
import { displayVoteCount } from "@/lib/votes-display";

type Candidate = Parameters<typeof CandidateCard>[0]["candidate"] & {
  rank?: number;
  voteCount?: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  candidates: Candidate[];
};

interface EventCategoryPanelProps {
  categories: Category[];
  uncategorizedCandidates?: Candidate[];
  eventSlug: string;
  votePrice: number;
  votingAllowed: boolean;
}

function RankingRow({ candidate, rank }: { candidate: Candidate; rank: number }) {
  const medal =
    rank === 1 ? "text-gold" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-700/80" : "text-muted";

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-white hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 transition-all duration-300">
      <span className={cn("font-serif text-2xl w-10 text-center shrink-0", medal)}>
        {rank <= 3 ? <Trophy size={22} className="mx-auto" /> : rank}
      </span>
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-champagne shrink-0">
        {candidate.photo ? (
          <Image src={candidate.photo} alt={candidate.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gold font-serif">{candidate.number}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{candidate.name}</p>
        <p className="text-xs text-muted">N°{candidate.number}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gold flex items-center gap-1 justify-end">
          <Heart size={14} />
          {displayVoteCount(candidate.voteCount).toLocaleString("fr-FR")}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted">votes</p>
      </div>
    </div>
  );
}

export function EventCategoryPanel({
  categories,
  uncategorizedCandidates = [],
  eventSlug,
  votePrice,
  votingAllowed,
}: EventCategoryPanelProps) {
  const tabs = [
    ...categories.map((c) => ({ id: c.id, label: c.name, candidates: c.candidates })),
    ...(uncategorizedCandidates.length > 0
      ? [{ id: "other", label: "Autres", candidates: uncategorizedCandidates }]
      : []),
  ];

  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const ranked = [...(active?.candidates ?? [])].sort(
    (a, b) => displayVoteCount(b.voteCount) - displayVoteCount(a.voteCount)
  );

  if (tabs.length === 0) {
    return <EmptyState title="Aucune candidate disponible pour cet événement." />;
  }

  return (
    <div>
      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium rounded-full border transition-all duration-300",
                activeId === tab.id
                  ? "gold-gradient text-foreground border-transparent shadow-md shadow-gold/20"
                  : "border-border text-muted hover:border-gold/40 hover:text-foreground bg-white"
              )}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">({tab.candidates.length})</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="font-serif text-xl mb-4">Classement — {active?.label}</h3>
          <div className="space-y-3">
            {ranked.map((candidate, index) => (
              <RankingRow key={candidate.id} candidate={candidate} rank={index + 1} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl mb-4">Candidates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ranked.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
          {votingAllowed && (
            <div className="mt-8 p-6 rounded-2xl border border-gold/20 bg-champagne/50 text-center">
              <p className="text-sm text-muted mb-2">Prix du vote</p>
              <p className="font-serif text-2xl text-gold mb-4">{formatCurrency(votePrice)}</p>
              <Link
                href={`/vote?event=${eventSlug}&category=${active?.id}`}
                className="inline-flex px-6 py-3 text-sm font-semibold text-foreground gold-gradient rounded-full hover:opacity-90 transition-opacity"
              >
                Voter dans cette catégorie
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
