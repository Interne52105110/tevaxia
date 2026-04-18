import { describe, it, expect } from "vitest";
import { computeSharedRent, autoBalanceShares, type Cotenant } from "../cotenants";

const baseCotenant: Omit<Cotenant, "id" | "share_pct" | "status"> = {
  lot_id: "lot-1",
  user_id: "user-1",
  name: "Test",
  email: null,
  phone: null,
  deposit_amount: 0,
  bail_start: null,
  bail_end: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function makeCotenant(id: string, sharePct: number, status: Cotenant["status"] = "active"): Cotenant {
  return { ...baseCotenant, id, share_pct: sharePct, status };
}

describe("computeSharedRent", () => {
  it("50% of 1500€ = 750€", () => {
    expect(computeSharedRent(1500, 50)).toBe(750);
  });

  it("0% share = 0€", () => {
    expect(computeSharedRent(1500, 0)).toBe(0);
  });

  it("100% share = total rent", () => {
    expect(computeSharedRent(1500, 100)).toBe(1500);
  });

  it("rounds to 2 decimals", () => {
    expect(computeSharedRent(1500, 33.333)).toBeCloseTo(500.0, 0);
  });
});

describe("autoBalanceShares", () => {
  it("distributes 100% equally when all flexible", () => {
    const c1 = makeCotenant("c1", 0);
    const c2 = makeCotenant("c2", 0);
    const c3 = makeCotenant("c3", 0);
    const balanced = autoBalanceShares([c1, c2, c3]);
    expect(balanced["c1"]).toBeCloseTo(33.333, 1);
    expect(balanced["c2"]).toBeCloseTo(33.333, 1);
    expect(balanced["c3"]).toBeCloseTo(33.333, 1);
    const sum = balanced["c1"] + balanced["c2"] + balanced["c3"];
    expect(sum).toBeCloseTo(100, 1);
  });

  it("preserves fixed shares and splits remaining equally", () => {
    const c1 = makeCotenant("c1", 50); // fixed
    const c2 = makeCotenant("c2", 0);  // flexible
    const c3 = makeCotenant("c3", 0);  // flexible
    const balanced = autoBalanceShares([c1, c2, c3]);
    expect(balanced["c1"]).toBe(50);
    expect(balanced["c2"]).toBe(25);
    expect(balanced["c3"]).toBe(25);
  });

  it("ignores 'left' cotenants for auto-balance", () => {
    const c1 = makeCotenant("c1", 0);
    const c2 = makeCotenant("c2", 0);
    const c3 = makeCotenant("c3", 0, "left");
    const balanced = autoBalanceShares([c1, c2, c3]);
    expect(balanced["c1"]).toBe(50);
    expect(balanced["c2"]).toBe(50);
    expect(balanced["c3"]).toBe(0);
  });

  it("returns 0 for all when fixedSum > 100", () => {
    const c1 = makeCotenant("c1", 60);
    const c2 = makeCotenant("c2", 60);
    const c3 = makeCotenant("c3", 0);
    const balanced = autoBalanceShares([c1, c2, c3]);
    expect(balanced["c1"]).toBe(60);
    expect(balanced["c2"]).toBe(60);
    expect(balanced["c3"]).toBe(0);
  });
});
