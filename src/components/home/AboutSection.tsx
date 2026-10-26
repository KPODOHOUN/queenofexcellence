"use client";

import Link from "next/link";
import Image from "next/image";
import { DEFAULT_ABOUT_IMAGE } from "@/lib/content-fallback";
import { Reveal } from "@/components/ui/Reveal";

interface AboutSectionProps {
  title?: string;
  content?: string;
  image?: string;
}

export function AboutSection({ title, content, image }: AboutSectionProps) {
  if (!content) return null;

  const displayImage = image || DEFAULT_ABOUT_IMAGE;

  return (
    <section id="a-propos" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden bg-champagne-dark">
            <Image
              src={displayImage}
              alt={title || "À propos"}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={displayImage.startsWith("/uploads/")}
            />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <p className="eyebrow mb-5">À propos</p>
          <h2 className="font-serif text-[2.2rem] sm:text-5xl leading-[1.06] text-foreground">
            {title || "Queen of Excellence"}
          </h2>
          <p className="mt-7 text-foreground/75 leading-[1.8] text-[1rem] max-w-xl">{content}</p>
          <Link href="/a-propos" className="link-lux mt-9 no-underline">
            En savoir plus
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
