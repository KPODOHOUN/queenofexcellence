import { redirect } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { findShowcaseEvents, pickFeaturedEvent } from "@/lib/db/models/showcase";
import { safeQuery } from "@/lib/safe-db";

export const dynamic = "force-dynamic";

/** « J'y serai » sans événement précisé : on va vers l'événement mis en avant. */
export default async function JySeraiIndexPage() {
  const events = await safeQuery("jyserai.events", () => findShowcaseEvents(), []);
  const featured = pickFeaturedEvent(events.filter((e) => e.status !== "COMPLETED"));
  if (featured) redirect(`/j-y-serai/${featured.slug}`);

  return (
    <PublicLayout>
      <div className="py-16">
        <EmptyState title="Aucun événement à venir pour le moment." />
      </div>
    </PublicLayout>
  );
}
