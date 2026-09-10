import { describe, expect, it } from "vitest";
import { inspectionProgress, validInspectionMeta, type InspectionMeta } from "../rental-inspection";

const meta: InspectionMeta = { lotName: "", address: "12 rue de test", bailleur: "Bailleur test", locataire: "Locataire test", type: "entree", date: "2024-02-29" };
describe("rental inspection draft", () => {
  it("accepts an unknown key count without inventing two keys", () => expect(validInspectionMeta(meta, "")).toBe(true));
  it("accepts zero keys as an explicit value", () => expect(validInspectionMeta(meta, "0")).toBe(true));
  it.each(["-1", "1.5", "1000", "NaN", "1e2"])("rejects invalid keys %s", keys => expect(validInspectionMeta(meta, keys)).toBe(false));
  it.each(["", "2026-02-29", "2026-04-31", "invalid"])("rejects invalid dates %s", date => expect(validInspectionMeta({ ...meta, date }, "")).toBe(false));
  it.each(["address", "bailleur", "locataire"] as const)("requires %s", key => expect(validInspectionMeta({ ...meta, [key]: " " }, "")).toBe(false));
  it("does not treat notes alone as an assessment, and counts explicit non-applicable", () => {
    expect(inspectionProgress([{ id: "room", name: "Room", items: [
      { id: "a", label: "A", state: "", notes: "To inspect" },
      { id: "b", label: "B", state: "bon", notes: "" },
      { id: "c", label: "C", state: "non_applicable", notes: "Absent" },
    ] }])).toEqual({ done: 2, total: 3, pct: 67 });
  });
  it("handles an empty checklist", () => expect(inspectionProgress([])).toEqual({ done: 0, total: 0, pct: 0 }));
});
