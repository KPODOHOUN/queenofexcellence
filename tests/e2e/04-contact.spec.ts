import { test, expect, type Page } from "@playwright/test";

/** cf. 03-billetterie.spec.ts : <label> non associé via htmlFor dans ce projet. */
function fieldAfterLabel(page: Page, labelText: string) {
  return page.locator(
    `label:text-is("${labelText}") + div input, label:text-is("${labelText}") + div select, label:text-is("${labelText}") + textarea`
  );
}

test.describe("Visiteur — formulaire de contact", () => {
  test("envoie un message via le formulaire de contact", async ({ page }) => {
    await page.goto("/contact");

    await fieldAfterLabel(page, "Nom complet").fill("Visiteur Test E2E");
    await fieldAfterLabel(page, "Email").fill("contact.e2e@example.com");
    await fieldAfterLabel(page, "Téléphone").fill("+22912345678");
    await fieldAfterLabel(page, "Sujet précis").fill("Candidature");
    await fieldAfterLabel(page, "Votre message").fill(
      "Bonjour, je souhaite obtenir plus d'informations sur la prochaine édition. Merci !"
    );

    await page.getByRole("button", { name: /envoyer/i }).click();

    await expect(page.getByText(/message envoyé/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("bloque l'envoi si le message est trop court (validation minLength)", async ({ page }) => {
    await page.goto("/contact");
    await fieldAfterLabel(page, "Nom complet").fill("Visiteur Test");
    await fieldAfterLabel(page, "Email").fill("court.e2e@example.com");
    await fieldAfterLabel(page, "Votre message").fill("court");
    await page.getByRole("button", { name: /envoyer/i }).click();

    // La validation HTML5 (minLength=10) empêche la soumission : le formulaire reste affiché.
    await expect(page.getByText(/message envoyé/i)).toHaveCount(0);
    await expect(fieldAfterLabel(page, "Votre message")).toBeVisible();
  });
});
