"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface AttendanceBadgeMakerProps {
  open: boolean;
  onClose: () => void;
  frameUrl: string;
  eventName: string;
  fileName: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Création du visuel « J'y serai » : la photo du visiteur est placée sous le cadre
 * du graphiste, puis l'image est téléchargée. Tout se fait dans le navigateur :
 * la photo n'est jamais envoyée au serveur.
 */
export function AttendanceBadgeMaker({ open, onClose, frameUrl, eventName, fileName }: AttendanceBadgeMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState<HTMLImageElement | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open || frame) return;
    loadImage(frameUrl)
      .then(setFrame)
      .catch(() => setError("Le cadre n'a pas pu être chargé."));
  }, [open, frame, frameUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    const W = frame.naturalWidth;
    const H = frame.naturalHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#e2e2e2";
    ctx.fillRect(0, 0, W, H);
    if (photo) {
      // Photo « cover » + zoom, déplaçable.
      const scale = Math.max(W / photo.naturalWidth, H / photo.naturalHeight) * zoom;
      const w = photo.naturalWidth * scale;
      const h = photo.naturalHeight * scale;
      ctx.drawImage(photo, (W - w) / 2 + offset.x, (H - h) / 2 + offset.y, w, h);
    }
    ctx.drawImage(frame, 0, 0, W, H);
  }, [frame, photo, zoom, offset]);

  useEffect(draw, [draw]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    loadImage(url)
      .then((img) => {
        setPhoto(img);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      })
      .catch(() => setError("Cette image ne peut pas être lue. Essayez une photo JPG ou PNG."));
  }

  function canvasScale() {
    const canvas = canvasRef.current;
    return canvas ? canvas.width / canvas.clientWidth : 1;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!photo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const k = canvasScale();
    const dx = (e.clientX - drag.current.x) * k;
    const dy = (e.clientY - drag.current.y) * k;
    drag.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      // Mobile : partage natif (WhatsApp, galerie…) si disponible, sinon téléchargement.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: eventName });
          return;
        } catch {
          // partage annulé : on télécharge
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Créer mon visuel J'y serai"
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-champagne"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-foreground pr-8">Mon visuel « J&apos;y serai »</h2>
        <p className="text-sm text-muted">{eventName}</p>

        <div className="mt-4 rounded-lg overflow-hidden bg-champagne">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            className={`block w-full h-auto touch-none ${photo ? "cursor-grab active:cursor-grabbing" : ""}`}
          />
        </div>

        {photo && (
          <div className="mt-3">
            <label htmlFor="badge-zoom" className="text-sm text-muted">
              Zoom — glissez la photo pour la placer
            </label>
            <input
              id="badge-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#d4af37]"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-4 grid gap-2">
          <label className="btn-soft cursor-pointer">
            {photo ? "Changer de photo" : "Ajouter ma photo"}
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
          </label>
          <button type="button" onClick={download} disabled={!photo || !frame} className="btn-gold disabled:opacity-50">
            Télécharger mon visuel
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Votre photo reste sur votre téléphone, elle n&apos;est pas envoyée.</p>
      </div>
    </div>
  );
}
