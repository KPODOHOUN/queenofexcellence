import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Projets",
  description: "Les projets et initiatives de Queen of Excellence.",
};

export default async function ProjetsPage() {
  const projects = await safeQuery(
    "projects.list",
    () =>
      prisma.project.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
      }),
    []
  );

  const [featured, ...rest] = projects;

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Projets"
        title="Nos initiatives"
        description="Les projets qui portent notre vision de l'excellence féminine."
      />

      <section className="py-4 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {projects.length === 0 ? (
            <EmptyState title="Aucun projet disponible pour le moment." />
          ) : (
            <div className="space-y-12">
              {featured && (
                <Reveal
                  as="section"
                  className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center card-elevated overflow-hidden"
                >
                  {featured.image && (
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px] overflow-hidden">
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                  )}
                  <div className="p-8 lg:p-10 lg:pr-12">
                    <h2 className="font-serif text-2xl lg:text-3xl text-foreground mb-4">{featured.title}</h2>
                    <p className="text-muted leading-relaxed">{featured.description}</p>
                  </div>
                </Reveal>
              )}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((project, i) => (
                    <Reveal
                      key={project.id}
                      delay={(i % 3) * 100}
                      as="section"
                      className="group card-elevated overflow-hidden"
                    >
                      {project.image && (
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="font-serif text-xl text-foreground mb-3">{project.title}</h3>
                        <p className="text-sm text-muted leading-relaxed">{project.description}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
