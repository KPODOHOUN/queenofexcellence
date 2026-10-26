import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/components/ui/PageHero";
import VoteForm from "./VoteForm";

export default function VotePage() {
  return (
    <PublicLayout>
      <PageHero
        title="Voter"
        description="Choisissez une candidate, indiquez le nombre de votes, puis payez."
        className="[&>div]:max-w-5xl [&>div]:!pb-4"
      />
      <Suspense fallback={<div className="py-32 text-center text-muted">Chargement...</div>}>
        <VoteForm />
      </Suspense>
    </PublicLayout>
  );
}
