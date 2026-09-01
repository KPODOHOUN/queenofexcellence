"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0c] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gold/5 blur-[140px] pointer-events-none" />

      <header className="relative px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image src="/logo.png" alt="Queen of Excellence" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-serif text-lg text-white">
            Queen of <span className="text-gold">Excellence</span>
          </span>
        </Link>
      </header>

      <div className="relative flex-1 flex items-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold/20 bg-gold/5 mb-8">
            <AlertTriangle size={26} className="text-gold" />
          </div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-5">Une erreur est survenue</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-white mb-5 leading-tight">
            Quelque chose s&apos;est mal passé
          </h1>
          <p className="text-white/55 mb-12 text-[15px] leading-relaxed max-w-md mx-auto">
            Un problème inattendu est survenu de notre côté. Réessayez, ou retournez à l&apos;accueil
            si le souci persiste.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <RotateCcw size={16} />
              Réessayer
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white border border-white/15 rounded-full hover:border-gold/40 hover:text-gold-light transition-all duration-300"
            >
              <Home size={16} />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
