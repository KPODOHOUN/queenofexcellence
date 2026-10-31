"use client";

import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { findTransparentZone } from "@/lib/frame/zone";

interface AttendanceFrameFieldProps {
  value: string;
  onChange: (url: string) => void;
}

/** Cadre « J'y serai » : vérifie à l'envoi que le fichier a bien une zone transparente pour la photo. */
export function AttendanceFrameField({ value, onChange }: AttendanceFrameFieldProps) {
  const [status, setStatus] = useState<"unknown" | "ready" | "no-zone">("unknown");

  useEffect(() => {
    let cancelled = false;
    if (!value) return;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      setStatus(findTransparentZone(ctx.getImageData(0, 0, canvas.width, canvas.height)) ? "ready" : "no-zone");
    };
    img.onerror = () => !cancelled && setStatus("no-zone");
    img.src = value;
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="space-y-2">
      <ImageUploadField
        keepOriginal
        label="Cadre « J'y serai »"
        hint="PNG du graphiste, avec une zone transparente à l'emplacement de la photo."
        value={value}
        onChange={onChange}
      />
      {value && status === "ready" && <p className="text-sm text-green-700">Cadre prêt : la zone photo est détectée.</p>}
      {value && status === "no-zone" && (
        <p className="text-sm text-red-700">
          Aucune zone transparente dans ce fichier : la photo du visiteur ne pourrait pas s&apos;afficher. Demandez au graphiste un PNG avec le fond de cette zone transparent.
        </p>
      )}
    </div>
  );
}
