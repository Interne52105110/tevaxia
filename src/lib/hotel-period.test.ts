import { describe, expect, it } from "vitest";
import { prepareHotelPeriod } from "./hotel-period";
const base = { period_start: "2026-01-01", period_end: "2026-03-31", notes: "Accounts Q1; EUR excluding VAT; signed report 2026-04-02" };
describe("saved hotel periods", () => {
  it("keeps unknown values unknown and never invents profit or a reserve", () => {
    const p = prepareHotelPeriod(base, "hotel");
    expect(p.revenue_total).toBeNull(); expect(p.gop).toBeNull(); expect(p.ebitda).toBeNull(); expect(p.ffe_reserve).toBeNull(); expect(p.revpar).toBeNull();
  });
  it("preserves explicit zero and losses without dividing by zero", () => {
    const p = prepareHotelPeriod({ ...base, occupancy: 0, adr: 100, revenue_rooms: 0, revenue_fb: 0, revenue_mice: 0, revenue_other: 0, gop: -20, ebitda: -30, ffe_reserve: 0 }, "hotel");
    expect(p.revenue_total).toBe(0); expect(p.revpar).toBe(0); expect(p.gop).toBe(-20); expect(p.ebitda).toBe(-30); expect(p.ffe_reserve).toBe(0); expect(p.gop_margin).toBeNull(); expect(p.ebitda_margin).toBeNull();
  });
  it("sums cents, derives only commercial KPIs and declared result margins", () => {
    const p = prepareHotelPeriod({ ...base, revenue_rooms: 0.1, revenue_fb: 0.2, revenue_mice: 0, revenue_other: 0, adr: 110.25, occupancy: 0.625, gop: -0.15, ebitda: -0.3, ffe_reserve: 7 }, "hotel");
    expect(p.revenue_total).toBe(0.3); expect(p.revpar).toBe(68.91); expect(p.gop_margin).toBe(-0.5); expect(p.ebitda_margin).toBe(-1); expect(p.ffe_reserve).toBe(7);
  });
  it("requires all revenue components and ignores stale derived values", () => {
    const p = prepareHotelPeriod({ ...base, revenue_rooms: 200, revenue_fb: 0, revenue_mice: 0, revenue_total: 999, revpar: 99, gop_margin: .8 }, "hotel");
    expect(p.revenue_total).toBeNull(); expect(p.revpar).toBeNull(); expect(p.gop_margin).toBeNull();
  });
  it("rejects invalid or excessive periods and accepts a leap year", () => {
    for (const [start, end] of [["2026-02-30", "2026-03-31"], ["2026-04-01", "2026-03-31"], ["2025-01-01", "2026-01-02"]]) expect(() => prepareHotelPeriod({ ...base, period_start: start, period_end: end }, "hotel")).toThrow("periodDates");
    expect(prepareHotelPeriod({ ...base, period_start: "2024-01-01", period_end: "2024-12-31" }, "hotel").period_end).toBe("2024-12-31");
  });
  it("rejects invalid precision, nonfinite, out of range and missing sources", () => {
    for (const patch of [{ adr: NaN }, { adr: Infinity }, { adr: -.01 }, { adr: 1.001 }, { occupancy: 1.01 }, { occupancy: .12345 }, { mpi: -1 }, { ebitda: 1e10 }]) expect(() => prepareHotelPeriod({ ...base, ...patch }, "hotel")).toThrow("periodNumbers");
    for (const notes of ["", "  ", "x".repeat(3001)]) expect(() => prepareHotelPeriod({ ...base, notes }, "hotel")).toThrow("periodReference");
  });
});
