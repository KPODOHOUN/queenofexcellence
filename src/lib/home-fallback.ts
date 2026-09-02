import type { HeroSlide } from "@/components/home/HeroSlider";

export const fallbackAbout = {
  title: "À propos de Queen of Excellence",
  content:
    "Queen of Excellence est une plateforme événementielle dédiée à la célébration de l'excellence féminine à travers des concours, des votes payants et des billetteries en ligne.",
};

export const fallbackHeroSlides: HeroSlide[] = [
  {
    id: "fallback",
    image: "/logo.svg",
    subtitle: "Queen of Excellence",
    title: "Célébrez l'Excellence",
    description:
      "La plateforme événementielle qui met en lumière les femmes d'exception.",
    ctaPrimary: { label: "Voter maintenant", href: "/vote" },
    ctaSecondary: { label: "Découvrir", href: "/events" },
  },
];

export const fallbackHomeStats = {
  events: 0,
  candidates: 0,
  votes: 0,
  supporters: 0,
  ticketsSold: 0,
};
