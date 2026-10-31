import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, locale: "fr" });
}

export function formatCurrency(amount: number, currency = "XAF"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPCOMING: "À venir",
    ONGOING: "En cours",
    COMPLETED: "Terminé",
    DRAFT: "Brouillon",
  };
  return labels[status] ?? status;
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    PAID: "Payé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
  };
  return labels[status] ?? status;
}

/**
 * Chemin d'image utilisable par next/image, ou null. next/image plante la page entière
 * sur un src vide ou relatif sans « / » : on normalise ce que l'admin a pu saisir.
 */
export function safeImageSrc(src: unknown): string | null {
  if (typeof src !== "string") return null;
  const value = src.trim();
  if (!value) return null;
  if (value.startsWith("/") || /^https?:\/\//i.test(value)) return value;
  if (value.startsWith("uploads/")) return `/${value}`;
  return null;
}
