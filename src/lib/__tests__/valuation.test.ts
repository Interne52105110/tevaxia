import { describe, it, expect } from "vitest";
import {
  calculerCapitalisation,
  calculerDCF,
  calculerIRR,
  calculerMLV,
  calculerTermeReversion,
  calculerResiduelleEnergetique,
  calculerComparaison,
  reconcilier,
} from "../valuation";

describe("calculerCapitalisation", () => {
  it("calculates value from NOI and cap rate", () => {
    const result = calculerCapitalisation({
      loyerBrutAnnuel: 36000,
      chargesNonRecuperables: 1800,
      tauxVacance: 0.05,
      provisionGrosEntretien: 0.03,
      assurancePNO: 400,
      fraisGestion: 0.05,
      taxeFonciere: 200,
      tauxCapitalisation: 0.04,
    });
    expect(result.noi).toBeGreaterThan(0);
    expect(result.valeur).toBeGreaterThan(0);
    // Valeur = NOI / 4%
    expect(result.valeur).toBeCloseTo(result.noi / 0.04, 0);
  });

  it("computes reversionary yield when ERV provided", () => {
    const result = calculerCapitalisation({
      loyerBrutAnnuel: 36000,
      chargesNonRecuperables: 1800,
      tauxVacance: 0.05,
      provisionGrosEntretien: 0.03,
      assurancePNO: 400,
      fraisGestion: 0.05,
      taxeFonciere: 200,
      tauxCapitalisation: 0.04,
      ervAnnuel: 42000,
    });
    expect(result.rendementReversionnaire).toBeDefined();
    expect(result.sousLoue).toBe(true);
    expect(result.potentielReversion).toBeGreaterThan(0);
  });

  it("generates sensitivity table", () => {
    const result = calculerCapitalisation({
      loyerBrutAnnuel: 36000,
      chargesNonRecuperables: 0,
      tauxVacance: 0,
      provisionGrosEntretien: 0,
      assurancePNO: 0,
      fraisGestion: 0,
      taxeFonciere: 0,
      tauxCapitalisation: 0.05,
    });
    expect(result.sensibilite.length).toBe(7);
  });
});

describe("calculerIRR", () => {
  it("computes IRR for simple cash flows", () => {
    // Invest 100, get 110 after 1 year = 10% IRR
    const irr = calculerIRR([-100, 110]);
    expect(irr).toBeCloseTo(0.10, 2);
  });

  it("handles multi-year cash flows", () => {
    // Invest 1000, get 400/year for 3 years
    const irr = calculerIRR([-1000, 400, 400, 400]);
    expect(irr).toBeGreaterThan(0.09);
    expect(irr).toBeLessThan(0.11);
  });
});

describe("calculerDCF", () => {
  it("computes DCF with IRR", () => {
    const result = calculerDCF({
      loyerAnnuelInitial: 36000,
      tauxIndexation: 0.02,
      tauxVacance: 0.05,
      chargesAnnuelles: 4000,
      tauxProgressionCharges: 0.02,
      periodeAnalyse: 10,
      tauxActualisation: 0.055,
      tauxCapSortie: 0.045,
      fraisCessionPct: 0.07,
    });
    expect(result.valeurDCF).toBeGreaterThan(0);
    expect(result.irr).toBeGreaterThan(0);
    expect(result.cashFlows.length).toBe(10);
    expect(result.sensibilite.length).toBeGreaterThan(0);
  });
});

describe("calculerMLV", () => {
  it("applies decotes to market value", () => {
    const result = calculerMLV({
      valeurMarche: 1000000,
      decoteConjoncturelle: 5,
      decoteCommercialisation: 3,
      decoteSpecifique: 2,
    });
    // Total décote = 10%
    expect(result.totalDecotesPct).toBe(10);
    expect(result.mlv).toBe(900000);
    expect(result.ratioMLVsurMV).toBeCloseTo(0.90);
    expect(result.ltvBands.length).toBeGreaterThan(0);
  });
});

describe("calculerTermeReversion", () => {
  it("calculates term and reversion", () => {
    const result = calculerTermeReversion({
      loyerEnPlace: 36000,
      erv: 42000,
      dureeRestanteBail: 5,
      tauxTerme: 0.04,
      tauxReversion: 0.05,
    });
    expect(result.valeurTerme).toBeGreaterThan(0);
    expect(result.valeurReversion).toBeGreaterThan(0);
    expect(result.valeur).toBe(result.valeurTerme + result.valeurReversion);
    expect(result.rendementEquivalent).toBeGreaterThan(0);
  });
});

describe("calculerResiduelleEnergetique", () => {
  it("calculates residual energy value", () => {
    const result = calculerResiduelleEnergetique({
      classeActuelle: "E",
      classeCible: "B",
      valeurApresRenovation: 800000,
      coutTravauxRenovation: 80000,
      honorairesEtudes: 8000,
      fraisFinancement: 3000,
      margePrudentielle: 10,
      aidesPrevues: 40000,
    });
    // Coût brut = 80000 + 8000 + 3000 = 91000
    // Marge = 91000 × 10% = 9100
    // Total avec marge = 100100
    // Net après aides = 100100 - 40000 = 60100
    // Valeur résiduelle = 800000 - 60100 = 739900
    expect(result.coutTotalBrut).toBe(91000);
    expect(result.valeurResiduelle).toBeCloseTo(739900, -1);
    expect(result.decoteEnergetiquePct).toBeGreaterThan(0);
  });
});

describe("calculerComparaison", () => {
  it("computes weighted average", () => {
    const result = calculerComparaison([
      { id: "1", adresse: "A", prixVente: 600000, surface: 80, dateVente: "2025-01", ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0, ajustExterieur: 0, ajustParking: 0, ajustDate: 0, ajustAutre: 0, poids: 60 },
      { id: "2", adresse: "B", prixVente: 800000, surface: 80, dateVente: "2025-01", ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0, ajustExterieur: 0, ajustParking: 0, ajustDate: 0, ajustAutre: 0, poids: 40 },
    ], 80);
    // Prix/m2: A=7500, B=10000
    // Pondéré: (7500×60 + 10000×40) / 100 = 8500
    expect(result.prixM2MoyenPondere).toBeCloseTo(8500, 0);
    expect(result.valeurEstimeePonderee).toBeCloseTo(680000, 0);
  });
});

describe("reconcilier", () => {
  it("reconciles multiple methods", () => {
    const result = reconcilier({
      valeurComparaison: 700000,
      poidsComparaison: 50,
      valeurCapitalisation: 680000,
      poidsCapitalisation: 30,
      valeurDCF: 720000,
      poidsDCF: 20,
    });
    // Pondéré: (700k×50 + 680k×30 + 720k×20) / 100 = 698800 — non, recalculons
    // (700000*50 + 680000*30 + 720000*20) / 100 = (35000000+20400000+14400000)/100 = 698000
    expect(result.valeurReconciliee).toBeCloseTo(698000, 0);
    expect(result.methodes.length).toBe(3);
    expect(result.ecartMaxPct).toBeGreaterThan(0);
  });
});
