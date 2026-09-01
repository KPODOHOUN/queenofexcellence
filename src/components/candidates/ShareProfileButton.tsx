"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareProfileButtonProps {
  path: string;
  className?: string;
}

export function ShareProfileButton({ path, className }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium rounded-full border transition-all duration-300",
        copied
          ? "border-gold/40 bg-gold/10 text-gold-dark"
          : "border-border text-foreground/70 hover:border-gold/40 hover:text-gold-dark hover:-translate-y-0.5",
        className
      )}
    >
      {copied ? (
        <>
          <Check size={16} />
          Lien copié !
        </>
      ) : (
        <>
          <Link2 size={16} />
          Copier le lien du profil
        </>
      )}
    </button>
  );
}
