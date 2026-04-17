import { describe, it, expect } from "vitest";
import { evaluerChecklist, scoreChecklist, type ChecklistInput } from "../evs-checklist";

const EMPTY: ChecklistInput = {
  communeSelectionnee: false,
  surfaceRenseignee: false,
  assetTypeSelectionne: false,
  evsTypeSelectionne: false,
  comparaisonFaite: false,
  nbComparables: 0,
  capitalisationFaite: false,
  dcfFait: false,
  esgEvalue: false,
  classeEnergieRenseignee: false,
  donnesMarcheConsultees: false,
  reconciliationFaite: false,
  scenariosAnalyses: false,
  narrativeGeneree: false,
  mlvCalculee: false,
};

const FULL: ChecklistInput = {
  communeSelectionnee: true,
  surfaceRenseignee: true,
  assetTypeSelectionne: true,
  evsTypeSelectionne: true,
  comparaisonFaite: true,
  nbComparables: 4,
  capitalisationFaite: true,
  dcfFait: true,
  esgEvalue: true,
  classeEnergieRenseignee: true,
  donnesMarcheConsultees: true,
  reconciliationFaite: true,
  scenariosAnalyses: true,
  narrativeGeneree: true,
  mlvCalculee: true,
};

describe("evaluerChecklist", () => {
  it("returns a non-empty list of items with required refs", () => {
    const items = evaluerChecklist(EMPTY);
    expect(items.length).toBeGreaterThan(10);
    items.forEach((i) => {
      expect(i.id).toBeTruthy();
      expect(i.reference).toBeTruthy();
    });
  });

  it("with empty input, all items are unverified", () => {
    const items = evaluerChecklist(EMPTY);
    expect(items.every((i) => !i.verifie)).toBe(true);
  });

  it("with full input, all items are verified", () => {
    const items = evaluerChecklist(FULL);
    expect(items.every((i) => i.verifie)).toBe(true);
  });

  it("min_2_methodes requires at least 2 of {comparaison, cap, dcf}", () => {
    const only1 = evaluerChecklist({ ...EMPTY, comparaisonFaite: true });
    const twoMethods = evaluerChecklist({ ...EMPTY, comparaisonFaite: true, dcfFait: true });
    expect(only1.find((i) => i.id === "min_2_methodes")!.verifie).toBe(false);
    expect(twoMethods.find((i) => i.id === "min_2_methodes")!.verifie).toBe(true);
  });

  it("nb_comparables is verified when >= 3", () => {
    const two = evaluerChecklist({ ...EMPTY, nbComparables: 2 });
    const three = evaluerChecklist({ ...EMPTY, nbComparables: 3 });
    expect(two.find((i) => i.id === "nb_comparables")!.verifie).toBe(false);
    expect(three.find((i) => i.id === "nb_comparables")!.verifie).toBe(true);
  });

  it("categories are all valid enum values", () => {
    const items = evaluerChecklist(FULL);
    const valid = new Set(["identification", "methodes", "esg", "marche", "reconciliation", "rapport"]);
    items.forEach((i) => expect(valid.has(i.categorie)).toBe(true));
  });
});

describe("scoreChecklist", () => {
  it("empty input → 0 % completion, many missing mandatory", () => {
    const items = evaluerChecklist(EMPTY);
    const score = scoreChecklist(items);
    expect(score.pctCompletion).toBe(0);
    expect(score.remplis).toBe(0);
    expect(score.obligatoiresManquants.length).toBeGreaterThan(0);
  });

  it("full input → 100 % completion, 0 missing mandatory", () => {
    const items = evaluerChecklist(FULL);
    const score = scoreChecklist(items);
    expect(score.pctCompletion).toBe(100);
    expect(score.obligatoiresManquants).toHaveLength(0);
  });

  it("partial completion produces intermediate %", () => {
    const partial = evaluerChecklist({ ...EMPTY, communeSelectionnee: true, surfaceRenseignee: true });
    const score = scoreChecklist(partial);
    expect(score.pctCompletion).toBeGreaterThan(0);
    expect(score.pctCompletion).toBeLessThan(100);
    expect(score.remplis).toBe(2);
  });
});
