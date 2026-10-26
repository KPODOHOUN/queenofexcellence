"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CandidateCard, type CandidateCardData } from "@/components/candidates/CandidateCard";
import { cn } from "@/lib/utils";

type BrowserCandidate = CandidateCardData & { categoryId: string | null };

interface CandidatesBrowserProps {
  candidates: BrowserCandidate[];
  categories: { id: string; name: string }[];
}

type SortMode = "number" | "votes";

export function CandidatesBrowser({ candidates, categories }: CandidatesBrowserProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("number");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return candidates
      .filter((c) => category === "all" || c.categoryId === category)
      .filter((c) => {
        if (!q) return true;
        const num = String(c.number);
        return c.name.toLowerCase().includes(q) || num === q.replace(/^0+/, "") || num.padStart(2, "0").includes(q);
      })
      .sort((a, b) => (sort === "votes" ? b.voteCount - a.voteCount || a.number - b.number : a.number - b.number));
  }, [candidates, search, category, sort]);

  const reset = () => {
    setSearch("");
    setCategory("all");
    setSort("number");
  };

  return (
    <>
      <div className="flex flex-col gap-3 mb-8">
        <div className="relative flex items-center w-full bg-champagne rounded-lg px-4 py-2.5 shadow-sm lg:max-w-xl">
          <Search size={20} className="text-gold-dark mr-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou numéro"
            className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted/60 focus:outline-none"
            type="text"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="text-muted hover:text-foreground p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-5 px-5 lg:mx-0 lg:px-0">
            {[{ id: "all", name: `Toutes (${candidates.length})` }, ...categories].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  category === cat.id
                    ? "bg-onyx text-white shadow-sm"
                    : "bg-champagne-dark text-muted hover:bg-[#e8e8e8]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted">
            {visible.length} candidate{visible.length > 1 ? "s" : ""} en lice
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Trier :</span>
            <button
              type="button"
              onClick={() => setSort((s) => (s === "number" ? "votes" : "number"))}
              className="text-sm font-medium text-gold-dark bg-champagne px-3 py-1 rounded hover:bg-champagne-dark transition-colors"
            >
              {sort === "number" ? "Par numéro" : "Par votes"}
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-champagne rounded-lg">
          <p className="text-lg font-semibold text-foreground mb-1">Aucune candidate trouvée</p>
          <p className="text-[13px] text-muted max-w-xs">Modifiez votre recherche ou réinitialisez les filtres.</p>
          <button type="button" onClick={reset} className="btn-dark !min-h-10 !text-xs mt-4">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </>
  );
}
