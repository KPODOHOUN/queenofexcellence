"use client";

import { useCallback, useEffect, useState } from "react";
import { AttendanceBadgeMaker } from "@/components/events/AttendanceBadgeMaker";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "qoe-visitor";

function randomToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Identifiant anonyme du navigateur, pour ne compter qu'une présence par visiteur. */
function visitorToken(): string {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = randomToken();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return randomToken();
  }
}

function label(count: number) {
  return `${count.toLocaleString("fr-FR")} participant${count > 1 ? "s" : ""} confirmé${count > 1 ? "s" : ""}`;
}

interface AttendButtonProps {
  eventId: string;
  className?: string;
  /** Cadre du graphiste : si présent, « J'y serai » ouvre la création du visuel. */
  frameUrl?: string | null;
  eventName?: string;
  eventSlug?: string;
}

/** Bouton « J'y serai » avec le compteur de participants et le visuel à télécharger. */
export function AttendButton({ eventId, className, frameUrl, eventName = "", eventSlug = "evenement" }: AttendButtonProps) {
  const [state, setState] = useState<{ count: number; attending: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [makerOpen, setMakerOpen] = useState(false);
  const closeMaker = useCallback(() => setMakerOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/attendance?eventId=${encodeURIComponent(eventId)}&token=${visitorToken()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && data && setState(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!state) return null;

  async function toggle() {
    if (!state || busy) return;
    setBusy(true);
    const attend = !state.attending;
    if (attend && frameUrl) setMakerOpen(true);
    // Mise à jour immédiate, corrigée par la réponse du serveur.
    setState({ count: Math.max(0, state.count + (attend ? 1 : -1)), attending: attend });
    try {
      const res = await fetch("/api/public/attendance", {
        method: attend ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, token: visitorToken() }),
      });
      if (res.ok) setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{label(state.count)}</span>
        <div className="flex items-center gap-2 shrink-0">
          {state.attending && frameUrl && (
            <button type="button" onClick={() => setMakerOpen(true)} className="btn-soft !min-h-10 !px-3">
              Mon visuel
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={state.attending}
            className={cn(state.attending ? "btn-gold" : "btn-dark", "!min-h-10 !px-4")}
          >
            {state.attending ? "J'y serai ✓" : "J'y serai"}
          </button>
        </div>
      </div>
      {frameUrl && (
        <AttendanceBadgeMaker
          open={makerOpen}
          onClose={closeMaker}
          frameUrl={frameUrl}
          eventName={eventName}
          fileName={`j-y-serai-${eventSlug}.png`}
        />
      )}
    </div>
  );
}
