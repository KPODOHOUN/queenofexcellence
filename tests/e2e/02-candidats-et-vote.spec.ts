import { test, expect } from "@playwright/test";

/**
 * Parcours : un visiteur navigue vers les candidates, ouvre un profil,
 * et vote en payant via le sandbox de paiement local (PAYMENTS_DEV_SANDBOX).
 */
test.describe("Visiteur — candidates et vote", () => {
  test("parcourt la liste des candidates et ouvre un profil", async ({ page }) => {
    await page.goto("/candidats");
    await expect(page.getByText(/Candidates/i).first()).toBeVisible();

    const candidateLink = page.locator('a[href*="/candidats/"]').first();
    await expect(candidateLink).toBeVisible();
    await candidateLink.click();
    await expect(page).toHaveURL(/\/candidats\/.+\/.+/);
    await expect(page.getByText(/Votes reçus/i)).toBeVisible();
  });

  test("vote pour une candidate en passant par le sandbox de paiement", async ({ page }) => {
    await page.goto("/candidats/queen-of-excellence-2026/candidate-senior-a");
    await expect(page.getByRole("heading", { name: /Candidate Senior A/i })).toBeVisible();

    const voteCountBefore = await page
      .locator("text=Votes reçus")
      .locator("..")
      .locator("p")
      .nth(1)
      .textContent();

    await page.getByRole("button", { name: "Voter" }).click();

    const modal = page.getByRole("dialog", { name: /Voter pour Candidate Senior A/i });
    await expect(modal).toBeVisible();

    // Choisit le préréglage "5 votes".
    await modal.getByRole("button", { name: "5", exact: true }).click();
    await expect(modal.getByText(/5 ×/)).toBeVisible();

    await modal.getByRole("button", { name: /Payer/ }).click();

    // Redirection vers la page sandbox de paiement local (dev).
    await page.waitForURL(/\/api\/payments\/sandbox\?ref=/);
    await expect(page.getByText(/Sandbox DEV uniquement/i)).toBeVisible();
    await expect(page.getByText(/2\D?500/)).toBeVisible();

    await page.getByRole("link", { name: /Simuler paiement réussi/i }).click();

    // Arrivée sur la page de confirmation du vote.
    await page.waitForURL(/\/vote\/confirmation/);
    await expect(page.getByText(/merci|confirm|succ/i).first()).toBeVisible();

    // Le compteur de votes du candidat a bien augmenté de 5.
    await page.goto("/candidats/queen-of-excellence-2026/candidate-senior-a");
    const voteCountAfter = await page
      .locator("text=Votes reçus")
      .locator("..")
      .locator("p")
      .nth(1)
      .textContent();
    const before = Number((voteCountBefore || "0").replace(/\D/g, ""));
    const after = Number((voteCountAfter || "0").replace(/\D/g, ""));
    expect(after).toBeGreaterThanOrEqual(before + 5);
  });

  test("annule un paiement de vote depuis le sandbox", async ({ page }) => {
    await page.goto("/candidats/queen-of-excellence-2026/candidate-junior-a");
    await page.getByRole("button", { name: "Voter" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: /Payer/ }).click();

    await page.waitForURL(/\/api\/payments\/sandbox\?ref=/);
    await page.getByRole("link", { name: /Annuler/i }).click();

    await page.waitForURL(/\/vote\/confirmation/);
  });

  test("page /vote permet de choisir événement puis candidate puis payer", async ({ page }) => {
    await page.goto("/vote");
    await expect(page.getByText(/par vote/i)).toBeVisible();

    const candidateButton = page.getByRole("button", { name: /Candidate Senior B/i });
    await expect(candidateButton).toBeVisible();
    await candidateButton.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Candidate Senior B/)).toBeVisible();
  });
});
