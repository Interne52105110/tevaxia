import { describe, expect, it } from "vitest";
import { calculateLatePayment, latePaymentCsv, type LatePayment } from "./late-payment";
const sample = (): LatePayment => ({ debtor: "business", invoice: "INV-1", principal: 2000, fees: 0, reference: "Due 2024-04-11, no partial payment, fees nil", periods: [{ start: "2024-04-12", end: "2024-04-30", rate: 12.5, reference: "Guichet official worked example, first half 2024" }] });
describe("documented late payment interest", () => {
  it("reproduces the official Guichet example using actual days / 365", () => {
    const r = calculateLatePayment(sample()); expect(r.days).toBe(19); expect(r.interest).toBe(13.01); expect(r.total).toBe(2013.01);
  });
  it("counts leap day and includes a single day", () => {
    const s = sample(); s.periods = [{ start: "2024-02-28", end: "2024-03-01", rate: 12.5, reference: "R" }]; expect(calculateLatePayment(s).days).toBe(3);
    s.periods[0].end = s.periods[0].start; expect(calculateLatePayment(s).days).toBe(1);
  });
  it("handles different half-year rates and charges fees only once", () => {
    const s = sample(); s.principal = 36500; s.fees = 40; s.periods = [{ start: "2024-06-30", end: "2024-06-30", rate: 10, reference: "R1" }, { start: "2024-07-01", end: "2024-07-02", rate: 8, reference: "R2" }];
    expect(calculateLatePayment(s)).toMatchObject({ days: 3, interest: 26, total: 36566 });
  });
  it("does not invent interest or fees for explicit zero", () => {
    const s = sample(); s.principal = 0; expect(calculateLatePayment(s)).toMatchObject({ interest: 0, total: 0 });
    s.principal = 2000; s.periods[0].rate = 0; expect(calculateLatePayment(s)).toMatchObject({ interest: 0, total: 2000 });
  });
  it("rejects nonexistent dates, gaps, overlaps and unsplit half-years", () => {
    for (const [start, end] of [["2026-02-30", "2026-03-01"], ["2026-05-02", "2026-05-01"], ["2026-06-30", "2026-07-01"]]) {
      const s = sample(); s.periods[0] = { start, end, rate: 10, reference: "R" }; expect(() => calculateLatePayment(s)).toThrow();
    }
    for (const start of ["2024-04-30", "2024-05-02"]) { const s = sample(); s.periods.push({ start, end: "2024-05-03", rate: 10, reference: "R" }); expect(() => calculateLatePayment(s)).toThrow("continuity"); }
  });
  it("requires sources and valid precision and protects CSV cells", () => {
    for (const patch of [{ principal: NaN }, { principal: -1 }, { fees: Infinity }, { fees: .001 }, { reference: "" }]) expect(() => calculateLatePayment({ ...sample(), ...patch })).toThrow();
    const s = sample(); s.periods[0].rate = 12.34567; expect(() => calculateLatePayment(s)).toThrow();
    s.periods[0].rate = 12.5; s.invoice = '=HYPERLINK("x")'; const csv = latePaymentCsv(s); expect(csv).toContain("'=HYPERLINK"); expect(csv).toContain('"13.01"'); expect(csv).toContain("ACT/365");
  });
});
