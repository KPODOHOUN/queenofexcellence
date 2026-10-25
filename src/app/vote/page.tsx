import { Suspense } from "react";
import Script from "next/script";
import { PublicLayout } from "@/components/layout/PublicLayout";
import VoteForm from "./VoteForm";

export default function VotePage() {
  return (
    <PublicLayout>
      <Script src="https://cdn.kkiapay.me/k.js" strategy="beforeInteractive" />
      <Suspense fallback={<div className="py-32 text-center text-muted">Chargement...</div>}>
        <VoteForm />
      </Suspense>
    </PublicLayout>
  );
}
