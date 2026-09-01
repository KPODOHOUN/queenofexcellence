import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin ---------------------------------------------------------------
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@queenofexcellence.com" },
    update: {},
    create: {
      email: "admin@queenofexcellence.com",
      name: "Administrateur",
      passwordHash,
    },
  });

  // --- Site content ----------------------------------------------------------
  await prisma.siteContent.upsert({
    where: { key: "hero" },
    update: {},
    create: {
      key: "hero",
      value: JSON.stringify({
        title: "Célébrez l'Excellence",
        subtitle: "Queen of Excellence",
        description:
          "La plateforme événementielle qui met en lumière les femmes d'exception.",
        image: "",
        ctaPrimary: "Voter maintenant",
        ctaSecondary: "Découvrir les événements",
      }),
    },
  });

  await prisma.siteContent.upsert({
    where: { key: "about" },
    update: {},
    create: {
      key: "about",
      value: JSON.stringify({
        title: "À propos de Queen of Excellence",
        content:
          "Queen of Excellence est une plateforme événementielle dédiée à la célébration de l'excellence féminine à travers des concours, des votes payants et des billetteries en ligne.",
        mission:
          "Mettre en valeur le talent, l'engagement et le leadership des femmes d'exception.",
        vision:
          "Devenir la référence des concours et événements célébrant l'excellence féminine en Afrique.",
      }),
    },
  });

  await prisma.siteContent.upsert({
    where: { key: "social_links" },
    update: {},
    create: {
      key: "social_links",
      value: JSON.stringify({
        youtube: "",
        facebook: "",
        tiktok: "",
        instagram: "",
        whatsapp: "",
      }),
    },
  });

  // --- Sample event + candidate so the homepage isn't empty -----------------
  const event = await prisma.event.upsert({
    where: { slug: "miss-excellence-2026" },
    update: {},
    create: {
      name: "Miss Excellence 2026",
      slug: "miss-excellence-2026",
      description:
        "Le concours phare de Queen of Excellence, célébrant le talent et l'engagement des candidates.",
      shortDesc: "Le concours phare de l'année.",
      date: new Date("2026-12-01T18:00:00.000Z"),
      time: "18:00",
      location: "Yaoundé, Cameroun",
      status: "UPCOMING",
      votePrice: Number(process.env.DEFAULT_VOTE_PRICE ?? 500),
      published: true,
      archived: false,
      blocked: false,
    },
  });

  await prisma.candidate.upsert({
    where: { eventId_slug: { eventId: event.id, slug: "candidate-1" } },
    update: {},
    create: {
      eventId: event.id,
      name: "Candidate Démo",
      slug: "candidate-1",
      number: 1,
      bio: "Candidate de démonstration créée par le script de seed.",
      status: "APPROVED",
      published: true,
    },
  });

  await prisma.ticket.create({
    data: {
      eventId: event.id,
      name: "Billet standard",
      description: "Accès à la soirée de gala.",
      price: 5000,
      quantity: 100,
    },
  });

  // --- FAQ ---------------------------------------------------------------
  const faqs = [
    {
      question: "Comment voter pour ma candidate préférée ?",
      answer:
        "Rendez-vous sur la page Vote, sélectionnez l'événement et la candidate, choisissez le nombre de votes puis payez via FeexPay.",
      published: true,
      order: 1,
    },
    {
      question: "Comment acheter un billet ?",
      answer:
        "Rendez-vous sur la page Billetterie, sélectionnez l'événement et le type de billet souhaité, puis complétez le paiement.",
      published: true,
      order: 2,
    },
  ];
  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.fAQ.create({ data: faq });
    }
  }

  console.log("Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
