import { expect, test, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Parcours : l'admin ajoute une actualité, une photo de galerie et le cadre « J'y serai »,
 * puis un visiteur crée et télécharge son visuel.
 */
const fixture = (name: string) => path.join(__dirname, "fixtures", name);

async function login(page: Page) {
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill("admin@queenofexcellence.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.getByRole("button", { name: /connexion|se connecter/i }).click();
  await page.waitForURL(/\/admin$/);
}

test.describe.serial("Contenus et « J'y serai »", () => {
  test("actualité : erreur visible si description courte, puis image affichée sur le site", async ({ page }) => {
    const title = `Actu E2E ${Date.now()}`;
    await login(page);
    await page.goto("/admin/projects", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ajouter" }).click();
    const form = page.locator('form:has(input[placeholder="Titre"])');
    await form.locator('input[placeholder="Titre"]').fill(title);
    await form.locator("textarea").fill("court");
    await form.locator("input[type=file]").setInputFiles(fixture("photo.jpg"));
    await expect(form.getByAltText("Aperçu")).toBeVisible();
    await form.locator("button[type=submit]").click();
    await expect(form.getByRole("alert")).toContainText("10 caractères minimum");

    await form.locator("textarea").fill("Une description assez longue pour être acceptée.");
    await form.locator("button[type=submit]").click();
    await expect(form).toBeHidden();

    await page.goto("/actualites");
    const image = page.getByAltText(title);
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  });

  test("galerie : une image envoyée est acceptée et affichée", async ({ page }) => {
    const title = `Galerie E2E ${Date.now()}`;
    await login(page);
    await page.goto("/admin/gallery", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ajouter" }).click();
    const form = page.locator('form:has(input[placeholder="Titre"])');
    await form.locator('input[placeholder="Titre"]').fill(title);
    await form.locator("input[type=file]").setInputFiles(fixture("photo.jpg"));
    await expect(form.getByAltText("Aperçu")).toBeVisible();
    await form.locator("button[type=submit]").click();
    await expect(form).toBeHidden();

    await page.goto("/galerie");
    await expect(page.getByAltText(title)).toBeVisible();
  });

  test("admin : le cadre « J'y serai » est reconnu et enregistré", async ({ page }) => {
    await login(page);
    await page.goto("/admin/events", { waitUntil: "networkidle" });
    await page.locator("tbody button:has(svg.lucide-pencil)").first().click();
    await expect(page.getByRole("button", { name: "Enregistrer" })).toBeVisible();
    await page.locator("input[type=file]").nth(2).setInputFiles(fixture("cadre.png"));
    await expect(page.getByText("Cadre prêt")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("button", { name: "Enregistrer" })).toBeHidden();
  });

  test("visiteur : ajoute sa photo, recadre, valide et télécharge son visuel", async ({ page }) => {
    await page.goto("/j-y-serai", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/j-y-serai\/.+/);
    await expect(page.getByRole("button", { name: "Ajouter ma photo" })).toBeEnabled();

    await page.locator("input[type=file]").setInputFiles(fixture("photo.jpg"));
    await expect(page.getByText("Recadrez votre photo")).toBeVisible();
    await page.locator("#jy-zoom").fill("2");

    const canvas = page.locator("canvas");
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2 + 30, { steps: 5 });
    await page.mouse.up();

    await page.getByRole("button", { name: "Valider" }).click();
    await expect(page.getByText(/participants? confirmés?/)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Télécharger mon visuel" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^j-y-serai-.+\.jpg$/);
    await expect(page.getByRole("button", { name: "Recadrer" })).toBeVisible();
  });

  test("images : stockées en base et servies sans fichier sur le disque", async ({ page, request }) => {
    await login(page);
    await page.goto("/admin/gallery", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.locator("input[type=file]").setInputFiles(fixture("photo.jpg"));
    const preview = page.getByAltText("Aperçu");
    await expect(preview).toBeVisible();
    const url = new URL((await preview.getAttribute("src"))!, "http://x").pathname;
    expect(existsSync(path.join(process.cwd(), "public", url))).toBe(false);

    const res = await request.get(url);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/jpeg");
    expect(res.headers()["cache-control"]).toContain("immutable");
    expect((await request.get("/uploads/introuvable.jpg")).status()).toBe(404);
  });

  test("admin : import des anciennes images dans la base", async ({ page }) => {
    await login(page);
    await page.goto("/admin/media", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Importer depuis le serveur" }).click();
    await expect(page.getByRole("status")).toContainText("importée(s)");
    await page.getByLabel("Fichiers de sauvegarde").setInputFiles(fixture("photo.jpg"));
    await expect(page.getByRole("status")).toContainText("1 image(s) importée(s)");
    await expect((await page.request.get("/uploads/photo.jpg")).status()).toBe(200);
  });
});
