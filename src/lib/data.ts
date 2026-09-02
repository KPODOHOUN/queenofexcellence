import { prisma } from "@/lib/prisma";

export async function getSiteStats() {
  try {
    const [eventCount, candidateCount, voteCount, supporterCount, ticketSold] =
      await Promise.all([
        prisma.event.count({ where: { published: true, archived: false } }),
        prisma.candidate.count({
          where: { published: true, status: "APPROVED" },
        }),
        prisma.vote.aggregate({
          where: { status: "PAID" },
          _sum: { voteCount: true },
        }),
        prisma.payment
          .findMany({
            where: {
              status: "PAID",
              type: "VOTE",
              customerEmail: { not: null },
            },
            select: { customerEmail: true },
            distinct: ["customerEmail"],
          })
          .then((rows) => rows.length),
        prisma.ticketOrder.count({ where: { status: "PAID" } }),
      ]);

    return {
      events: eventCount,
      candidates: candidateCount,
      votes: voteCount._sum.voteCount ?? 0,
      supporters: supporterCount,
      ticketsSold: ticketSold,
    };
  } catch (error) {
    console.error("getSiteStats:", error);
    return {
      events: 0,
      candidates: 0,
      votes: 0,
      supporters: 0,
      ticketsSold: 0,
    };
  }
}

export async function getSiteContent(key: string) {
  try {
    const content = await prisma.siteContent.findUnique({ where: { key } });
    if (!content) return null;
    try {
      return JSON.parse(content.value);
    } catch {
      return content.value;
    }
  } catch (error) {
    console.error(`getSiteContent("${key}"):`, error);
    return null;
  }
}

export async function setSiteContent(key: string, value: unknown) {
  const stringValue =
    typeof value === "string" ? value : JSON.stringify(value);
  return prisma.siteContent.upsert({
    where: { key },
    update: { value: stringValue },
    create: { key, value: stringValue },
  });
}

export async function getAdminStats() {
  const [
    revenue,
    eventCount,
    candidateCount,
    voteCount,
    ticketSold,
    recentPayments,
    recentActivity,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.event.count(),
    prisma.candidate.count(),
    prisma.vote.aggregate({
      where: { status: "PAID" },
      _sum: { voteCount: true },
    }),
    prisma.ticketOrder.count({ where: { status: "PAID" } }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { event: { select: { name: true } } },
    }),
    prisma.vote.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { select: { name: true } },
        event: { select: { name: true } },
      },
    }),
  ]);

  return {
    revenue: revenue._sum.amount ?? 0,
    events: eventCount,
    candidates: candidateCount,
    votes: voteCount._sum.voteCount ?? 0,
    ticketsSold: ticketSold,
    recentPayments,
    recentActivity,
  };
}
