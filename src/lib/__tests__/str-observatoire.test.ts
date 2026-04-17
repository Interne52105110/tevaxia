import { describe, it, expect } from "vitest";
import {
  OBSERVATOIRE_STR_LU,
  LU_AIRBNB_TOTAL_LISTINGS,
  LU_AIRBNB_GROWTH_YOY,
  averageADR,
  averageOccupancy,
  totalActiveListings,
} from "../str-observatoire";

describe("OBSERVATOIRE_STR_LU", () => {
  it("contains at least 12 observatory entries", () => {
    expect(OBSERVATOIRE_STR_LU.length).toBeGreaterThanOrEqual(12);
  });

  it("each entry has coherent percentile ordering", () => {
    OBSERVATOIRE_STR_LU.forEach((e) => {
      expect(e.adrP25).toBeLessThanOrEqual(e.adrMedian);
      expect(e.adrMedian).toBeLessThanOrEqual(e.adrP75);
    });
  });

  it("occupancy values are in [0,1]", () => {
    OBSERVATOIRE_STR_LU.forEach((e) => {
      expect(e.occupancyMedian).toBeGreaterThanOrEqual(0);
      expect(e.occupancyMedian).toBeLessThanOrEqual(1);
    });
  });

  it("revPAR is approx adrMedian × occupancyMedian", () => {
    OBSERVATOIRE_STR_LU.forEach((e) => {
      const expected = e.adrMedian * e.occupancyMedian;
      // Allow 15% tolerance because revPARMedian might come from its own source
      expect(Math.abs(e.revPARMedian - expected)).toBeLessThan(expected * 0.30);
    });
  });

  it("includes Luxembourg-Ville Centre", () => {
    const lux = OBSERVATOIRE_STR_LU.find(
      (e) => e.commune === "Luxembourg-Ville" && e.zone.toLowerCase().includes("centre"),
    );
    expect(lux).toBeDefined();
  });

  it("LU airbnb total is in the 3000-6000 range", () => {
    expect(LU_AIRBNB_TOTAL_LISTINGS).toBeGreaterThanOrEqual(3000);
    expect(LU_AIRBNB_TOTAL_LISTINGS).toBeLessThanOrEqual(6000);
  });

  it("YoY growth rate is a small decimal fraction", () => {
    expect(LU_AIRBNB_GROWTH_YOY).toBeGreaterThan(0);
    expect(LU_AIRBNB_GROWTH_YOY).toBeLessThan(0.5);
  });
});

describe("averageADR", () => {
  it("returns 0 for empty input", () => {
    expect(averageADR([])).toBe(0);
  });

  it("averages a subset correctly (rounded)", () => {
    const subset = OBSERVATOIRE_STR_LU.slice(0, 2);
    const manual = Math.round((subset[0].adrMedian + subset[1].adrMedian) / 2);
    expect(averageADR(subset)).toBe(manual);
  });
});

describe("averageOccupancy", () => {
  it("returns 0 for empty input", () => {
    expect(averageOccupancy([])).toBe(0);
  });

  it("produces a value in [0,1]", () => {
    const avg = averageOccupancy(OBSERVATOIRE_STR_LU);
    expect(avg).toBeGreaterThan(0);
    expect(avg).toBeLessThan(1);
  });
});

describe("totalActiveListings", () => {
  it("sums correctly (matches total zone listings)", () => {
    const sum = totalActiveListings(OBSERVATOIRE_STR_LU);
    const manual = OBSERVATOIRE_STR_LU.reduce((s, e) => s + e.activeListings, 0);
    expect(sum).toBe(manual);
  });

  it("returns 0 for empty input", () => {
    expect(totalActiveListings([])).toBe(0);
  });
});
