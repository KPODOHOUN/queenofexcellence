"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stats = { count: number; bytes: number; onDisk: number };

/** Import dans la base des images envoyées avant le stockage MySQL. */
export default function AdminMediaPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    const data = await res.json();
    if (res.ok) setStats(data);
    else setMessage(data.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function importFromServer() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/media", { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? `${data.imported} image(s) importée(s), ${data.skipped} ignorée(s).` : data.error);
    await refresh();
    setBusy(false);
  }

  async function importFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setMessage("");
    let imported = 0;
    let failed = 0;
    // Une par une : un lot complet dépasserait les limites du serveur.
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: form }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (data && data.skipped === 0) imported += data.imported;
      else failed++;
    }
    setMessage(`${imported} image(s) importée(s)${failed ? `, ${failed} en échec` : ""}.`);
    await refresh();
    setBusy(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-2">Images</h1>
      <p className="text-sm text-muted mb-6">
        Les nouvelles images sont enregistrées dans la base de données. Cette page sert à y importer une seule fois les images plus anciennes : les contenus gardent leurs liens.
      </p>

      <div className="bg-white p-6 rounded-xl border border-border space-y-5">
        {stats && (
          <p className="text-sm" data-testid="media-stats">
            <strong>{stats.count}</strong> image(s) en base ({(stats.bytes / 1048576).toFixed(1)} Mo) •{" "}
            <strong>{stats.onDisk}</strong> fichier(s) sur le serveur
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={importFromServer} disabled={busy} className="btn-gold disabled:opacity-60">
            Importer depuis le serveur
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-soft disabled:opacity-60">
            Importer une sauvegarde
          </button>
          <input ref={inputRef} type="file" multiple accept="image/*" onChange={importFiles} className="sr-only" aria-label="Fichiers de sauvegarde" />
        </div>
        <p className="text-xs text-muted">
          « Importer une sauvegarde » : sélectionnez les fichiers du dossier uploads, sans les renommer.
        </p>
        {busy && <p className="text-sm text-muted">Import en cours…</p>}
        {message && <p role="status" className="text-sm text-foreground">{message}</p>}
      </div>
    </div>
  );
}
