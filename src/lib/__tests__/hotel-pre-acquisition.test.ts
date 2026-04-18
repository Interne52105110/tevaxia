import { describe, it, expect } from "vitest";
import { computePreAcquisition, defaultDeal } from "../hotellerie/pre-acquisition";

describe("computePreAcquisition — deal type midscale 60 chambres", () => {
  const d = defaultDeal();
  const r = computePreAcquisition(d);

  it("calcule RevPAR = ADR * occupancy", () => {
    expect(r.current_revpar).toBeCloseTo(135 * 0.68, 2);
  });

  it("revenue rooms = RevPAR * nb * 365", () => {
    const expected = 135 * 0.68 * 60 * 365;
    expect(r.current_total_revenue).toBeCloseTo(expected + 800_000 + 100_000, 0);
  });

  it("GOP = total revenue - opex", () => {
    const opex = 1_100_000 + 220_000 + 720_000;
    expect(r.current_gop).toBeCloseTo(r.current_total_revenue - opex, 0);
  });

  it("EBITDA = GOP - taxe fonciere - FF&E reserve", () => {
    const ffe = r.current_total_revenue * 0.04;
    expect(r.current_ebitda).toBeCloseTo(r.current_gop - 35_000 - ffe, 0);
  });

  it("fair value > 0 et positif", () => {
    expect(r.fair_value).toBeGreaterThan(0);
  });

  it("DSCR année 1 > 1 sur un deal sain", () => {
    expect(r.dscr_year1).toBeGreaterThan(1);
  });

  it("LTV = debt / asking price", () => {
    expect(r.ltv).toBeCloseTo(8_000_000 / 12_000_000, 4);
  });

  it("projection sur 10 ans", () => {
    expect(r.projection).toHaveLength(10);
  });

  it("projection année 1 : revenue > snapshot", () => {
    expect(r.projection[0].total_revenue).toBeGreaterThan(r.current_total_revenue);
  });

  it("exit value > 0", () => {
    expect(r.exit_value).toBeGreaterThan(0);
  });

  it("IRR equity dans intervalle raisonnable [-0.5, 1.0]", () => {
    expect(r.irr_equity).toBeGreaterThan(-0.5);
    expect(r.irr_equity).toBeLessThan(1.0);
  });

  it("score entre 0 et 100", () => {
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("signals contient au moins 5 entrées", () => {
    expect(r.signals.length).toBeGreaterThanOrEqual(5);
  });
});

describe("computePreAcquisition — deal surpayé détecté", () => {
  it("asking 2x fair value → signal prix bad", () => {
    const d = defaultDeal();
    d.asking_price = 30_000_000; // très au-dessus
    const r = computePreAcquisition(d);
    const priceSignal = r.signals.find((s) => s.label === "Prix demandé");
    expect(priceSignal?.status).toBe("bad");
  });
});

describe("computePreAcquisition — DSCR insuffisant", () => {
  it("grosse dette à taux élevé → DSCR < 1.15 warn/bad", () => {
    const d = defaultDeal();
    d.debt = 11_000_000;
    d.debt_rate_pct = 0.075;
    d.debt_term_years = 12;
    const r = computePreAcquisition(d);
    const dscrSignal = r.signals.find((s) => s.label === "DSCR année 1");
    expect(["warn", "bad"]).toContain(dscrSignal?.status);
  });
});
