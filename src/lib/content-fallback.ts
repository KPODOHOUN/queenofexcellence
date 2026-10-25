/** Image par défaut — section À propos (accueil). Remplaçable via Admin → Contenu. */
export const DEFAULT_ABOUT_IMAGE =
  "/uploads/fbd98050-d325-4edf-b291-fe5b5c79d53b.jpg";

export const DEFAULT_ABOUT = {
  title: "Queen of Excellence",
  content:
    "Un concours intellectuel féminin à Parakou qui met en avant l'intelligence, la culture générale et le leadership. Ici, ce n'est pas l'apparence qui fait la différence, mais le savoir, l'éloquence et la capacité à s'exprimer avec brio.",
  image: DEFAULT_ABOUT_IMAGE,
};

/** Contenu de secours uniquement si la base est indisponible (pas de données en dur en production). */
export const emptyContact = {
  email: "",
  phone: "",
  address: "",
  hours: "",
};
