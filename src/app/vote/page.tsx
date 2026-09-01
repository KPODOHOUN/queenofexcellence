import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import VoteForm from "./VoteForm";

export default function VotePage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="py-32 text-center text-muted">Chargement...</div>}>
        <VoteForm />
      </Suspense>
    </PublicLayout>
  );
}
