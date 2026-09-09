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
    expect(result.ltvBands).toEqual([]);
    expect(result.regulatoryValue).toBe(false);
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

describe('Residual renovation sensitivity validation',()=>{
 const i={classeActuelle:'E',classeCible:'B',valeurApresRenovation:800000,coutTravauxRenovation:80000,honorairesEtudes:8000,fraisFinancement:3000,margePrudentielle:10,aidesPrevues:0};
 it('uses confirmed grants without silently capping an excessive claim',()=>{expect(calculerResiduelleEnergetique(i).valeurResiduelle).toBe(699900);expect(calculerResiduelleEnergetique({...i,aidesPrevues:40000}).valeurResiduelle).toBe(739900);expect(()=>calculerResiduelleEnergetique({...i,aidesPrevues:100101})).toThrow()});
 it('keeps negative residuals visible and does not infer costs from CPE labels',()=>{expect(calculerResiduelleEnergetique({...i,valeurApresRenovation:50000}).valeurResiduelle).toBe(-50100);expect(calculerResiduelleEnergetique({...i,classeActuelle:'A+',classeCible:'I'})).toEqual(calculerResiduelleEnergetique(i))});
 it('rejects non-finite and negative costs and invalid margin or value',()=>{for(const key of ['coutTravauxRenovation','honorairesEtudes','fraisFinancement','aidesPrevues','margePrudentielle'])for(const n of [-1,NaN,Infinity])expect(()=>calculerResiduelleEnergetique({...i,[key]:n})).toThrow();expect(()=>calculerResiduelleEnergetique({...i,valeurApresRenovation:0})).toThrow();expect(()=>calculerResiduelleEnergetique({...i,margePrudentielle:101})).toThrow()});
});

describe('Annual term and reversion equivalent yield',()=>{
 const i={loyerEnPlace:36000,erv:42000,dureeRestanteBail:5,tauxTerme:0.04,tauxReversion:0.05};
 it('finds the common discount rate rather than confusing it with ERV/value',()=>{const r=calculerTermeReversion(i),y=r.rendementEquivalent;let term=0;for(let n=1;n<=5;n++)term+=36000/(1+y)**n;const reversion=42000/y/(1+y)**5;expect(term+reversion).toBeCloseTo(r.valeur,5);expect(y).toBeGreaterThan(0.04);expect(y).toBeLessThan(0.05);expect(r.rendementReversionnaire).toBeCloseTo(42000/r.valeur,12);expect(Math.abs(y-r.rendementReversionnaire)).toBeGreaterThan(0.0001)});
 it('returns the common input yield and handles immediate reversion and zero passing rent',()=>{expect(calculerTermeReversion({...i,tauxTerme:0.05}).rendementEquivalent).toBeCloseTo(0.05,12);const now=calculerTermeReversion({...i,dureeRestanteBail:0});expect(now.valeurTerme).toBe(0);expect(now.valeur).toBe(840000);expect(now.rendementEquivalent).toBeCloseTo(0.05,12);expect(calculerTermeReversion({...i,loyerEnPlace:0}).rendementEquivalent).toBeCloseTo(0.05,12)});
 it('uses a stable annuity limit at zero and very small term rates',()=>{expect(calculerTermeReversion({...i,tauxTerme:0}).valeurTerme).toBe(180000);expect(calculerTermeReversion({...i,tauxTerme:1e-12}).valeurTerme).toBeCloseTo(180000,4)});
 it('rejects invalid perpetual yields, rents and unsupported fractional annual terms',()=>{for(const patch of [{tauxReversion:0},{tauxReversion:-0.01},{erv:0},{loyerEnPlace:-1},{dureeRestanteBail:2.5},{dureeRestanteBail:101},{tauxTerme:NaN}])expect(()=>calculerTermeReversion({...i,...patch})).toThrow()});
});


describe('DCF terminal income and validation',()=>{
 const input={loyerAnnuelInitial:10000,tauxIndexation:.1,tauxVacance:.1,chargesAnnuelles:2000,tauxProgressionCharges:.2,periodeAnalyse:2,tauxActualisation:.05,tauxCapSortie:.1,fraisCessionPct:.1};
 it('projects terminal rent and expenses independently and discounts the sale at year N',()=>{
  const r=calculerDCF(input);
  // Year 1 = 9000-2000; year 2 = 9900-2400; year 3 = 10890-2880.
  expect(r.cashFlows.map(c=>c.noi)).toEqual([7000,7500]);
  expect(r.noiTerminal).toBeCloseTo(8010,8);expect(r.valeurTerminaleNette).toBeCloseTo(72090,8);
  expect(r.valeurDCF).toBeCloseTo(7000/1.05+(7500+72090)/1.05**2,8);
  expect(r.irr).toBe(.05);
 });
 it('accepts zero discount and keeps exact sensitivity rate coordinates',()=>{const r=calculerDCF({...input,tauxActualisation:0});expect(r.valeurDCF).toBeCloseTo(86590,8);expect(r.irr).toBe(0);expect(r.sensibilite.some(c=>c.tauxActu===0)).toBe(true);const precise=calculerDCF({...input,tauxActualisation:.05555});expect(precise.sensibilite.some(c=>Math.abs(c.tauxActu-5.555)<1e-10)).toBe(true)});
 it('rejects invalid inputs and non-positive income that cannot support exit capitalisation',()=>{for(const patch of [{periodeAnalyse:0},{periodeAnalyse:1.5},{periodeAnalyse:51},{tauxCapSortie:0},{tauxActualisation:-1},{tauxVacance:1.1},{fraisCessionPct:-.1},{chargesAnnuelles:NaN},{loyerAnnuelInitial:-1},{tauxIndexation:-1.1},{chargesAnnuelles:20000}])expect(()=>calculerDCF({...input,...patch})).toThrow()});
 it('does not claim an independent IRR for flows with interim losses',()=>{const r=calculerDCF({...input,chargesAnnuelles:12000,tauxProgressionCharges:-.5});expect(r.cashFlows[0].noi).toBe(-3000);expect(r.irr).toBeNull()});
});


describe('prudential sensitivity guards',()=>{
 const i={valeurMarche:1000000,decoteConjoncturelle:5,decoteCommercialisation:3,decoteSpecifique:2};
 it('keeps adjustments additive and bounds the total without inventing risk weights',()=>{expect(calculerMLV(i).mlv).toBe(900000);expect(calculerMLV({...i,decoteConjoncturelle:95}).mlv).toBe(0);expect(calculerMLV(i).ltvBands).toEqual([])});
 it('rejects invalid values, negative adjustments and totals above 100 percent',()=>{for(const patch of [{valeurMarche:0},{valeurMarche:Infinity},{decoteConjoncturelle:NaN},{decoteSpecifique:-1},{decoteConjoncturelle:96}])expect(()=>calculerMLV({...i,...patch})).toThrow()});
});
