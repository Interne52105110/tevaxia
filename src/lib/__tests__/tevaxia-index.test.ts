import { describe, it, expect } from "vitest";
import {
  TEVAXIA_INDEX,
  getCurrentIndex,
  getIndexChange,
  interpretIndex,
} from "../tevaxia-index";

describe("TEVAXIA_INDEX", () => {
  it("contains at least 13 quarterly data points", () => {
    expect(TEVAXIA_INDEX.length).toBeGreaterThanOrEqual(13);
  });

  it("starts at Q1 2020 with index close to 100 (base)", () => {
    const first = TEVAXIA_INDEX[0];
    expect(first.quarter).toBe("2020-Q1");
    expect(first.index).toBeGreaterThanOrEqual(80);
    expect(first.index).toBeLessThanOrEqual(120);
  });

  it("returns a current index object via getCurrentIndex", () => {
    const curr = getCurrentIndex();
    expect(curr).toBeDefined();
    expect(typeof curr.index).toBe("number");
    expect(curr.quarter).toBe(TEVAXIA_INDEX[TEVAXIA_INDEX.length - 1].quarter);
  });

  it("getIndexChange(4) returns delta over 4 quarters", () => {
    const change = getIndexChange(4);
    expect(typeof change.pct).toBe("number");
    expect(typeof change.absolute).toBe("number");
  });

  it("interprets index buckets", () => {
    expect(interpretIndex(115).label).toBe("fort");
    expect(interpretIndex(105).label).toBe("équilibré");
    expect(interpretIndex(95).label).toBe("tendu");
    expect(interpretIndex(80).label).toBe("préoccupant");
  });

  it("each point has complete numeric data", () => {
    for (const p of TEVAXIA_INDEX) {
      expect(Number.isFinite(p.prixImmoIndex)).toBe(true);
      expect(Number.isFinite(p.tauxHypo)).toBe(true);
      expect(Number.isFinite(p.icvConstruction)).toBe(true);
      expect(Number.isFinite(p.yieldBrutMoyen)).toBe(true);
      expect(Number.isFinite(p.index)).toBe(true);
    }
  });

  it("quarter strings are chronological", () => {
    for (let i = 1; i < TEVAXIA_INDEX.length; i++) {
      expect(TEVAXIA_INDEX[i].quarter >= TEVAXIA_INDEX[i - 1].quarter).toBe(true);
    }
  });
});
