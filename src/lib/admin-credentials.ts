import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

// Hash factice pour que bcrypt.compare prenne le même temps que l'email existe ou non,
// évitant de révéler par le timing de réponse si un compte existe.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing-safety", 10);

/**
 * Vérifie les identifiants admin avec verrouillage anti-brute-force.
 * Module séparé de src/lib/auth.ts (qui importe NextAuth) pour rester
 * testable sans tirer les dépendances Next.js runtime dans les tests.
 */
export async function verifyAdminCredentials(
  rawEmail: string,
  password: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const email = rawEmail.toLowerCase().trim();

  const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: cutoff } },
  });

  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return null;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  const success = Boolean(admin && valid);

  await prisma.loginAttempt.create({ data: { email, success } });

  if (!success || !admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  };
}
