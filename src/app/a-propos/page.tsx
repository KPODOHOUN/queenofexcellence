import { PublicLayout } from "@/components/layout/PublicLayout";
import { Reveal } from "@/components/ui/Reveal";
import { Award, BookOpen, Users, Sparkles, Megaphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez Queen of Excellence, un concours intellectuel féminin à Parakou mettant en avant l'intelligence, la culture générale et le leadership.",
};

const missions = [
  {
    icon: Sparkles,
    text: "Révéler des étudiantes au potentiel intellectuel remarquable",
  },
  {
    icon: BookOpen,
    text: "Encourager l'excellence académique et le goût de la culture générale",
  },
  {
    icon: Megaphone,
    text: "Offrir une tribune d'expression et de valorisation aux étudiantes de Parakou",
  },
  {
    icon: Users,
    text: "Renforcer la confiance en soi et le leadership à travers des formations et des défis stimulants",
  },
  {
    icon: Award,
    text: "Changer le regard porté sur la femme étudiante, en misant sur l'intellect avant tout",
  },
];

export default async function AProposPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-champagne">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                À propos
              </p>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight max-w-2xl">
              À propos de Queen of Excellence
            </h1>
            <p className="mt-4 text-xl sm:text-2xl font-serif text-gold-dark max-w-2xl">
              Un concours pas comme les autres
            </p>
          </Reveal>

          <Reveal delay={100}>
            <p className="mt-8 text-lg text-muted leading-relaxed max-w-3xl">
              Queen of Excellence (Reine de l&apos;Excellence) n&apos;est pas un
              concours de beauté comme les autres. C&apos;est une compétition
              purement intellectuelle qui met en avant l&apos;intelligence, la
              culture générale et le leadership de la femme en milieu
              universitaire. Ici, ce n&apos;est pas l&apos;apparence qui fait la
              différence, mais le savoir, l&apos;éloquence et la capacité à
              penser et à s&apos;exprimer avec brio.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                Notre histoire
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-8">
              De Miss Belle et Intelligente à Queen of Excellence
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-5 text-muted leading-relaxed">
              <p>
                Le concours a vu le jour sous le nom de{" "}
                <strong className="text-foreground">
                  Miss Belle et Intelligente
                </strong>{" "}
                (Miss Beauty and Brain) en 2025, avec une ambition claire :
                donner à voir des étudiantes brillantes, cultivées et engagées,
                loin des standards classiques des concours de beauté. Sa
                première édition a rencontré un succès qui a dépassé toutes les
                attentes : <strong className="text-foreground">260 candidates inscrites</strong>, dont{" "}
                <strong className="text-foreground">13 finalistes</strong> qui se sont affrontées lors
                d&apos;une grande finale, et{" "}
                <strong className="text-foreground">4 lauréates</strong> primées pour
                l&apos;excellence de leur parcours intellectuel.
              </p>
              <p>
                Fort de ce succès, le Comité d&apos;Organisation a choisi de faire
                évoluer l&apos;identité du concours. Il devient{" "}
                <strong className="text-foreground">Queen of Excellence</strong>,
                un nom qui incarne pleinement sa vocation : révéler et couronner
                l&apos;excellence intellectuelle féminine.
              </p>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={200}>
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[
                { value: "260", label: "Candidates" },
                { value: "13", label: "Finalistes" },
                { value: "4", label: "Lauréates" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-6 rounded-2xl bg-champagne border border-gold/10"
                >
                  <p className="font-serif text-3xl sm:text-4xl gold-gradient-text">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Notre mission */}
      <section className="py-20 lg:py-28 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                Notre mission
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight tracking-tight mb-12">
              Ce que nous voulons accomplir
            </h2>
          </Reveal>

          <div className="space-y-4">
            {missions.map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/20 transition-colors duration-300">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <item.icon size={20} className="text-gold" />
                  </div>
                  <p className="text-white/80 leading-relaxed pt-2">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Rejoignez l'aventure */}
      <section className="py-20 lg:py-28 bg-champagne">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                Rejoignez l&apos;aventure
              </p>
              <span className="h-px w-8 bg-gold/60" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-6">
              Faites partie de l&apos;excellence
            </h2>
            <p className="text-muted leading-relaxed text-[15px] sm:text-base mb-10 max-w-2xl mx-auto">
              Que vous soyez candidate, partenaire ou simplement curieuse de
              découvrir l&apos;excellence estudiantine de Parakou, Queen of
              Excellence vous invite à faire partie de cette aventure
              intellectuelle et humaine.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/vote"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-foreground gold-gradient rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/20"
              >
                Voter maintenant
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-foreground border border-gold/30 rounded-full hover:bg-gold/10 transition-all duration-300"
              >
                Nous contacter
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mot de bienvenue */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gold/60" />
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-medium">
                Mot de bienvenue
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight tracking-tight mb-8">
              Par le Promoteur
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <blockquote className="relative p-8 lg:p-10 rounded-2xl bg-champagne border border-gold/15">
              <span className="absolute top-6 left-8 font-serif text-6xl text-gold/20 leading-none">
                &ldquo;
              </span>
              <div className="space-y-4 text-muted leading-relaxed relative z-10">
                <p>Chers visiteurs, chères futures candidates,</p>
                <p>
                  Bienvenue dans l&apos;univers de Queen of Excellence !
                </p>
                <p>
                  Ce concours est né d&apos;une conviction qui me tient à cœur
                  : nos étudiantes méritent d&apos;être célébrées pour leur
                  intelligence, leur culture et leur personnalité, bien plus que
                  pour leur seule apparence. La première édition sous le nom de
                  Miss Belle et Intelligente, nous a offert de très belles
                  surprises : 260 candidates, 13 finalistes brillantes et 4
                  lauréates couronnées. Ce succès nous a donné des ailes.
                </p>
                <p>
                  Aujourd&apos;hui, le concours devient Queen of Excellence et
                  s&apos;ouvre à toutes les étudiantes de Parakou. Je suis fier
                  de porter ce projet et impatient de découvrir les futures
                  Reines de l&apos;Excellence.
                </p>
                <p>Merci d&apos;être là. À très vite !</p>
              </div>
              <footer className="mt-8 pt-6 border-t border-gold/15">
                <p className="font-serif text-lg text-foreground">
                  O. M. Déo-Gratias Brunnel ADJAGBA
                </p>
                <p className="text-sm text-muted mt-1">
                  Promoteur du concours
                </p>
                <p className="text-sm text-muted">
                  Juriste Pénaliste · Expert en droit du numérique
                </p>
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
