"use client";

import { useEffect, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    read: boolean;
    createdAt: string;
  }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetch(`/api/admin/contacts?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.items);
        setTotal(data.total);
        setPageSize(data.pageSize);
      });
  }, [page]);

  async function markRead(id: string) {
    await fetch("/api/admin/contacts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read: true }) });
    setMessages(messages.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Messages de contact</h1>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-muted">Aucun message</p>
        ) : messages.map((m, i) => (
          <div
            key={m.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`animate-fade-in bg-white p-6 rounded-xl border hover:border-gold/30 transition-colors ${m.read ? "border-border" : "border-gold/30"}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted">{m.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</p>
                {!m.read && <button onClick={() => markRead(m.id)} className="text-xs text-gold hover:text-gold-dark mt-1 transition-colors">Marquer lu</button>}
              </div>
            </div>
            {m.subject && <p className="text-sm font-medium mb-2">{m.subject}</p>}
            <p className="text-sm text-foreground/70">{m.message}</p>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
