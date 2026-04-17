import { describe, it, expect } from "vitest";
import {
  getAvailableCommunes,
  getEnergyComparables,
  buildImpactRange,
} from "../energy-comparables";

describe("getAvailableCommunes", () => {
  it("returns a sorted non-empty list of communes", () => {
    const list = getAvailableCommunes();
    expect(list.length).toBeGreaterThan(0);
    const sorted = [...list].sort((a, b) => a.localeCompare(b, "fr"));
    expect(list).toEqual(sorted);
  });

  it("includes the major LU cities", () => {
    const list = getAvailableCommunes().map((c) => c.toLowerCase());
    expect(list).toContain("luxembourg");
  });
});

describe("getEnergyComparables", () => {
  it("returns national averages when commune is null", () => {
    const r = getEnergyComparables(null);
    expect(r.isCommune).toBe(false);
    expect(r.data.adjustments).toBeDefined();
  });

  it("returns national averages for unknown commune", () => {
    const r = getEnergyComparables("UNKNOWN_FAKE_CITY");
    expect(r.isCommune).toBe(false);
  });

  it("returns commune-specific data when match (case-insensitive)", () => {
    const commune = getAvailableCommunes()[0];
    const r1 = getEnergyComparables(commune);
    const r2 = getEnergyComparables(commune.toLowerCase());
    const r3 = getEnergyComparables(commune.toUpperCase());
    expect(r1.isCommune).toBe(true);
    expect(r2.isCommune).toBe(true);
    expect(r3.isCommune).toBe(true);
  });

  it("adjustments has entries for energy classes A..G", () => {
    const r = getEnergyComparables(null);
    const classes = Object.keys(r.data.adjustments);
    expect(classes).toEqual(expect.arrayContaining(["A", "B", "C", "D", "E", "F", "G"]));
  });
});

describe("buildImpactRange", () => {
  it("produces min < central < max for each class", () => {
    const data = getEnergyComparables(null).data;
    const ranges = buildImpactRange(data);
    for (const [classe, range] of Object.entries(ranges)) {
      expect(range.min).toBeLessThanOrEqual(range.central);
      expect(range.central).toBeLessThanOrEqual(range.max);
      expect(["high", "medium", "low"]).toContain(range.confidence);
      expect(range.source).toBeTruthy();
      expect(classe).toMatch(/^[A-I]$/);
    }
  });

  it("spread is at least 2 percentage points", () => {
    const data = getEnergyComparables(null).data;
    const ranges = buildImpactRange(data);
    for (const range of Object.values(ranges)) {
      expect(range.max - range.min).toBeGreaterThanOrEqual(4); // ±2 each side
    }
  });

  it("national source label mentions Observatoire", () => {
    const data = getEnergyComparables(null).data;
    const ranges = buildImpactRange(data);
    const anyRange = Object.values(ranges)[0];
    expect(anyRange.source.toLowerCase()).toMatch(/observatoire|national/);
  });

  it("commune source label includes sampleSize", () => {
    const commune = getAvailableCommunes()[0];
    const data = getEnergyComparables(commune).data;
    const ranges = buildImpactRange(data);
    const anyRange = Object.values(ranges)[0];
    expect(anyRange.source).toMatch(/\d+/); // contains a number (sampleSize)
  });
});
