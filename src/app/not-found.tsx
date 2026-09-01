import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ArrowRight, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <PublicLayout>
      <section className="relative min-h-[75svh] flex items-center overflow-hidden bg-[#0c0c0c]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gold/5 blur-[140px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24 animate-fade-in">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-6">Erreur 404</p>
          <p className="font-serif gold-gradient-text text-[7rem] sm:text-[9rem] leading-none mb-4 select-none">
            404
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-white mb-5 leading-tight">
            Cette page s&apos;est éclipsée
          </h1>
          <p className="text-white/55 mb-12 text-[15px] leading-relaxed max-w-md mx-auto">
            La page que vous cherchez n&apos;existe pas ou a été déplacée. Retournez à l&apos;accueil
            ou explorez nos événements en cours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <Home size={16} />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white border border-white/15 rounded-full hover:border-gold/40 hover:text-gold-light transition-all duration-300 group"
            >
              <Search size={16} />
              Voir les événements
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
