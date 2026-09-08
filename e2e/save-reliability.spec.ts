import { test, expect } from "@playwright/test";

test("failed local save shows an error and can be retried without losing the calculation", async ({ page }) => {
  await page.goto("/frais-acquisition");
  const button = page.getByRole("button", { name: /^Sauvegarder$/i });
  await expect(button).toBeVisible();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "tevaxia_valuations") {
        Storage.prototype.setItem = original;
        throw new DOMException("Storage full", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
  });
  await button.click();
  await expect(page.getByRole("alert").filter({ hasText: "La sauvegarde a échoué" })).toBeVisible();
  await expect(button).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem("tevaxia_valuations"))).toBeNull();
  await button.click();
  await expect(page.getByRole("alert").filter({ hasText: "La sauvegarde a échoué" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tevaxia_valuations") || "[]").length)).toBe(1);
});

test("transparency identifies its comparison data as synthetic", async ({ page }) => {
  await page.goto("/transparence");
  await expect(page.getByText("Comparaison sur des exemples synthétiques", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Prix de référence", exact: true })).toBeVisible();
});
