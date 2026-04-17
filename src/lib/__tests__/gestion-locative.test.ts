import { describe, it, expect } from "vitest";
import { analyzeLot, summarize, type RentalLot } from "../gestion-locative";

const mkLot = (p: Partial<RentalLot> = {}): RentalLot => ({
  id: p.id ?? "1",
  name: p.name ?? "Bien test",
  address: p.address,
  commune: p.commune ?? "Luxembourg",
  surface: p.surface ?? 80,
  nbChambres: p.nbChambres ?? 3,
  classeEnergie: p.classeEnergie ?? "D",
  estMeuble: p.estMeuble ?? false,
  prixAcquisition: p.prixAcquisition ?? 500_000,
  anneeAcquisition: p.anneeAcquisition ?? 2018,
  travauxMontant: p.travauxMontant ?? 0,
  travauxAnnee: p.travauxAnnee ?? 2018,
  loyerMensuelActuel: p.loyerMensuelActuel ?? 1_800,
  chargesMensuelles: p.chargesMensuelles ?? 250,
  vacant: p.vacant ?? false,
  createdAt: p.createdAt ?? "2026-01-01",
  updatedAt: p.updatedAt ?? "2026-01-01",
});

describe("analyzeLot", () => {
  it("computes a positive legal ceiling and yield", () => {
    const r = analyzeLot(mkLot());
    expect(r.loyerLegalMensuelMax).toBeGreaterThan(0);
    expect(r.rendementBrutPct).toBeGreaterThan(0);
    expect(r.rendementNetApproximatif).toBeGreaterThanOrEqual(0);
  });

  it("flags legal overage when actual > max", () => {
    const r = analyzeLot(mkLot({ loyerMensuelActuel: 10_000 }));
    expect(r.depasseLegal).toBe(true);
    expect(r.ecartLegalPct).toBeGreaterThan(0);
  });

  it("does not flag overage when actual = max (within tolerance)", () => {
    const base = analyzeLot(mkLot());
    const r = analyzeLot(mkLot({ loyerMensuelActuel: base.loyerLegalMensuelMax * 0.9 }));
    expect(r.depasseLegal).toBe(false);
    expect(r.ecartLegalPct).toBeLessThan(0);
  });

  it("flags class E/F/G as Klimabonus-eligible", () => {
    for (const classe of ["E", "F", "G"] as const) {
      const r = analyzeLot(mkLot({ classeEnergie: classe }));
      expect(r.klimabonusEligible).toBe(true);
      expect(r.klimabonusMessage).toBeTruthy();
    }
  });

  it("does NOT flag class A/B/C/D as Klimabonus-eligible", () => {
    for (const classe of ["A", "B", "C", "D"] as const) {
      const r = analyzeLot(mkLot({ classeEnergie: classe }));
      expect(r.klimabonusEligible).toBe(false);
      expect(r.klimabonusMessage).toBeUndefined();
    }
  });

  it("higher class A yields same or higher legal max vs class G", () => {
    // classes énergétiques n'impactent pas directement le loyer légal mais le rendement oui
    const a = analyzeLot(mkLot({ classeEnergie: "A" }));
    const g = analyzeLot(mkLot({ classeEnergie: "G" }));
    // loyer légal max devrait être identique (pas dépendant de l'énergie)
    expect(a.loyerLegalMensuelMax).toBe(g.loyerLegalMensuelMax);
  });

  it("furnished flag impacts ceiling (typically +10 to +20 %)", () => {
    const nonMeuble = analyzeLot(mkLot({ estMeuble: false }));
    const meuble = analyzeLot(mkLot({ estMeuble: true }));
    expect(meuble.loyerLegalMensuelMax).toBeGreaterThan(nonMeuble.loyerLegalMensuelMax);
  });
});

describe("summarize", () => {
  it("empty portfolio → zeros", () => {
    const s = summarize([]);
    expect(s.nbLots).toBe(0);
    expect(s.loyerMensuelTotal).toBe(0);
    expect(s.capitalTotal).toBe(0);
  });

  it("excludes vacant lots from rent total", () => {
    const s = summarize([
      mkLot({ id: "a", vacant: false, loyerMensuelActuel: 1_500 }),
      mkLot({ id: "b", vacant: true, loyerMensuelActuel: 2_000 }),
    ]);
    expect(s.loyerMensuelTotal).toBe(1_500);
    expect(s.nbVacants).toBe(1);
  });

  it("counts klimabonus-eligible lots", () => {
    const s = summarize([
      mkLot({ id: "a", classeEnergie: "A" }),
      mkLot({ id: "b", classeEnergie: "F" }),
      mkLot({ id: "c", classeEnergie: "G" }),
    ]);
    expect(s.lotsKlimabonus).toBe(2);
  });

  it("counts lots above legal ceiling", () => {
    const s = summarize([
      mkLot({ id: "a", loyerMensuelActuel: 10_000 }),
      mkLot({ id: "b", loyerMensuelActuel: 500 }),
    ]);
    expect(s.lotsHorsPlafond).toBe(1);
  });

  it("computes annual rent = monthly × 12", () => {
    const s = summarize([mkLot({ loyerMensuelActuel: 1_500 })]);
    expect(s.loyerAnnuelTotal).toBe(1_500 * 12);
  });
});
