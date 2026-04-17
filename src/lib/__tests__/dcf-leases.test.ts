import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculerDCFLeases, type Lease } from "../dcf-leases";

// DCF uses Math.random pour break options / renouvellement → seed determinist
beforeEach(() => {
  let seed = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    seed += 0.123456789;
    return (seed % 1 + 1) % 1;
  });
});

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

  it("empty leases → zeros (résilience)", () => {
    const r = calculerDCFLeases({ ...BASE_INPUT, leases: [] });
    expect(r.surfaceTotale).toBe(0);
    expect(r.loyerTotalAnnuel).toBe(0);
    expect(r.wault).toBe(0);
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
