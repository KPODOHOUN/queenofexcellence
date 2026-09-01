import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import BilletterieForm from "./BilletterieForm";

export default function BilletteriePage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="py-32 text-center text-muted">Chargement...</div>}>
        <BilletterieForm />
      </Suspense>
    </PublicLayout>
  );
}
