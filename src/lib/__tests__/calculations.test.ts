import { describe, it, expect } from "vitest";
import {
  calculerCapitalInvesti,
  calculerFraisAcquisition,
  calculerPlusValue,
  calculerLTV,
  calculerMensualite,
  calculerDSCR,
  getCoefficient,
} from "../calculations";

describe("getCoefficient", () => {
  it("returns correct coefficient for 2020", () => {
    expect(getCoefficient(2020)).toBe(1.15);
  });
  it("returns correct coefficient for 2000", () => {
    expect(getCoefficient(2000)).toBe(1.65);
  });
  it("returns 1 for future years", () => {
    expect(getCoefficient(2030)).toBe(1);
  });
});

describe("calculerCapitalInvesti", () => {
  it("calculates basic capital investi without vetuste", () => {
    const result = calculerCapitalInvesti({
      prixAcquisition: 500000,
      anneeAcquisition: 2020,
      travauxMontant: 0,
      travauxAnnee: 2020,
      anneeBail: 2025,
      surfaceHabitable: 80,
      appliquerVetuste: false,
      tauxVetusteAnnuel: 0.02,
    });
    // 500000 × 1.09 (table 2025) = 545000
    expect(result.prixReevalue).toBe(545000);
    expect(result.capitalInvesti).toBe(545000);
    // Loyer max = 545000 × 5% / 12
    expect(result.loyerMensuelMax).toBeCloseTo(545000 * 0.05 / 12, 0);
  });

  it("applies vetuste when enabled", () => {
    const result = calculerCapitalInvesti({
      prixAcquisition: 500000,
      anneeAcquisition: 2020,
      travauxMontant: 0,
      travauxAnnee: 2020,
      anneeBail: 2025,
      surfaceHabitable: 80,
      appliquerVetuste: true,
      tauxVetusteAnnuel: 0.02,
    });
    // Pas de décote avant quinze ans ; année de construction absente : résultat incomplet.
    expect(result.decoteVetustePct).toBe(0);
    expect(result.donneesCompletes).toBe(false);
    expect(result.capitalInvesti).toBeCloseTo(545000, 0);
  });

  it("handles colocation", () => {
    const result = calculerCapitalInvesti({
      prixAcquisition: 500000,
      anneeAcquisition: 2025,
      travauxMontant: 0,
      travauxAnnee: 2025,
      anneeBail: 2025,
      surfaceHabitable: 100,
      appliquerVetuste: false,
      tauxVetusteAnnuel: 0,
      nbColocataires: 3,
    });
    expect(result.loyerParColocataire).toBeDefined();
    expect(result.loyerParColocataire).toBeCloseTo(result.loyerMensuelMax / 3, 0);
  });
});

describe("calculerFraisAcquisition", () => {
  it("calculates standard acquisition fees", () => {
    const result = calculerFraisAcquisition({
      prixBien: 750000,
      estNeuf: false,
      residencePrincipale: true,
      nbAcquereurs: 2,
    });
    // Droits = 750000 × 7% = 52500
    expect(result.droitsTotal).toBe(52500);
    // Crédit limité par le minimum de perception de 100 €.
    expect(result.creditBellegenAkt).toBe(52400);
    expect(result.droitsApresCredit).toBe(100);
  });

  it("limits Bellegen Akt for single buyer", () => {
    const result = calculerFraisAcquisition({
      prixBien: 750000,
      estNeuf: false,
      residencePrincipale: true,
      nbAcquereurs: 1,
    });
    // Bëllegen Akt max = 40000 pour 1 personne
    expect(result.creditBellegenAkt).toBe(40000);
    expect(result.droitsApresCredit).toBe(52500 - 40000);
  });

  it("no Bellegen Akt without residence principale", () => {
    const result = calculerFraisAcquisition({
      prixBien: 750000,
      estNeuf: false,
      residencePrincipale: false,
      nbAcquereurs: 2,
    });
    expect(result.creditBellegenAkt).toBe(0);
    expect(result.droitsApresCredit).toBe(52500);
  });
});

describe("calculerPlusValue", () => {
  it("exempts residence principale", () => {
    const result = calculerPlusValue({
      prixAcquisition: 400000,
      anneeAcquisition: 2015,
      dateAcquisition: "2015-01-15",
      prixCession: 600000,
      anneeCession: 2025,
      dateCession: "2025-12-15",
      revenuImposable: 50000,
      estResidencePrincipale: true,
      estCouple: false,
    });
    expect(result.typeGain).toBe("exonere");
    expect(result.gainImposable).toBe(0);
  });

  it("detects speculation for short hold", () => {
    const result = calculerPlusValue({
      prixAcquisition: 400000,
      anneeAcquisition: 2024,
      dateAcquisition: "2024-01-15",
      prixCession: 500000,
      anneeCession: 2025,
      dateCession: "2025-12-15",
      revenuImposable: 50000,
      estResidencePrincipale: false,
      estCouple: false,
    });
    expect(result.typeGain).toBe("speculation");
    expect(result.dureeDetention).toBe(1);
  });

  it("applies revaluation for long hold", () => {
    const result = calculerPlusValue({
      prixAcquisition: 300000,
      anneeAcquisition: 2010,
      dateAcquisition: "2010-01-15",
      prixCession: 600000,
      anneeCession: 2025,
      dateCession: "2025-12-15",
      revenuImposable: 50000,
      estResidencePrincipale: false,
      estCouple: false,
    });
    expect(result.typeGain).toBe("cession");
    expect(result.coefficient).toBe(1.26); // 2010 dans la table 2025
    // Prix revalorisé = 300000 × 1.26 = 378000
    // Gain après abattement = 600000 - 378000 - 50000 = 172000
    expect(result.gainImposable).toBe(172000);
  });

  it("doubles abatement for couple", () => {
    const result = calculerPlusValue({
      prixAcquisition: 200000,
      anneeAcquisition: 2015,
      dateAcquisition: "2015-01-15",
      prixCession: 600000,
      anneeCession: 2025,
      dateCession: "2025-12-15",
      revenuImposable: 50000,
      estResidencePrincipale: false,
      estCouple: true,
    });
    expect(result.abattement).toBe(100000); // 100k pour couple
  });
});

describe("calculerLTV", () => {
  it("calculates LTV ratio", () => {
    expect(calculerLTV({ valeurBien: 750000, montantPret: 600000 })).toBeCloseTo(0.80);
  });
  it("handles zero value", () => {
    expect(calculerLTV({ valeurBien: 0, montantPret: 100000 })).toBe(0);
  });
});

describe("calculerMensualite", () => {
  it("calculates monthly payment", () => {
    const m = calculerMensualite(600000, 0.035, 25);
    // ~3000€/mois environ
    expect(m).toBeGreaterThan(2900);
    expect(m).toBeLessThan(3200);
  });
  it("handles zero rate", () => {
    const m = calculerMensualite(600000, 0, 25);
    expect(m).toBe(600000 / (25 * 12));
  });
});

describe("calculerDSCR", () => {
  it("calculates DSCR", () => {
    const dscr = calculerDSCR({
      revenuLocatifAnnuel: 36000,
      chargesAnnuelles: 6000,
      serviceDetteAnnuel: 24000,
    });
    // NOI = 30000, DSCR = 30000/24000 = 1.25
    expect(dscr).toBeCloseTo(1.25);
  });
});


describe('article 102(6) : millésime de liquidation',()=>{
  it('ne réévalue pas un investissement contemporain et utilise chaque tableau annuel',()=>{
    expect(getCoefficient(2026,2026)).toBe(1);
    expect(getCoefficient(2020,2025)).toBe(1.09);
    expect(getCoefficient(2020,2026)).toBe(1.15);
    expect(getCoefficient(2000,2020)).toBe(1.40);
    expect(getCoefficient(1900,2026)).toBe(206.57);
    expect(()=>getCoefficient(2000,2030)).toThrow(RangeError);
  });
});
