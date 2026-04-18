import { describe, it, expect } from "vitest";
import {
  computeGroupRevenue, groupFillRate, daysUntilCutoff, cutoffAlert,
  GROUP_STATUS_LABELS, BILLING_MODE_LABELS,
} from "../pms/groups";

describe("computeGroupRevenue", () => {
  it("10 chambres × 2 nuits × 150 EUR = 3000", () => {
    expect(computeGroupRevenue(10, 2, 150)).toBe(3000);
  });
  it("null rate → 0", () => {
    expect(computeGroupRevenue(10, 2, null)).toBe(0);
  });
  it("0 chambres → 0", () => {
    expect(computeGroupRevenue(0, 2, 150)).toBe(0);
  });
});

describe("groupFillRate", () => {
  it("5/10 = 50%", () => {
    expect(groupFillRate(5, 10)).toBe(50);
  });
  it("0/10 = 0%", () => {
    expect(groupFillRate(0, 10)).toBe(0);
  });
  it("10/10 = 100%", () => {
    expect(groupFillRate(10, 10)).toBe(100);
  });
  it("rooms_blocked 0 → 0", () => {
    expect(groupFillRate(5, 0)).toBe(0);
  });
});

describe("daysUntilCutoff", () => {
  it("null cutoff → null", () => {
    expect(daysUntilCutoff(null)).toBeNull();
  });
  it("dans 10 jours → 10", () => {
    const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const d = daysUntilCutoff(future);
    expect(d).toBeGreaterThanOrEqual(9);
    expect(d).toBeLessThanOrEqual(10);
  });
  it("passé → négatif", () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    expect(daysUntilCutoff(past)).toBeLessThan(0);
  });
});

describe("cutoffAlert", () => {
  const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  it("cutoff dépassé → critical", () => {
    expect(cutoffAlert(future(-2), 50).severity).toBe("critical");
  });
  it("dans 2 jours → critical", () => {
    expect(cutoffAlert(future(2), 50).severity).toBe("critical");
  });
  it("dans 5 jours + 50% remplissage → warning", () => {
    expect(cutoffAlert(future(5), 50).severity).toBe("warning");
  });
  it("dans 5 jours + 90% remplissage → info", () => {
    expect(cutoffAlert(future(5), 90).severity).toBe("info");
  });
  it("dans 12 jours → info", () => {
    expect(cutoffAlert(future(12), 50).severity).toBe("info");
  });
  it("dans 30 jours → none", () => {
    expect(cutoffAlert(future(30), 50).severity).toBe("none");
  });
  it("null → none", () => {
    expect(cutoffAlert(null, 50).severity).toBe("none");
  });
});

describe("Constants", () => {
  it("7 status couverts", () => {
    const statuses = ["prospect", "tentative", "confirmed", "partially_booked", "complete", "cancelled", "completed"] as const;
    for (const s of statuses) expect(GROUP_STATUS_LABELS[s]).toBeDefined();
  });
  it("3 billing modes", () => {
    expect(BILLING_MODE_LABELS.master_account).toContain("corporate");
    expect(BILLING_MODE_LABELS.individual).toBeDefined();
    expect(BILLING_MODE_LABELS.split).toBeDefined();
  });
});
