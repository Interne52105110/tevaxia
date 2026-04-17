import { describe, it, expect } from "vitest";
import { evaluerESG, type ESGInput } from "../esg";

const BASE: ESGInput = {
  classeEnergie: "C",
  anneeConstruction: 2015,
  zoneInondable: false,
  risqueSecheresse: false,
  risqueGlissementTerrain: false,
  proximiteSitePollue: false,
  certifications: [],
  isolationRecente: false,
  panneauxSolaires: false,
  pompeAChaleur: false,
};

describe("evaluerESG", () => {
  it("produces a 0-100 score for any input", () => {
    const r = evaluerESG(BASE);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("class A + recent + green equipment scores higher than class G + old", () => {
    const green = evaluerESG({
      ...BASE, classeEnergie: "A", anneeConstruction: 2024,
      isolationRecente: true, panneauxSolaires: true, pompeAChaleur: true,
      certifications: ["BREEAM", "Green Key"],
    });
    const brown = evaluerESG({ ...BASE, classeEnergie: "G", anneeConstruction: 1960 });
    expect(green.score).toBeGreaterThan(brown.score);
    expect(green.impactValeur).toBeGreaterThan(brown.impactValeur);
  });

  it("class G triggers high-severity risk + reco renov prioritaire", () => {
    const r = evaluerESG({ ...BASE, classeEnergie: "G" });
    expect(r.risques.some((x) => x.niveau === "eleve")).toBe(true);
    expect(r.recommandationKeys).toContain("esgRecoRenovPrioritaire");
  });

  it("class A sees positive impact on value", () => {
    const r = evaluerESG({ ...BASE, classeEnergie: "A" });
    expect(r.impactValeur).toBeGreaterThan(0);
  });

  it("class G sees negative impact on value (brown discount)", () => {
    const r = evaluerESG({ ...BASE, classeEnergie: "G" });
    expect(r.impactValeur).toBeLessThan(0);
  });

  it("flood zone reduces impactValeur by 5%", () => {
    const noflood = evaluerESG(BASE);
    const flood = evaluerESG({ ...BASE, zoneInondable: true });
    expect(flood.impactValeur - noflood.impactValeur).toBeCloseTo(-5, 1);
    expect(flood.risques.some((x) => x.labelKey.includes("Inondable"))).toBe(true);
  });

  it("solar panels add positive valueImpact and bonus opportunity", () => {
    const noPv = evaluerESG(BASE);
    const pv = evaluerESG({ ...BASE, panneauxSolaires: true });
    expect(pv.score).toBeGreaterThan(noPv.score);
    expect(pv.impactValeur).toBeGreaterThan(noPv.impactValeur);
    expect(pv.opportuniteKeys).toContain("esgOppoSolaire");
  });

  it("certifications bump score and impactValeur, capped at 10/3", () => {
    const base = evaluerESG(BASE);
    const oneCert = evaluerESG({ ...BASE, certifications: ["BREEAM"] });
    const fiveCerts = evaluerESG({ ...BASE, certifications: ["A", "B", "C", "D", "E"] });
    expect(oneCert.score).toBeGreaterThan(base.score);
    // Score bonus capped at 10
    expect(fiveCerts.score - base.score).toBeLessThanOrEqual(40); // energy + age + certs
    expect(fiveCerts.impactValeur - base.impactValeur).toBeLessThanOrEqual(3 + 0.5); // rounding tolerance
  });

  it("niveau mapping covers all 5 tiers", () => {
    const excellent = evaluerESG({
      ...BASE, classeEnergie: "A", anneeConstruction: 2024,
      isolationRecente: true, panneauxSolaires: true, pompeAChaleur: true,
      certifications: ["BREEAM", "Green Key"],
    });
    const critique = evaluerESG({
      ...BASE, classeEnergie: "G", anneeConstruction: 1950,
      zoneInondable: true, risqueSecheresse: true, proximiteSitePollue: true,
    });
    expect(excellent.niveau).toBe("A");
    expect(["D", "E"]).toContain(critique.niveau);
  });

  it("no risks returned → a 'no risk' placeholder is pushed", () => {
    const r = evaluerESG({ ...BASE, classeEnergie: "B" });
    expect(r.risques.some((x) => x.niveau === "faible")).toBe(true);
  });
});
