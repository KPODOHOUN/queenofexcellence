import { test, expect, type Page } from "@playwright/test";

/**
 * Les champs FormInput/FormSelect du projet n'associent pas <label> et champ
 * via htmlFor/id (cf. src/components/ui/FormField.tsx) : getByLabel ne fonctionne
 * donc pas. On cible le champ juste après son label.
 */
function fieldAfterLabel(page: Page, labelText: string) {
  return page.locator(
    `label:text-is("${labelText}") + div input, label:text-is("${labelText}") + div select, label:text-is("${labelText}") + textarea`
  );
}

/**
 * Parcours : un visiteur achète un billet pour la soirée de gala.
 *
 * NB — constat : contrairement au vote (createVotePayment), l'achat de billet
 * (createTicketPayment, src/lib/payments.ts) ne bascule jamais sur le sandbox
 * de paiement local : si KKiaPay n'est pas configuré, la fonction lève
 * directement une AppError("Paiement indisponible : KKiaPay non configuré.")
 * au lieu de renvoyer un `sandboxUrl` comme le fait le vote. Résultat : en dev
 * local (sans clés KKiaPay), la billetterie est impossible à tester de bout
 * en bout alors que le vote l'est. Ce test documente donc le comportement
 * réel (erreur affichée) plutôt que de masquer cet écart.
 */
test.describe("Visiteur — achat de billet", () => {
  test("sélectionne un billet, remplit ses infos, puis passe au paiement (bac à sable en dev)", async ({ page }) => {
    await page.goto("/billetterie");
    await expect(page.getByText(/Réservez votre place/i)).toBeVisible();

    await fieldAfterLabel(page, "Événement").selectOption({ label: "Queen of Excellence 2026" });

    // .first() = la carte racine (contient aussi les boutons +/-) ; les divs imbriqués
    // correspondant au même filtre de texte n'ont pas les boutons.
    const ticketCard = page.locator("div").filter({ hasText: "Billet standard" }).first();
    await expect(ticketCard).toBeVisible();

    await ticketCard.getByRole("button", { name: "Augmenter" }).click();
    await ticketCard.getByRole("button", { name: "Augmenter" }).click();

    await expect(page.getByText(/^Total$/i)).toBeVisible();

    await fieldAfterLabel(page, "Votre nom").fill("Visiteur Test E2E");
    await fieldAfterLabel(page, "Email").fill("visiteur.e2e@example.com");
    await fieldAfterLabel(page, "Téléphone").fill("+22912345678");

    await page.getByRole("button", { name: /^Payer/ }).click();

    // Sans clés KKiaPay en dev, le paiement passe par le bac à sable local.
    await expect(page).toHaveURL(/\/api\/payments\/sandbox/, { timeout: 15_000 });
  });

  test("affiche une erreur si aucun billet n'est sélectionné", async ({ page }) => {
    await page.goto("/billetterie");
    await fieldAfterLabel(page, "Événement").selectOption({ label: "Queen of Excellence 2026" });
    await expect(page.getByText(/^Total$/i)).toHaveCount(0);
  });
});
