import { test, expect } from "@playwright/test";

/**
 * Parcours : l'administrateur se connecte, consulte le tableau de bord
 * et quelques sections clés, puis se déconnecte.
 */
test.describe("Admin — connexion et tableau de bord", () => {
  test("refuse l'accès au dashboard sans session", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("affiche une erreur avec de mauvais identifiants", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="email"]').fill("mauvais@queenofexcellence.com");
    await page.locator('input[type="password"]').fill("mauvaismotdepasse");
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    await expect(page.getByText(/identifiants incorrects/i)).toBeVisible();
  });

  test("se connecte, parcourt le dashboard, et se déconnecte", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="email"]').fill("admin@queenofexcellence.com");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();

    await page.waitForURL(/\/admin$/);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();

    const sections = [
      "/admin/events",
      "/admin/candidates",
      "/admin/votes",
      "/admin/payments",
      "/admin/tickets",
      "/admin/contacts",
    ];

    for (const path of sections) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} devrait répondre 200`).toBe(200);
      await expect(page).not.toHaveURL(/\/admin\/login/);
    }

    await page.goto("/admin");
    await page.getByRole("button", { name: /déconnexion/i }).click();
    await page.waitForURL(/\/admin\/login/);

    // Vérifie que la session est bien terminée.
    await page.goto("/admin/events");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
