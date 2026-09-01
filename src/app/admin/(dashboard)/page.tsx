import { getAdminStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Chiffre d'affaires", value: formatCurrency(stats.revenue) },
    { label: "Événements", value: stats.events.toString() },
    { label: "Candidates", value: stats.candidates.toString() },
    { label: "Votes", value: stats.votes.toLocaleString("fr-FR") },
    { label: "Billets vendus", value: stats.ticketsSold.toString() },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {cards.map((card, i) => (
          <div
            key={card.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-in bg-white p-6 rounded-xl border border-border hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300"
          >
            <p className="text-sm text-muted mb-1">{card.label}</p>
            <p className="text-2xl font-serif text-gold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-medium text-lg mb-4">Paiements récents</h2>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted">Aucun paiement</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-border/60 last:border-0 hover:bg-champagne/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{p.customerName || p.reference}</p>
                    <p className="text-muted text-xs">{p.event?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-muted">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-medium text-lg mb-4">Activité récente</h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted">Aucune activité</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-sm py-2 border-b border-border/60 last:border-0 hover:bg-champagne/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{v.candidate.name}</p>
                    <p className="text-muted text-xs">{v.event.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{v.voteCount} vote(s)</p>
                    <p className="text-xs text-muted">{v.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
