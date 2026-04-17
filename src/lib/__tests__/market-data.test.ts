import { describe, it, expect } from "vitest";
import {
  rechercherCommune,
  getMarketDataCommune,
  getAllCommunes,
  getCommunesParCanton,
  suggestComparables,
} from "../market-data";

describe("rechercherCommune", () => {
  it("returns empty for short queries", () => {
    expect(rechercherCommune("")).toEqual([]);
    expect(rechercherCommune("a")).toEqual([]);
  });

  it("finds Luxembourg by exact name", () => {
    const r = rechercherCommune("Luxembourg");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].commune.commune.toLowerCase()).toContain("luxembourg");
  });

  it("is case-insensitive", () => {
    const lower = rechercherCommune("luxembourg").length;
    const upper = rechercherCommune("LUXEMBOURG").length;
    expect(lower).toBe(upper);
  });

  it("matches on quartier when applicable", () => {
    const r = rechercherCommune("Belair");
    // Belair est un quartier de Luxembourg-Ville
    if (r.length > 0) {
      expect(r.some((x) => x.isLocalite || x.quartier)).toBe(true);
    }
  });

  it("returns no results for gibberish", () => {
    const r = rechercherCommune("XYZFAKE_BLAH");
    expect(r).toEqual([]);
  });
});

describe("getMarketDataCommune", () => {
  it("finds a known commune case-insensitive", () => {
    const c = getMarketDataCommune("luxembourg");
    expect(c).toBeDefined();
  });

  it("returns undefined for unknown commune", () => {
    expect(getMarketDataCommune("FAKE_COMMUNE")).toBeUndefined();
  });
});

describe("getAllCommunes", () => {
  it("returns a non-empty sorted list", () => {
    const list = getAllCommunes();
    expect(list.length).toBeGreaterThan(50); // LU a 100 communes, on en a beaucoup
    const sorted = [...list].sort();
    expect(list).toEqual(sorted);
  });
});

describe("getCommunesParCanton", () => {
  it("groups communes by canton", () => {
    const map = getCommunesParCanton();
    expect(Object.keys(map).length).toBeGreaterThan(5);
    Object.values(map).forEach((arr) => {
      expect(arr.length).toBeGreaterThan(0);
    });
  });

  it("Luxembourg canton contains Luxembourg commune", () => {
    const map = getCommunesParCanton();
    expect(map["Luxembourg"]).toContain("Luxembourg");
  });
});

describe("suggestComparables", () => {
  it("returns at most nbMax comparables", () => {
    const r = suggestComparables("Luxembourg", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  it("returns empty for unknown commune", () => {
    expect(suggestComparables("FAKE_COMMUNE", 5)).toEqual([]);
  });

  it("each suggestion has commune, prixM2, source", () => {
    const r = suggestComparables("Luxembourg", 5);
    r.forEach((s) => {
      expect(s.commune).toBeTruthy();
      expect(typeof s.prixM2).toBe("number");
      expect(s.prixM2).toBeGreaterThan(0);
      expect(s.source).toBeTruthy();
    });
  });
});
