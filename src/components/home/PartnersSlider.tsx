interface Partner {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
}

/** Bandeau de logos qui défile en continu (pause au survol). */
export function PartnersSlider({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;
  // Liste dupliquée pour une boucle sans saut ; on répète si peu de logos.
  const base = partners.length < 6 ? [...partners, ...partners, ...partners] : partners;
  const loop = [...base, ...base];

  return (
    <div className="relative overflow-hidden group [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max gap-3 animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((p, i) => {
          const content = p.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logo} alt={p.name} className="max-h-12 w-auto object-contain" />
          ) : (
            <span className="text-sm font-medium text-foreground/70 text-center">{p.name}</span>
          );
          const className = "shrink-0 w-40 h-20 bg-white rounded-lg shadow-sm flex items-center justify-center p-3 no-underline";
          return p.website ? (
            <a
              key={`${p.id}-${i}`}
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              aria-hidden={i >= base.length}
              tabIndex={i >= base.length ? -1 : undefined}
            >
              {content}
            </a>
          ) : (
            <div key={`${p.id}-${i}`} className={className} aria-hidden={i >= base.length}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
