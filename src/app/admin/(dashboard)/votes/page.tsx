"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<Array<{
    id: string;
    voteCount: number;
    amount: number;
    status: string;
    createdAt: string;
    candidate: { name: string; number: number };
    event: { name: string };
    payment: { reference: string };
  }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetch(`/api/admin/votes?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setVotes(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Votes</h1>
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
            </tr>
          </thead>
          <tbody>
            {votes.map((v, i) => (
              <tr key={v.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in border-b border-border/60 hover:bg-champagne/50 transition-colors">
                <td className="p-4">N°{v.candidate.number} {v.candidate.name}</td>
                <td className="p-4 text-muted">{v.event.name}</td>
                <td className="p-4">{v.voteCount}</td>
                <td className="p-4">{formatCurrency(v.amount)}</td>
                <td className="p-4">{v.status}</td>
                <td className="p-4 text-xs text-muted">{v.payment.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
