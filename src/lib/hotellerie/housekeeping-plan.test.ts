import { describe, expect, it } from "vitest";
import { calculateHousekeeping, housekeepingCsv, type HousekeepingPlan } from "./housekeeping-plan";
const sample = (): HousekeepingPlan => ({ date: "2026-09-09", reference: "PMS task list, measured times and full payroll costs", availableRooms: 20, checkoutRooms: 10, stayoverRooms: 5, checkoutMinutes: 30, stayoverMinutes: 10, publicMinutes: 50, paidHours: 8, productiveMinutes: 400, hourlyCost: 20, supervisors: 1, supervisorHours: 2, supervisorHourlyCost: 30 });
describe("documented daily housekeeping plan", () => {
  it("uses observed tasks and explicit supervisor costs without an uplift", () => {
    expect(calculateHousekeeping(sample())).toMatchObject({ workloadMinutes: 400, agents: 1, supervisors: 1, agentCost: 160, supervisorCost: 60, totalCost: 220, costPerAvailableRoom: 11, utilizationPct: 100 });
  });
  it("rounds required shifts up while charging the full paid time", () => {
    const s = sample(); s.publicMinutes = 50.01;
    expect(calculateHousekeeping(s)).toMatchObject({ workloadMinutes: 400.01, agents: 2, agentCost: 320, totalCost: 380 });
  });
  it("does not force a supervisor or manufacture ratios when there is no work", () => {
    const s = sample(); s.availableRooms = 0; s.checkoutRooms = 0; s.stayoverRooms = 0; s.publicMinutes = 0; s.supervisors = 0; s.productiveMinutes = 0; s.paidHours = 0;
    expect(calculateHousekeeping(s)).toMatchObject({ agents: 0, supervisors: 0, totalCost: 0, costPerCleanedRoom: null, costPerAvailableRoom: null, utilizationPct: null });
  });
  it("allows common-area work with no rooms and separate explicit supervision", () => {
    const s = sample(); s.availableRooms = 0; s.checkoutRooms = 0; s.stayoverRooms = 0; s.publicMinutes = 50;
    expect(calculateHousekeeping(s)).toMatchObject({ agents: 1, totalCost: 220, costPerCleanedRoom: null, costPerAvailableRoom: null });
  });
  it("rejects impossible capacities, missing references and invalid numbers", () => {
    for (const patch of [{ availableRooms: 14 }, { productiveMinutes: 481 }, { productiveMinutes: 0 }, { paidHours: 25 }, { checkoutMinutes: 0 }, { supervisorHours: 0 }, { hourlyCost: NaN }, { hourlyCost: -1 }, { supervisors: 1.5 }, { publicMinutes: .001 }, { date: "2026-02-30" }, { reference: "" }]) expect(() => calculateHousekeeping({ ...sample(), ...patch })).toThrow();
  });
  it("rounds payroll cents once per role and exports safe source cells", () => {
    const s = sample(); s.paidHours = 8.25; s.hourlyCost = 20.01; s.reference = '=HYPERLINK("x")';
    expect(calculateHousekeeping(s).agentCost).toBe(165.08);
    const csv = housekeepingCsv(s); expect(csv).toContain("'=HYPERLINK"); expect(csv).toContain('"165.08"'); expect(csv).toContain('"EUR/hour employer cost"');
  });
});
