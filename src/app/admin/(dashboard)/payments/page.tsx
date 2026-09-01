"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Array<{
    id: string;
    reference: string;
    amount: number;
    type: string;
    status: string;
    customerName: string | null;
    createdAt: string;
    event: { name: string } | null;
  }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetch(`/api/admin/payments?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Paiements</h1>
      <div className="bg-white rounded-xl border border-border overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="bg-champagne/30 border-b border-border">
            <tr>
              <th className="text-left p-4">Référence</th>
              <th className="text-left p-4">Client</th>
              <th className="text-left p-4">Événement</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Montant</th>
              <th className="text-left p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in border-b border-border/60 hover:bg-champagne/50 transition-colors">
                <td className="p-4 text-xs">{p.reference}</td>
                <td className="p-4">{p.customerName}</td>
                <td className="p-4 text-muted">{p.event?.name}</td>
                <td className="p-4">{p.type}</td>
                <td className="p-4">{formatCurrency(p.amount)}</td>
                <td className="p-4">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
