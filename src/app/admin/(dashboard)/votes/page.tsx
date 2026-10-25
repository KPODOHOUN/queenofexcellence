"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";
import { RefreshCw } from "lucide-react";

type ReconcileStats = {
  paidVoteTotal: number;
  candidateVoteTotal: number;
  voteCountDrift: number;
  pendingPayments: number;
  pendingWithTransaction: number;
};

type ReconcileResult = ReconcileStats & {
  retried: number;
  confirmed: number;
  retryFailed: number;
  forceFinalized: number;
  forceFailed: number;
  candidatesUpdated: number;
  before: ReconcileStats;
  after: ReconcileStats;
};

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<Array<{
    id: string;
    voteCount: number;
    amount: number;
    status: string;
    createdAt: string;
    candidate: { name: string; number: number };
    event: { name: string };
    payment: { reference: string; status?: string };
  }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState<ReconcileStats | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMsg, setReconcileMsg] = useState("");
  const [forcingRef, setForcingRef] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    fetch("/api/admin/votes/reconcile")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    fetch(`/api/admin/votes?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setVotes(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  async function handleReconcile() {
    if (!confirm("Synchroniser les votes payés et recalculer les totaux des candidates ?")) return;
    setReconciling(true);
    setReconcileMsg("");
    try {
      const res = await fetch("/api/admin/votes/reconcile", { method: "POST" });
      const data: ReconcileResult = await res.json();
      if (!res.ok) throw new Error(data as unknown as string);
      setStats(data.after);
      setReconcileMsg(
        `${data.confirmed} paiement(s) confirmé(s), ${data.candidatesUpdated} candidate(s) recalculée(s). ` +
          `Total votes : ${data.after.paidVoteTotal.toLocaleString("fr-FR")} (avant : ${data.before.paidVoteTotal.toLocaleString("fr-FR")}).`
      );
      const votesRes = await fetch(`/api/admin/votes?page=${page}`);
      const votesData = await votesRes.json();
      setVotes(votesData.items);
    } catch {
      setReconcileMsg("Erreur lors de la synchronisation.");
    } finally {
      setReconciling(false);
    }
  }

  async function handleForceFinalize(reference: string) {
    if (
      !confirm(
        `Confirmer manuellement le paiement ${reference} ? Utilisez cette option seulement si le paiement apparaît comme réussi sur KKiaPay.`
      )
    ) {
      return;
    }
    setForcingRef(reference);
    try {
      const res = await fetch("/api/admin/votes/reconcile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      loadStats();
      const votesRes = await fetch(`/api/admin/votes?page=${page}`);
      const votesData = await votesRes.json();
      setVotes(votesData.items);
      setReconcileMsg(`Paiement ${reference} confirmé manuellement.`);
    } catch (err) {
      setReconcileMsg(err instanceof Error ? err.message : "Confirmation manuelle échouée.");
    } finally {
      setForcingRef(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <h1 className="font-serif text-3xl">Votes</h1>
        <button
          type="button"
          onClick={handleReconcile}
          disabled={reconciling}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white gold-gradient rounded-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          <RefreshCw size={16} className={reconciling ? "animate-spin" : ""} />
          {reconciling ? "Synchronisation..." : "Synchroniser les votes"}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Votes payés (base)</p>
            <p className="font-serif text-2xl mt-1">{stats.paidVoteTotal.toLocaleString("fr-FR")}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Total affiché candidates</p>
            <p className="font-serif text-2xl mt-1">{stats.candidateVoteTotal.toLocaleString("fr-FR")}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Paiements en attente</p>
            <p className="font-serif text-2xl mt-1">{stats.pendingPayments.toLocaleString("fr-FR")}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">En attente avec transaction</p>
            <p className="font-serif text-2xl mt-1">{stats.pendingWithTransaction.toLocaleString("fr-FR")}</p>
          </div>
        </div>
      )}

      {reconcileMsg && (
        <p className="text-sm text-muted bg-champagne/50 border border-border rounded-lg p-3 mb-6">
          {reconcileMsg}
        </p>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="bg-champagne/30 border-b border-border">
            <tr>
              <th className="text-left p-4">Candidate</th>
              <th className="text-left p-4">Événement</th>
              <th className="text-left p-4">Votes</th>
              <th className="text-left p-4">Montant</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">Référence</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((v, i) => (
              <tr
                key={v.id}
                style={{ animationDelay: `${i * 30}ms` }}
                className="animate-fade-in border-b border-border/60 hover:bg-champagne/50 transition-colors"
              >
                <td className="p-4">
                  N°{v.candidate.number} {v.candidate.name}
                </td>
                <td className="p-4 text-muted">{v.event.name}</td>
                <td className="p-4">{v.voteCount}</td>
                <td className="p-4">{formatCurrency(v.amount)}</td>
                <td className="p-4">
                  <span
                    className={
                      v.status === "PAID"
                        ? "text-green-700"
                        : v.status === "PENDING"
                          ? "text-amber-700"
                          : "text-red-700"
                    }
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-muted">{v.payment.reference}</td>
                <td className="p-4 text-right">
                  {v.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleForceFinalize(v.payment.reference)}
                      disabled={forcingRef === v.payment.reference}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gold/40 text-gold-dark hover:bg-gold/10 disabled:opacity-50"
                    >
                      {forcingRef === v.payment.reference ? "..." : "Confirmer"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
