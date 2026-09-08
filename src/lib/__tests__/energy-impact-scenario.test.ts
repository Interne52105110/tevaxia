import { describe, expect, it } from "vitest";
import { calculateEnergyImpactScenario as calc, EXAMPLE_ENERGY_HYPOTHESES as example, ENERGY_CLASSES } from "../energy-impact-scenario";
describe("Energy value sensitivity", () => {
  it("rebases the existing value before applying a target coefficient", () => {
    const result = calc(750000, "I", example);
    expect(result.valeurBase).toBe(1000000);
    expect(result.classes[0].valeurAjustee).toBe(1080000);
    expect(result.classes[0].delta).toBe(330000);
  });
  it("keeps the declared current value and zero delta exactly", () => {
    for (const c of ENERGY_CLASSES) {
      const row = calc(123456.78, c, example).classes.find(r => r.classe === c)!;
      expect(row.valeurAjustee).toBe(123456.78);
      expect(row.delta).toBe(0);
    }
  });
  it("does not claim statistical sources", () => expect(calc(100000, "D", example).sources).toEqual([]));
  it("preserves negative effects and allows neutral hypotheses", () => {
    expect(calc(100000, "A", example).classes[8].delta).toBeLessThan(0);
    const neutral = Object.fromEntries(ENERGY_CLASSES.map(c => [c, 0])) as typeof example;
    expect(calc(100000, "A", neutral).classes.every(c => c.delta === 0)).toBe(true);
  });
  it("rejects invalid values, coefficients and a nonzero reference", () => {
    for (const value of [0, -1, NaN, Infinity, 100000001]) expect(() => calc(value, "D", example)).toThrow();
    for (const A of [-100, -90.01, 100.01, NaN, Infinity]) expect(() => calc(100000, "D", { ...example, A })).toThrow();
    expect(() => calc(100000, "D", { ...example, D: 1 })).toThrow();
  });
});
