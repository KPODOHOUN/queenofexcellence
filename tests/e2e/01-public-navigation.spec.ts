import { test, expect } from "@playwright/test";

/**
 * Parcours d'un visiteur qui découvre le site via le menu, page par page.
 */
test.describe("Visiteur — découverte du site", () => {
  test("page d'accueil s'affiche avec la navigation principale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Queen of Excellence|Queen/i);
    await expect(page.getByRole("link", { name: "Voter" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Billetterie" }).first()).toBeVisible();
  });

  const navPages: Array<{ path: string; heading: RegExp }> = [
    { path: "/events", heading: /Événements|Evenements/i },
    { path: "/candidats", heading: /Candidates/i },
    { path: "/galerie", heading: /Galerie/i },
    { path: "/actualites", heading: /Actualit/i },
    { path: "/a-propos", heading: /propos/i },
    { path: "/contact", heading: /Contact/i },
    { path: "/faq", heading: /FAQ|Questions/i },
    { path: "/impact", heading: /Impact/i },
    { path: "/chiffres", heading: /Chiffres/i },
    { path: "/projets", heading: /Projets/i },
    { path: "/billetterie", heading: /Billetterie|r.servez/i },
    { path: "/vote", heading: /Voter|votes/i },
  ];

  for (const { path, heading } of navPages) {
    test(`la page ${path} répond et affiche du contenu`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} devrait répondre 200`).toBe(200);
      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.getByText(heading).first()).toBeVisible();
    });
  }

  test("navigation via le menu desktop d'une page à l'autre", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Candidates", exact: true }).first().click();
    await expect(page).toHaveURL(/\/candidats/);

    await page.getByRole("link", { name: "Galerie", exact: true }).first().click();
    await expect(page).toHaveURL(/\/galerie/);

    await page.getByRole("link", { name: "Contact", exact: true }).first().click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("page 404 pour une URL inexistante", async ({ page }) => {
    const response = await page.goto("/cette-page-n-existe-pas");
    expect(response?.status()).toBe(404);
  });
});
