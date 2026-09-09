import { describe, it, expect, vi } from "vitest";
import { calculerDCFLeases, type Lease } from "../dcf-leases";

const mkLease = (p: Partial<Lease> = {}): Lease => ({
  id: p.id ?? "1",
  locataire: p.locataire ?? "Tenant A",
  surface: p.surface ?? 200,
  loyerAnnuel: p.loyerAnnuel ?? 48_000,
  dateDebut: p.dateDebut ?? "2022-01",
  dateFin: p.dateFin ?? "2028-12",
  dateBreak: p.dateBreak,
  probabiliteRenouvellement: p.probabiliteRenouvellement ?? 80,
  ervM2: p.ervM2 ?? 260,
  indexation: p.indexation ?? 2,
  stepRents: p.stepRents,
  franchiseMois: p.franchiseMois ?? 0,
  fitOutContribution: p.fitOutContribution ?? 0,
  chargesLocataire: p.chargesLocataire ?? 4_000,
});

const BASE_INPUT = {
  leases: [mkLease()],
  periodeAnalyse: 10,
  tauxActualisation: 6.0,
  tauxCapSortie: 5.5,
  fraisCessionPct: 7,
  chargesProprietaireFixe: 12_000,
  vacanceERV: 5,
  dateValeur: "2026-01",
};

describe("calculerDCFLeases — invariants", () => {
  it("single lease → valeurDCF > 0", () => {
    const r = calculerDCFLeases(BASE_INPUT);
    expect(r.valeurDCF).toBeGreaterThan(0);
  });

  it("surfaceTotale = somme des surfaces leases", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ surface: 100 }), mkLease({ id: "2", surface: 150 })],
    });
    expect(r.surfaceTotale).toBe(250);
  });

  it("loyerTotalAnnuel = somme des loyers leases", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ loyerAnnuel: 30_000 }), mkLease({ id: "2", loyerAnnuel: 20_000 })],
    });
    expect(r.loyerTotalAnnuel).toBe(50_000);
  });

  it("WAULT non-négatif", () => {
    const r = calculerDCFLeases(BASE_INPUT);
    expect(r.wault).toBeGreaterThanOrEqual(0);
  });

  it("WAULT diminue quand baux plus courts", () => {
    const longRes = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ dateFin: "2035-12" })],
    });
    const shortRes = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ dateFin: "2027-06" })],
    });
    expect(longRes.wault).toBeGreaterThan(shortRes.wault);
  });

  it("rejects an empty portfolio instead of presenting a valuation",()=>{
    expect(()=>calculerDCFLeases({...BASE_INPUT,leases:[]})).toThrow();
  });

  it("cashFlows a la longueur = periodeAnalyse", () => {
    const r = calculerDCFLeases({ ...BASE_INPUT, periodeAnalyse: 12 });
    expect(r.cashFlows).toHaveLength(12);
  });

  it("cashFlows sont numérotés 1..periodeAnalyse", () => {
    const r = calculerDCFLeases({ ...BASE_INPUT, periodeAnalyse: 5 });
    expect(r.cashFlows.map((c) => c.annee)).toEqual([1, 2, 3, 4, 5]);
  });

  it("NOI actualisé ≤ NOI non-actualisé (car taux > 0)", () => {
    const r = calculerDCFLeases(BASE_INPUT);
    r.cashFlows.forEach((cf) => {
      expect(cf.noiActualise).toBeLessThanOrEqual(cf.noi);
    });
  });

  it("totalNOIActualise = somme des noiActualise", () => {
    const r = calculerDCFLeases(BASE_INPUT);
    const sum = r.cashFlows.reduce((s, cf) => s + cf.noiActualise, 0);
    expect(r.totalNOIActualise).toBeCloseTo(sum, 0);
  });
});

describe("calculerDCFLeases — potentielReversion", () => {
  it("loyer < ERV → reversion positive", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ loyerAnnuel: 40_000, ervM2: 260, surface: 200 })], // ERV = 52 000
    });
    expect(r.potentielReversion).toBeGreaterThan(0);
  });

  it("loyer = ERV → reversion ≈ 0", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ loyerAnnuel: 52_000, ervM2: 260, surface: 200 })], // ERV = 52 000
    });
    expect(Math.abs(r.potentielReversion)).toBeLessThan(0.5);
  });

  it("loyer > ERV → reversion négative", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ loyerAnnuel: 60_000, ervM2: 260, surface: 200 })],
    });
    expect(r.potentielReversion).toBeLessThan(0);
  });
});

describe("calculerDCFLeases — leaseDetails", () => {
  it("leaseDetails contient autant d'entrées que leases", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [mkLease({ id: "a" }), mkLease({ id: "b" }), mkLease({ id: "c" })],
    });
    expect(r.leaseDetails).toHaveLength(3);
  });

  it("leaseDetails pctSurface somme à ~100 %", () => {
    const r = calculerDCFLeases({
      ...BASE_INPUT,
      leases: [
        mkLease({ id: "a", surface: 100 }),
        mkLease({ id: "b", surface: 150 }),
        mkLease({ id: "c", surface: 250 }),
      ],
    });
    const sum = r.leaseDetails.reduce((s, l) => s + l.pctSurface, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe("calculerDCFLeases — discount rate effect", () => {
  it("taux d'actualisation plus élevé → valeur DCF plus faible", () => {
    const low = calculerDCFLeases({ ...BASE_INPUT, tauxActualisation: 4.0 });
    const high = calculerDCFLeases({ ...BASE_INPUT, tauxActualisation: 10.0 });
    expect(low.valeurDCF).toBeGreaterThan(high.valeurDCF);
  });

  it("cap rate de sortie plus bas → valeur terminale plus élevée", () => {
    const low = calculerDCFLeases({ ...BASE_INPUT, tauxCapSortie: 4.0 });
    const high = calculerDCFLeases({ ...BASE_INPUT, tauxCapSortie: 8.0 });
    expect(low.valeurTerminaleBrute).toBeGreaterThan(high.valeurTerminaleBrute);
  });

  it("frais cession plus élevés → valeur terminale nette plus faible", () => {
    const low = calculerDCFLeases({ ...BASE_INPUT, fraisCessionPct: 3 });
    const high = calculerDCFLeases({ ...BASE_INPUT, fraisCessionPct: 12 });
    expect(low.valeurTerminaleNette).toBeGreaterThan(high.valeurTerminaleNette);
  });
});


describe('monthly expected lease cash flows',()=>{
 const lease=mkLease({surface:100,loyerAnnuel:12000,dateDebut:'2026-01',dateFin:'2030-12',indexation:0,ervM2:120,probabiliteRenouvellement:100,chargesLocataire:0});
 const base={leases:[lease],periodeAnalyse:1,tauxActualisation:0,tauxCapSortie:10,fraisCessionPct:0,chargesProprietaireFixe:0,vacanceERV:0,dateValeur:'2026-01'};
 it('prorates a future lease, real rent-free months and one-off fit-out',()=>{
  const r=calculerDCFLeases({...base,leases:[{...lease,dateDebut:'2026-07',dateFin:'2026-12',franchiseMois:2,fitOutContribution:2400}]});
  expect(r.cashFlows[0].loyers).toBe(6000);expect(r.cashFlows[0].franchises).toBe(2000);expect(r.cashFlows[0].fitOut).toBe(2400);
  expect(r.cashFlows[0].fluxNet).toBe(1600);expect(r.valeurDCF).toBe(121600);expect(r.tauxOccupation).toBe(0);expect(r.wault).toBe(0);
  expect(r.monthly.filter(m=>m.fitOut>0).map(m=>m.date)).toEqual(['2026-07']);
 });
 it('uses expected renewal without random draws or an 80% discontinuity',()=>{
  const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw Error('random draw forbidden')});
  try{
   const expired={...lease,dateDebut:'2020-01',dateFin:'2025-12',probabiliteRenouvellement:50};
   const i={...base,vacanceERV:20,leases:[expired]};const r=calculerDCFLeases(i);
   expect(r).toEqual(calculerDCFLeases(i));expect(r.cashFlows[0].loyerBrutEffectif).toBeCloseTo(4800,8);
   const a=calculerDCFLeases({...base,leases:[{...expired,probabiliteRenouvellement:80}]}),b=calculerDCFLeases({...base,leases:[{...expired,probabiliteRenouvellement:79}]});
   expect(a.cashFlows[0].noi-b.cashFlows[0].noi).toBeCloseTo(120,8);
  }finally{random.mockRestore()}
 });
 it('does not turn zero expected rent into a negative notional rental expense',()=>{
  const r=calculerDCFLeases({...base,leases:[lease,{...lease,id:'vacant',dateDebut:'2020-01',dateFin:'2025-12',probabiliteRenouvellement:0}]});
  expect(r.cashFlows[0].loyerVacance).toBe(12000);expect(r.cashFlows[0].noi).toBe(12000);
 });
 it('treats a chosen break month as an explicit exit scenario',()=>{
  const r=calculerDCFLeases({...base,leases:[{...lease,dateBreak:'2026-03',probabiliteRenouvellement:50}]});
  expect(r.cashFlows[0].noi).toBe(7500);expect(r.valeurDCF).toBe(67500);expect(r.wault).toBe(.25);
 });
 it('does not re-index current rent over historical lease years',()=>{
  const r=calculerDCFLeases({...base,periodeAnalyse:2,leases:[{...lease,dateDebut:'2020-01',indexation:10,franchiseMois:3,fitOutContribution:1000}]});
  expect(r.cashFlows[0].noi).toBeCloseTo(12000,8);expect(r.cashFlows[1].noi).toBeCloseTo(13200,8);
  expect(r.cashFlows[0].fitOut).toBe(0);expect(r.cashFlows[0].franchises).toBe(0);
 });
 it('applies future rent steps at their specified lease year',()=>{
  const r=calculerDCFLeases({...base,periodeAnalyse:2,leases:[{...lease,indexation:10,stepRents:[{annee:2,nouveauLoyer:24000}]}]});
  expect(r.cashFlows[0].noi).toBeCloseTo(12000,8);expect(r.cashFlows[1].noi).toBeCloseTo(24000,8);expect(r.fluxTerminal).toBeCloseTo(26400,8);
 });
 it('matches tenant recoveries with expenses and deducts recurring capex in value',()=>{
  const r=calculerDCFLeases({...base,leases:[{...lease,chargesLocataire:1200}],chargesProprietaireFixe:1000,capexAnnuel:1000});
  expect(r.cashFlows[0].chargesRecuperees).toBe(1200);expect(r.cashFlows[0].chargesProprietaire).toBe(2200);
  expect(r.cashFlows[0].noi).toBe(11000);expect(r.cashFlows[0].fluxNet).toBe(10000);expect(r.valeurDCF).toBe(110000);
 });
 it('uses the next forecast year for the terminal base, not premature all-ERV',()=>{
  const r=calculerDCFLeases({...base,leases:[{...lease,ervM2:240}]});expect(r.noiStabilise).toBe(12000);expect(r.valeurDCF).toBe(132000);expect(r.irr).toBeNull();
 });
 it('rejects invalid dates, fractions, rates and lease amounts',()=>{
  for(const patch of [{dateValeur:'2026-13'},{periodeAnalyse:1.5},{tauxCapSortie:0},{tauxActualisation:NaN},{vacanceERV:101},{capexAnnuel:-1}])expect(()=>calculerDCFLeases({...base,...patch})).toThrow();
  for(const patch of [{dateFin:'2025-12'},{dateBreak:'2025-12'},{surface:0},{loyerAnnuel:NaN},{probabiliteRenouvellement:-1},{franchiseMois:1.5},{stepRents:[{annee:1,nouveauLoyer:0},{annee:1,nouveauLoyer:1}]}])expect(()=>calculerDCFLeases({...base,leases:[{...lease,...patch}]})).toThrow();
 });
});
