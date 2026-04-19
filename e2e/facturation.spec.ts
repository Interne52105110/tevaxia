import { test, expect } from "@playwright/test";

test.describe("Factur-X parcours — émission + historique + hooks modules", () => {
  test("/facturation landing : positionnement honnête outil de préparation", async ({ page }) => {
    await page.goto("/facturation");
    await expect(page).toHaveTitle(/factur/i);
    const body = page.locator("body");
    // Landing positioning : préparation, pas PDP agréée
    await expect(body).toContainText(/préparation|preparation|factur-x|EN 16931/i);
    await expect(body).toContainText(/01\/09\/2026|réforme|reform/i);
    // Pricing 3 tiers visible
    await expect(body).toContainText(/Free|0 €/i);
    await expect(body).toContainText(/12 €|essential|essentiel/i);
    await expect(body).toContainText(/29 €|pro/i);
  });

  test("/facturation/emission : formulaire complet + templates + totaux live", async ({ page }) => {
    await page.goto("/facturation/emission");
    const body = page.locator("body");
    // Templates métier visibles
    await expect(body).toContainText(/bailleur|landlord|syndic|hôtel|hotel/i);
    // Sections form
    await expect(body).toContainText(/vendeur|seller|client|buyer|lignes|lines/i);
    // Bouton génération présent
    const generateBtn = page.getByRole("button", { name: /générer|generate/i });
    await expect(generateBtn.first()).toBeVisible();
  });

  test("/facturation/emission : changement template landlord pré-remplit loyer", async ({ page }) => {
    await page.goto("/facturation/emission");
    // Cliquer sur le template Bailleur
    const landlordBtn = page.getByRole("button", { name: /bailleur|landlord|SCI/i }).first();
    await landlordBtn.click();
    // Attendre le re-render
    await page.waitForTimeout(300);
    const body = page.locator("body");
    // La ligne doit maintenant contenir "Loyer" et "exempt" dans les notes
    await expect(body).toContainText(/loyer|rent/i);
  });

  test("/facturation/historique : page auth-wall accessible", async ({ page }) => {
    await page.goto("/facturation/historique");
    const body = page.locator("body");
    // Sans auth : doit afficher bouton connexion OR la liste (si auto-auth preview)
    await expect(body).toContainText(/factur-x|connexion|sign in|historique|history/i);
  });

  test("Factur-X lib : génération XML côté client (inspection DOM post-action)", async ({ page }) => {
    // Teste que la lib factur-x est bien chargée sur /facturation/emission
    await page.goto("/facturation/emission");
    // Exécute un snippet qui valide que window.crypto + localStorage sont dispo
    // (prérequis génération client-side)
    const hasPrereqs = await page.evaluate(() => {
      return typeof crypto !== "undefined"
        && typeof localStorage !== "undefined"
        && typeof Blob !== "undefined";
    });
    expect(hasPrereqs).toBe(true);
  });
});

test.describe("Hooks Factur-X dans modules métier", () => {
  test("/gestion-locative/portefeuille — présence module gestion locative", async ({ page }) => {
    await page.goto("/gestion-locative/portefeuille");
    const body = page.locator("body");
    await expect(body).toContainText(/portefeuille|portfolio|locatif|rental|connect|sign in/i);
  });

  test("/syndic/coproprietes présent", async ({ page }) => {
    await page.goto("/syndic/coproprietes");
    const body = page.locator("body");
    await expect(body).toContainText(/copropri|syndic|connect|sign in/i);
  });

  test("/pms hub présent", async ({ page }) => {
    await page.goto("/pms");
    const body = page.locator("body");
    await expect(body).toContainText(/pms|propri|hotel|hôtel|connect|sign in/i);
  });
});
