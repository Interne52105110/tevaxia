import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock globalThis.fetch pour éviter les appels réseau réels à data-api.ecb.europa.eu
// (tests déterministes, rapides, et ne dépendent pas de la disponibilité de l'API BCE).
// Le code lib/ecb-rates retombe gracieusement sur le FALLBACK quand fetch échoue.

const originalFetch = globalThis.fetch;

beforeAll(() => {
  // Simule une erreur réseau → déclenche le fallback côté lib
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("mocked network failure"));
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("ECB rates module", () => {
  it("exports the expected functions", async () => {
    const mod = await import("../ecb-rates");
    expect(typeof mod.getECBRates).toBe("function");
    expect(typeof mod.fetchECBRatesClient).toBe("function");
    expect(typeof mod.fetchEuriborHistory).toBe("function");
  });

  it("fetchECBRatesClient returns valid structure (fallback path)", async () => {
    const { fetchECBRatesClient } = await import("../ecb-rates");
    const rates = await fetchECBRatesClient();
    // En environnement de test (fetch mocké en erreur), on reçoit le fallback
    expect(rates).toHaveProperty("mainRefi");
    expect(rates).toHaveProperty("depositFacility");
    expect(rates).toHaveProperty("marginalLending");
    expect(rates).toHaveProperty("lastUpdate");
    expect(rates).toHaveProperty("live");
    expect(typeof rates.mainRefi).toBe("number");
    expect(typeof rates.depositFacility).toBe("number");
    expect(rates.mainRefi).toBeGreaterThan(0);
    expect(rates.depositFacility).toBeGreaterThan(0);
    expect(rates.live).toBe(false); // fallback = live:false
  });

  it("deposit facility <= main refi rate", async () => {
    const { fetchECBRatesClient } = await import("../ecb-rates");
    const rates = await fetchECBRatesClient();
    expect(rates.depositFacility).toBeLessThanOrEqual(rates.mainRefi);
  });

  it("fetchEuriborHistory returns array (empty on network failure)", async () => {
    const { fetchEuriborHistory } = await import("../ecb-rates");
    const history = await fetchEuriborHistory(3);
    expect(Array.isArray(history)).toBe(true);
    // Avec fetch mocké en erreur et pas de cache → tableau vide
    expect(history.length).toBe(0);
  });
});
