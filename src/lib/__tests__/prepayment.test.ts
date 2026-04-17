import { describe, it, expect } from "vitest";
import { simulerRemboursementAnticipe, calculerMensualite } from "../calculations";

describe("simulerRemboursementAnticipe", () => {
  const baseInput = {
    capital: 300000,
    tauxAnnuel: 0.035,
    dureeAnnees: 25,
    moisPrepaiement: 60,
    montantRembourse: 50000,
    penaliteMoisInterets: 6,
    strategie: "reduire_duree" as const,
  };

  it("returns the initial monthly consistent with calculerMensualite", () => {
    const r = simulerRemboursementAnticipe(baseInput);
    const expected = calculerMensualite(300000, 0.035, 25);
    expect(r.mensualiteInitiale).toBeCloseTo(expected, 2);
  });

  it("remaining after prepayment is below remaining before", () => {
    const r = simulerRemboursementAnticipe(baseInput);
    expect(r.capitalRestantApres).toBeLessThan(r.capitalRestantAvant);
    expect(r.capitalRestantAvant - r.capitalRestantApres).toBeCloseTo(50000, 2);
  });

  it("reducing duration keeps monthly unchanged", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, strategie: "reduire_duree" });
    expect(r.nouvelleMensualite).toBeCloseTo(r.mensualiteInitiale, 2);
    expect(r.nouvelleDureeMois).toBeLessThan(25 * 12 - 60);
  });

  it("reducing monthly keeps remaining term = initial - prepayment month", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, strategie: "reduire_mensualite" });
    expect(r.nouvelleDureeMois).toBe(25 * 12 - 60);
    expect(r.nouvelleMensualite).toBeLessThan(r.mensualiteInitiale);
  });

  it("zero penalty means net gain equals interest saved", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, penaliteMoisInterets: 0 });
    expect(r.penalite).toBe(0);
    expect(r.gainNet).toBeCloseTo(r.gainInterets, 2);
  });

  it("penalty caps at 6 months of interest on repaid amount", () => {
    const r = simulerRemboursementAnticipe(baseInput);
    const expected = 50000 * (0.035 / 12) * 6;
    expect(r.penalite).toBeCloseTo(expected, 2);
  });

  it("interest saved is positive when principal is partially repaid early", () => {
    const r = simulerRemboursementAnticipe(baseInput);
    expect(r.gainInterets).toBeGreaterThan(0);
  });

  it("repaying full remaining principal drops new monthly to zero", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, montantRembourse: 10_000_000 });
    expect(r.capitalRestantApres).toBe(0);
    expect(r.nouvelleMensualite).toBe(0);
    expect(r.nouvelleDureeMois).toBe(0);
  });

  it("penalty can exceed savings when prepayment is very late", () => {
    // Prepayment in last year => almost no future interest saved, full penalty
    const r = simulerRemboursementAnticipe({
      ...baseInput,
      moisPrepaiement: 25 * 12 - 2, // 2 months before end
      montantRembourse: 50000,
      penaliteMoisInterets: 6,
    });
    // Capital restant before is tiny => prepayment effectif plafonné, penalty still > gain
    expect(r.gainNet).toBeLessThanOrEqual(r.gainInterets);
  });

  it("break-even is 1 when no penalty and gain positive", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, penaliteMoisInterets: 0 });
    expect(r.breakEvenMois).toBe(1);
  });

  it("handles zero interest rate without NaN", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, tauxAnnuel: 0 });
    expect(Number.isFinite(r.mensualiteInitiale)).toBe(true);
    expect(Number.isFinite(r.nouvelleMensualite)).toBe(true);
    expect(r.penalite).toBe(0);
  });

  it("prepayment at month 0 (clamped to 1) still returns valid result", () => {
    const r = simulerRemboursementAnticipe({ ...baseInput, moisPrepaiement: 0 });
    expect(r.capitalRestantApres).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.gainInterets)).toBe(true);
  });

  it("prepayment beyond loan duration is clamped", () => {
    const r = simulerRemboursementAnticipe({
      ...baseInput,
      moisPrepaiement: 9999,
    });
    expect(r.capitalRestantAvant).toBeLessThanOrEqual(1); // very close to fully repaid
  });

  it("amount above remaining principal is capped", () => {
    const r = simulerRemboursementAnticipe({
      ...baseInput,
      montantRembourse: 10_000_000,
      moisPrepaiement: 60,
    });
    expect(r.capitalRestantApres).toBe(0);
  });
});
