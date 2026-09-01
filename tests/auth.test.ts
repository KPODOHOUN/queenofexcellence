import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { verifyAdminCredentials } from "@/lib/admin-credentials";
import { resetDb, createTestAdmin } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("verifyAdminCredentials — verrouillage anti-brute-force", () => {
  it("réussit avec les bons identifiants", async () => {
    await createTestAdmin("admin@test.com", "correct-password");

    const result = await verifyAdminCredentials("admin@test.com", "correct-password");

    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@test.com");
  });

  it("échoue avec un mauvais mot de passe et journalise une tentative échouée", async () => {
    await createTestAdmin("admin@test.com", "correct-password");

    const result = await verifyAdminCredentials("admin@test.com", "wrong-password");

    expect(result).toBeNull();
    const attempts = await prisma.loginAttempt.findMany({ where: { email: "admin@test.com" } });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].success).toBe(false);
  });

  it("échoue pour un email inexistant sans planter", async () => {
    const result = await verifyAdminCredentials("nobody@test.com", "whatever");
    expect(result).toBeNull();
  });

  it("verrouille après 5 échecs même avec le bon mot de passe ensuite", async () => {
    await createTestAdmin("admin@test.com", "correct-password");

    for (let i = 0; i < 5; i++) {
      const result = await verifyAdminCredentials("admin@test.com", "wrong-password");
      expect(result).toBeNull();
    }

    const lockedOut = await verifyAdminCredentials("admin@test.com", "correct-password");
    expect(lockedOut).toBeNull();
  });

  it("autorise toujours la connexion avant d'atteindre le seuil de verrouillage", async () => {
    await createTestAdmin("admin@test.com", "correct-password");

    for (let i = 0; i < 4; i++) {
      await verifyAdminCredentials("admin@test.com", "wrong-password");
    }

    const result = await verifyAdminCredentials("admin@test.com", "correct-password");
    expect(result).not.toBeNull();
  });

  it("le verrouillage est propre à chaque email", async () => {
    await createTestAdmin("admin@test.com", "correct-password");
    await createTestAdmin("other@test.com", "other-password");

    for (let i = 0; i < 5; i++) {
      await verifyAdminCredentials("admin@test.com", "wrong-password");
    }

    const otherStillWorks = await verifyAdminCredentials("other@test.com", "other-password");
    expect(otherStillWorks).not.toBeNull();
  });
});
