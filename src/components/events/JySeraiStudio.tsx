"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { attendanceLabel, confirmAttendance, fetchAttendance, type Attendance } from "@/lib/attendance-client";
import { findTransparentZone, type Box } from "@/lib/frame/zone";

interface JySeraiStudioProps {
  eventId: string;
  eventSlug: string;
  eventName: string;
  frameUrl: string | null;
}

type Step = "start" | "crop" | "done";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Page « J'y serai » : le visiteur choisit sa photo, la recadre sur la forme exacte de
 * l'emplacement du cadre, puis télécharge le visuel. Tout se passe dans le navigateur :
 * la photo n'est jamais envoyée au serveur.
 */
export function JySeraiStudio({ eventId, eventSlug, eventName, frameUrl }: JySeraiStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [frame, setFrame] = useState<HTMLImageElement | null>(null);
  const [zone, setZone] = useState<Box | null>(null);
  const [frameState, setFrameState] = useState<"loading" | "ready" | "no-zone" | "none">(frameUrl ? "loading" : "none");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [step, setStep] = useState<Step>("start");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [canShare, setCanShare] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    fetchAttendance(eventId).then(setAttendance).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator.canShare === "function");
  }, [eventId]);

  useEffect(() => {
    if (!frameUrl) return;
    let cancelled = false;
    loadImage(frameUrl)
      .then((img) => {
        if (cancelled) return;
        const probe = document.createElement("canvas");
        probe.width = img.naturalWidth;
        probe.height = img.naturalHeight;
        const ctx = probe.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const found = findTransparentZone(ctx.getImageData(0, 0, probe.width, probe.height));
        setFrame(img);
        setZone(found);
        setFrameState(found ? "ready" : "no-zone");
      })
      .catch(() => !cancelled && setFrameState("no-zone"));
    return () => {
      cancelled = true;
    };
  }, [frameUrl]);

  /** Garde la photo entièrement sur l'emplacement, quel que soit le zoom. */
  const clamp = useCallback(
    (o: { x: number; y: number }, z: number) => {
      if (!photo || !zone) return o;
      const scale = Math.max(zone.width / photo.naturalWidth, zone.height / photo.naturalHeight) * z;
      const maxX = Math.max(0, (photo.naturalWidth * scale - zone.width) / 2);
      const maxY = Math.max(0, (photo.naturalHeight * scale - zone.height) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
    },
    [photo, zone]
  );

  // Rendu : en recadrage on ne montre que l'emplacement, sinon le visuel complet.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    const cropping = step === "crop" && zone;
    canvas.width = cropping ? zone.width : frame.naturalWidth;
    canvas.height = cropping ? zone.height : frame.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    if (cropping) ctx.translate(-zone.x, -zone.y);
    if (photo && zone) {
      const scale = Math.max(zone.width / photo.naturalWidth, zone.height / photo.naturalHeight) * zoom;
      const w = photo.naturalWidth * scale;
      const h = photo.naturalHeight * scale;
      ctx.drawImage(photo, zone.x + (zone.width - w) / 2 + offset.x, zone.y + (zone.height - h) / 2 + offset.y, w, h);
    }
    ctx.drawImage(frame, 0, 0);
    ctx.restore();
  }, [frame, zone, photo, zoom, offset, step]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    loadImage(URL.createObjectURL(file))
      .then((img) => {
        setPhoto(img);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setStep("crop");
      })
      .catch(() => setError("Cette image ne peut pas être lue. Essayez une photo JPG ou PNG."));
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (step !== "crop") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = null;
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const all = [...pointers.current.values()];
    if (all.length === 2) {
      // Deux doigts : zoom.
      const distance = Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y);
      if (!pinch.current) pinch.current = { distance, zoom };
      const next = Math.min(4, Math.max(1, pinch.current.zoom * (distance / pinch.current.distance)));
      setZoom(next);
      setOffset((o) => clamp(o, next));
      return;
    }
    const canvas = e.currentTarget;
    const k = canvas.width / canvas.clientWidth;
    setOffset((o) => clamp({ x: o.x + (e.clientX - previous.x) * k, y: o.y + (e.clientY - previous.y) * k }, zoom));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  async function validate() {
    setStep("done");
    const next = await confirmAttendance(eventId).catch(() => null);
    if (next) setAttendance(next);
  }

  const fileName = `j-y-serai-${eventSlug}.jpg`;

  function toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
  }

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    if (!navigator.canShare?.({ files: [file] })) {
      await download();
      return;
    }
    await navigator.share({ files: [file], title: eventName }).catch(() => {});
  }

  const count = attendance ? <p className="text-sm text-muted text-center">{attendanceLabel(attendance.count)}</p> : null;

  if (frameState === "none" || frameState === "no-zone") {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4 text-center">
        {frameState === "no-zone" && (
          <p className="text-sm text-muted">Le visuel à personnaliser de cet événement n&apos;est pas encore disponible.</p>
        )}
        <button
          type="button"
          onClick={validate}
          disabled={attendance?.attending}
          className="btn-gold disabled:opacity-60"
        >
          {attendance?.attending ? "Présence confirmée ✓" : "Je confirme ma présence"}
        </button>
        {count}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <div className="bg-white rounded-lg shadow-sm p-3">
        {frameState === "loading" ? (
          <div className="aspect-square bg-champagne rounded animate-pulse" />
        ) : (
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`block w-full h-auto rounded ${step === "crop" ? "touch-none cursor-grab active:cursor-grabbing bg-champagne" : ""}`}
          />
        )}
      </div>

      {step === "crop" && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm font-medium text-foreground">Recadrez votre photo</p>
          <p className="text-sm text-muted mb-3">Glissez la photo pour la placer, puis réglez le zoom.</p>
          <label htmlFor="jy-zoom" className="sr-only">Zoom</label>
          <input
            id="jy-zoom"
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => {
              const next = Number(e.target.value);
              setZoom(next);
              setOffset((o) => clamp(o, next));
            }}
            className="w-full accent-[#d4af37]"
          />
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700 text-center">{error}</p>}

      <div className="grid gap-2">
        {step === "start" && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={frameState !== "ready"} className="btn-gold !min-h-12 disabled:opacity-60">
            Ajouter ma photo
          </button>
        )}
        {step === "crop" && (
          <>
            <button type="button" onClick={validate} className="btn-gold !min-h-12">Valider</button>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-soft">Changer de photo</button>
          </>
        )}
        {step === "done" && (
          <>
            <button type="button" onClick={download} className="btn-gold !min-h-12">Télécharger mon visuel</button>
            {canShare && <button type="button" onClick={share} className="btn-dark">Partager</button>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStep("crop")} className="btn-soft">Recadrer</button>
              <button type="button" onClick={() => inputRef.current?.click()} className="btn-soft">Changer de photo</button>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="sr-only" aria-label="Choisir une photo" />
      </div>

      {count}
      <p className="text-center text-xs text-muted">Votre photo reste sur votre appareil, elle n&apos;est pas envoyée.</p>
    </div>
  );
}
