import { describe, it, expect, vi } from "vitest";
import { computeEstimatedCommission, mandateDaysRemaining } from "../agency-mandates";

describe("computeEstimatedCommission", () => {
  it("computes 3% of 750000 = 22500", () => {
    expect(computeEstimatedCommission({ prix_demande: 750000, commission_pct: 3 })).toBe(22500);
  });

  it("returns 0 when prix_demande is null", () => {
    expect(computeEstimatedCommission({ prix_demande: null, commission_pct: 3 })).toBe(0);
  });

  it("returns 0 when commission_pct is null", () => {
    expect(computeEstimatedCommission({ prix_demande: 500000, commission_pct: null })).toBe(0);
  });

  it("handles fractional commission", () => {
    expect(computeEstimatedCommission({ prix_demande: 500000, commission_pct: 2.5 })).toBe(12500);
  });
});

describe("mandateDaysRemaining", () => {
  it("returns null for null endDate", () => {
    expect(mandateDaysRemaining(null)).toBe(null);
  });

  it("returns positive for future date", () => {
    const future = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const d = mandateDaysRemaining(future);
    expect(d).not.toBe(null);
    expect(d!).toBeGreaterThanOrEqual(9);
    expect(d!).toBeLessThanOrEqual(10);
  });

  it("returns negative for past date", () => {
    const past = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const d = mandateDaysRemaining(past);
    expect(d).not.toBe(null);
    expect(d!).toBeLessThan(0);
  });

  it("returns ~0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d = mandateDaysRemaining(today);
    expect(d).not.toBe(null);
    expect(Math.abs(d!)).toBeLessThanOrEqual(1);
  });
});
