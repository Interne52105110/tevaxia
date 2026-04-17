import { describe, it, expect } from "vitest";
import { buildPriceForecast, DEFAULT_SCENARIOS } from "../price-forecast";

describe("buildPriceForecast", () => {
  it("returns series + 3 projections + CAGR", () => {
    const r = buildPriceForecast(7500, 24);
    expect(r.series.length).toBeGreaterThan(24);
    expect(typeof r.cagrHistorical).toBe("number");
    expect(r.basePrice).toBe(7500);
    expect(r.endPessimiste).toBeGreaterThan(0);
    expect(r.endCentral).toBeGreaterThan(0);
    expect(r.endOptimiste).toBeGreaterThan(0);
  });

  it("optimiste > central > pessimiste at horizon", () => {
    const r = buildPriceForecast(7500, 24);
    expect(r.endOptimiste).toBeGreaterThan(r.endCentral);
    expect(r.endCentral).toBeGreaterThan(r.endPessimiste);
  });

  it("negative growth → price decreases", () => {
    const r = buildPriceForecast(10_000, 12, [
      { name: "pessimiste", nameKey: "k", annualGrowthPct: -10, color: "#f00" },
      { name: "central", nameKey: "k", annualGrowthPct: -10, color: "#f00" },
      { name: "optimiste", nameKey: "k", annualGrowthPct: -10, color: "#f00" },
    ]);
    expect(r.endCentral).toBeLessThan(r.basePrice);
  });

  it("zero growth → price stable at horizon", () => {
    const r = buildPriceForecast(8000, 12, [
      { name: "pessimiste", nameKey: "k", annualGrowthPct: 0, color: "#f00" },
      { name: "central", nameKey: "k", annualGrowthPct: 0, color: "#f00" },
      { name: "optimiste", nameKey: "k", annualGrowthPct: 0, color: "#f00" },
    ]);
    expect(Math.abs(r.endCentral - r.basePrice)).toBeLessThan(1);
  });

  it("horizon months determines projection length", () => {
    const r12 = buildPriceForecast(7500, 12);
    const r24 = buildPriceForecast(7500, 24);
    const r48 = buildPriceForecast(7500, 48);
    const p12 = r12.series.filter((p) => p.isProjection).length;
    const p24 = r24.series.filter((p) => p.isProjection).length;
    const p48 = r48.series.filter((p) => p.isProjection).length;
    expect(p12).toBe(12);
    expect(p24).toBe(24);
    expect(p48).toBe(48);
  });

  it("+10 %/an horizon 12 mois ≈ base × 1.10", () => {
    const r = buildPriceForecast(1000, 12, [
      { name: "pessimiste", nameKey: "k", annualGrowthPct: 10, color: "#f00" },
      { name: "central", nameKey: "k", annualGrowthPct: 10, color: "#0f0" },
      { name: "optimiste", nameKey: "k", annualGrowthPct: 10, color: "#00f" },
    ]);
    // Base × (1 + 0.10)^(12/12) = 1100
    expect(r.endCentral).toBeGreaterThanOrEqual(1090);
    expect(r.endCentral).toBeLessThanOrEqual(1110);
  });

  it("historical points have isProjection = false", () => {
    const r = buildPriceForecast(7500, 12);
    const hist = r.series.filter((p) => !p.isProjection);
    expect(hist.length).toBeGreaterThan(0);
    hist.forEach((p) => {
      expect(p.isProjection).toBe(false);
      expect(p.historical).toBeDefined();
    });
  });

  it("labels follow MM/YY format", () => {
    const r = buildPriceForecast(7500, 12);
    r.series.forEach((p) => {
      expect(p.label).toMatch(/^\d{2}\/\d{2}$/);
    });
  });

  it("DEFAULT_SCENARIOS has 3 scenarios sorted pessimiste < central < optimiste", () => {
    expect(DEFAULT_SCENARIOS).toHaveLength(3);
    expect(DEFAULT_SCENARIOS[0].annualGrowthPct).toBeLessThan(DEFAULT_SCENARIOS[1].annualGrowthPct);
    expect(DEFAULT_SCENARIOS[1].annualGrowthPct).toBeLessThan(DEFAULT_SCENARIOS[2].annualGrowthPct);
  });

  it("year/month fields are valid", () => {
    const r = buildPriceForecast(7500, 24);
    r.series.forEach((p) => {
      expect(p.month).toBeGreaterThanOrEqual(1);
      expect(p.month).toBeLessThanOrEqual(12);
      expect(p.year).toBeGreaterThanOrEqual(2015);
      expect(p.year).toBeLessThanOrEqual(2035);
    });
  });
});
