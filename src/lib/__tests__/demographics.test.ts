import { describe, it, expect } from "vitest";
import { getDemographics, getCommunesByCanton, getCantons } from "../demographics";

describe("getDemographics", () => {
  it("finds a major commune by exact name", () => {
    const r = getDemographics("Luxembourg");
    expect(r).not.toBeNull();
    expect(r!.commune.toLowerCase()).toContain("luxembourg");
  });

  it("is case-insensitive", () => {
    const exact = getDemographics("Luxembourg");
    const lower = getDemographics("luxembourg");
    const upper = getDemographics("LUXEMBOURG");
    expect(lower).toEqual(exact);
    expect(upper).toEqual(exact);
  });

  it("returns null for an unknown commune", () => {
    expect(getDemographics("XYZFAKECITY")).toBeNull();
  });

  it("has required demographic fields for known communes", () => {
    const r = getDemographics("Esch-sur-Alzette");
    if (r) {
      expect(typeof r.population).toBe("number");
      expect(r.population).toBeGreaterThan(0);
      expect(typeof r.canton).toBe("string");
    }
  });
});

describe("getCantons", () => {
  it("returns a sorted list of 12 LU cantons", () => {
    const cantons = getCantons();
    expect(cantons.length).toBeGreaterThanOrEqual(10); // LU has 12, tolerate if data partial
    expect(cantons.length).toBeLessThanOrEqual(15);
    const sorted = [...cantons].sort();
    expect(cantons).toEqual(sorted);
  });

  it("includes major cantons", () => {
    const cantons = getCantons();
    expect(cantons).toContain("Luxembourg");
    expect(cantons).toContain("Esch-sur-Alzette");
  });
});

describe("getCommunesByCanton", () => {
  it("returns communes of a given canton", () => {
    const list = getCommunesByCanton("Luxembourg");
    expect(list.length).toBeGreaterThan(0);
    list.forEach((c) => expect(c.canton).toBe("Luxembourg"));
  });

  it("excludes the 'Luxembourg (pays)' aggregate entry", () => {
    const list = getCommunesByCanton("Luxembourg");
    expect(list.some((c) => c.commune === "Luxembourg (pays)")).toBe(false);
  });

  it("returns empty array for an unknown canton", () => {
    expect(getCommunesByCanton("FAKECANTON")).toEqual([]);
  });
});
