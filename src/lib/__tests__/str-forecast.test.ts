import { describe, it, expect } from "vitest";
import {
  parseStrCsv,
  sortedMonthly,
  buildStrForecast,
  generateStrSeed,
  type StrMonthlyMetric,
} from "../str-forecast";

describe("parseStrCsv", () => {
  it("parses YYYY-MM with decimal occupancy", () => {
    const csv = "2025-01,0.62,125\n2025-02,0.68,130";
    const out = parseStrCsv(csv);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ year: 2025, month: 1, occupancy: 0.62, adr: 125 });
  });

  it("normalizes percent occupancy > 1", () => {
    const out = parseStrCsv("2025-03,72,140");
    expect(out[0].occupancy).toBeCloseTo(0.72);
  });

  it("ignores malformed dates and headers", () => {
    const out = parseStrCsv("year,occ,adr\n2025-01,0.6,120\nbad,bad,bad\n2025-02,0.7,130");
    expect(out).toHaveLength(2);
  });

  it("accepts optional nights column", () => {
    const out = parseStrCsv("2025-04,0.80,150,24");
    expect(out[0].nights).toBe(24);
  });

  it("rejects month out of range", () => {
    const out = parseStrCsv("2025-13,0.5,100\n2025-00,0.5,100");
    expect(out).toHaveLength(0);
  });
});

describe("sortedMonthly", () => {
  it("orders by year then month", () => {
    const rows: StrMonthlyMetric[] = [
      { year: 2025, month: 6, occupancy: 0.7, adr: 140, nights: 21 },
      { year: 2024, month: 12, occupancy: 0.55, adr: 110, nights: 17 },
      { year: 2025, month: 1, occupancy: 0.58, adr: 115, nights: 18 },
    ];
    const sorted = sortedMonthly(rows);
    expect(sorted[0]).toMatchObject({ year: 2024, month: 12 });
    expect(sorted[2]).toMatchObject({ year: 2025, month: 6 });
  });
});

describe("generateStrSeed", () => {
  it("produces the requested number of months", () => {
    const seed = generateStrSeed(0.6, 120, 18);
    expect(seed).toHaveLength(18);
  });

  it("occupancy stays in [0, 1]", () => {
    const seed = generateStrSeed(0.9, 200, 24);
    seed.forEach((m) => {
      expect(m.occupancy).toBeGreaterThanOrEqual(0);
      expect(m.occupancy).toBeLessThanOrEqual(1);
    });
  });

  it("shows higher ADR in summer months than winter", () => {
    const seed = generateStrSeed(0.65, 130, 120); // 10 ans pour moyenne
    const julAdr = seed.filter((m) => m.month === 7).reduce((s, v) => s + v.adr, 0);
    const janAdr = seed.filter((m) => m.month === 1).reduce((s, v) => s + v.adr, 0);
    expect(julAdr).toBeGreaterThan(janAdr);
  });
});

describe("buildStrForecast", () => {
  it("returns null with too few months", () => {
    const r = buildStrForecast([{ year: 2026, month: 1, occupancy: 0.6, adr: 120, nights: 18 }], 12);
    expect(r).toBeNull();
  });

  it("produces 12-month horizon with historical + forecast", () => {
    const seed = generateStrSeed(0.65, 130, 24);
    const r = buildStrForecast(seed, 12);
    expect(r).not.toBeNull();
    expect(r!.historical).toHaveLength(24);
    expect(r!.forecast).toHaveLength(12);
    expect(r!.confidence).toBe("high");
  });

  it("marks confidence medium for 12-23 months", () => {
    const seed = generateStrSeed(0.65, 130, 15);
    const r = buildStrForecast(seed, 12);
    expect(r!.confidence).toBe("medium");
  });

  it("marks confidence low for <12 months", () => {
    const seed = generateStrSeed(0.65, 130, 8);
    const r = buildStrForecast(seed, 6);
    expect(r!.confidence).toBe("low");
  });

  it("forecast months are correctly chained from last historical month", () => {
    const seed: StrMonthlyMetric[] = [];
    for (let y = 2024; y <= 2025; y++) {
      for (let m = 1; m <= 12; m++) {
        seed.push({ year: y, month: m, occupancy: 0.7, adr: 130, nights: 20 });
      }
    }
    const r = buildStrForecast(seed, 6);
    expect(r!.forecast[0]).toMatchObject({ year: 2026, month: 1 });
    expect(r!.forecast[5]).toMatchObject({ year: 2026, month: 6 });
  });

  it("MAPE is a finite non-negative percentage", () => {
    const seed = generateStrSeed(0.65, 130, 24);
    const r = buildStrForecast(seed, 12);
    expect(Number.isFinite(r!.mape.revenue)).toBe(true);
    expect(r!.mape.revenue).toBeGreaterThanOrEqual(0);
  });

  it("confidence bands are non-negative and clamp occupancy ≤ 1", () => {
    const seed = generateStrSeed(0.9, 250, 24);
    const r = buildStrForecast(seed, 12);
    r!.forecast.forEach((p) => {
      expect(p.occupancy).toBeLessThanOrEqual(1);
      expect(p.occupancy).toBeGreaterThanOrEqual(0);
      expect(p.lowerRevenue).toBeGreaterThanOrEqual(0);
      expect(p.upperRevenue).toBeGreaterThanOrEqual(p.lowerRevenue);
    });
  });
});
