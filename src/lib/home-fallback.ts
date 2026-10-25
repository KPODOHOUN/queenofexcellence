import type { HeroSlide } from "@/components/home/HeroSlider";

/** Nombre max de slides hero affichés (configurable depuis l'admin). */
export const HERO_SLIDE_COUNT = 3;

export function sliceHeroSlides(slides: HeroSlide[]): HeroSlide[] {
  return slides.slice(0, HERO_SLIDE_COUNT);
}
