"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { attendanceLabel, fetchAttendance, type Attendance } from "@/lib/attendance-client";
import { cn } from "@/lib/utils";

interface AttendButtonProps {
  eventId: string;
  eventSlug: string;
  className?: string;
}

/** Lien vers la page « J'y serai » de l'événement, avec le compteur de participants. */
export function AttendButton({ eventId, eventSlug, className }: AttendButtonProps) {
  const [state, setState] = useState<Attendance | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAttendance(eventId)
      .then((data) => !cancelled && setState(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-sm text-muted">{state ? attendanceLabel(state.count) : ""}</span>
      <Link href={`/j-y-serai/${eventSlug}`} className={cn(state?.attending ? "btn-gold" : "btn-dark", "!min-h-10 !px-4 shrink-0 no-underline")}>
        {state?.attending ? "Mon visuel" : "J'y serai"}
      </Link>
    </div>
  );
}
