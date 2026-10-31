"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPRESS_ABOVE = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2000;

/** Réduit les grosses photos (JPG/WebP de téléphone) avant l'envoi. PNG et GIF restent intacts. */
async function compressPhoto(file: File): Promise<File> {
  if (file.size <= COMPRESS_ABOVE || !/^image\/(jpeg|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  hint?: string;
  /** Ne pas recompresser le fichier (cadres PNG : la transparence doit rester intacte). */
  keepOriginal?: boolean;
}

export function ImageUploadField({
  label = "Image",
  value,
  onChange,
  className,
  hint,
  keepOriginal = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", keepOriginal ? file : await compressPhoto(file));

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="URL de l'image ou sélectionnez un fichier"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white gold-gradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "Envoi..." : "Parcourir"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {value ? (
        <div className="relative mt-1 w-full max-w-[200px] aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <Image
            src={value}
            alt="Aperçu"
            fill
            className="object-cover"
            sizes="200px"
            unoptimized={value.startsWith("/uploads/")}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Supprimer l'image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full max-w-[200px] aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-gold/40 hover:bg-gold/5 transition-colors text-gray-400 hover:text-gold disabled:opacity-50"
        >
          <ImageIcon size={28} className="mb-2 opacity-50" />
          <span className="text-xs">Cliquez pour choisir</span>
        </button>
      )}
    </div>
  );
}
