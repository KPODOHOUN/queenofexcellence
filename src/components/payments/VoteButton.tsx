"use client";

import { useCallback, useState } from "react";
import { VoteModal, type VoteTarget } from "@/components/payments/VoteModal";

interface VoteButtonProps extends VoteTarget {
  className?: string;
  label?: string;
}

/** Bouton « Voter » : ouvre la fenêtre de vote (montée au premier clic, puis conservée pendant le paiement). */
export function VoteButton({ candidate, event, className, label = "Voter" }: VoteButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className={className ?? "btn-gold"}
      >
        {label}
      </button>
      {mounted && <VoteModal candidate={candidate} event={event} open={open} onClose={close} />}
    </>
  );
}
