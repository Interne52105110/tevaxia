import { describe, it, expect } from "vitest";
import {
  calculerCapitalInvesti,
  calculerFraisAcquisition,
  calculerPlusValue,
  calculerLTV,
  calculerMensualite,
  calculerCapaciteEmprunt,
  calculerDSCR,
  getCoefficient,
} from "../calculations";

describe("getCoefficient", () => {
  it("returns correct coefficient for 2020", () => {
    expect(getCoefficient(2020)).toBe(1.95);
  });
  it("returns correct coefficient for 2000", () => {
    expect(getCoefficient(2000)).toBe(3.07);
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
    // 500000 × 1.95 = 975000
    expect(result.prixReevalue).toBe(975000);
    expect(result.capitalInvesti).toBe(975000);
    // Loyer max = 975000 × 5% / 12
    expect(result.loyerMensuelMax).toBeCloseTo(975000 * 0.05 / 12, 0);
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
    // Vétusté = 5 ans × 2% = 10%
    expect(result.decoteVetustePct).toBeCloseTo(0.10);
    expect(result.capitalInvesti).toBeCloseTo(975000 * 0.90, 0);
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
    // Bëllegen Akt = min(80000, 52500) = 52500
    expect(result.creditBellegenAkt).toBe(52500);
    expect(result.droitsApresCredit).toBe(0);
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
      prixCession: 600000,
      anneeCession: 2025,
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
      prixCession: 500000,
      anneeCession: 2025,
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
      prixCession: 600000,
      anneeCession: 2025,
      estResidencePrincipale: false,
      estCouple: false,
    });
    expect(result.typeGain).toBe("cession");
    expect(result.coefficient).toBe(2.33); // Coeff 2010
    // Prix revalorisé = 300000 × 2.33 = 699000
    // Gain brut = 600000 - 699000 = -99000 (négatif = pas d'impôt)
    expect(result.gainImposable).toBe(0);
  });

  it("doubles abatement for couple", () => {
    const result = calculerPlusValue({
      prixAcquisition: 200000,
      anneeAcquisition: 2015,
      prixCession: 600000,
      anneeCession: 2025,
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

describe("calculerCapaciteEmprunt", () => {
  it("calculates borrowing capacity", () => {
    const result = calculerCapaciteEmprunt({
      revenuNetMensuel: 5000,
      chargesMensuelles: 500,
      tauxEndettementMax: 0.40,
      tauxInteret: 0.035,
      dureeAnnees: 25,
    });
    // Mensualité max = 5000 × 40% - 500 = 1500
    expect(result.mensualiteMax).toBe(1500);
    expect(result.capaciteEmprunt).toBeGreaterThan(250000);
    expect(result.capaciteEmprunt).toBeLessThan(350000);
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
