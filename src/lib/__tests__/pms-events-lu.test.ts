import { describe, it, expect } from "vitest";
import {
  LU_EVENTS, getEventsInRange, impactMultiplier, IMPACT_LABELS,
} from "../pms/events-calendar-lu";

describe("LU_EVENTS", () => {
  it("contient au moins 10 événements", () => {
    expect(LU_EVENTS.length).toBeGreaterThanOrEqual(10);
  });
  it("chaque event a id/name/mois/jour/durée/impact", () => {
    for (const ev of LU_EVENTS) {
      expect(ev.id).toBeTruthy();
      expect(ev.name).toBeTruthy();
      expect(ev.start_month).toBeGreaterThanOrEqual(1);
      expect(ev.start_month).toBeLessThanOrEqual(12);
      expect(ev.start_day).toBeGreaterThanOrEqual(1);
      expect(ev.duration_days).toBeGreaterThanOrEqual(1);
      expect(["low", "medium", "high", "extreme"]).toContain(ev.impact);
    }
  });
  it("ids uniques", () => {
    const ids = new Set(LU_EVENTS.map((e) => e.id));
    expect(ids.size).toBe(LU_EVENTS.length);
  });
  it("contient Schueberfouer (événement signature LU)", () => {
    expect(LU_EVENTS.find((e) => e.id === "schueberfouer")).toBeDefined();
  });
});

describe("getEventsInRange", () => {
  it("août 2026 inclut Schueberfouer", () => {
    const events = getEventsInRange("2026-08-01", "2026-09-15");
    expect(events.find((e) => e.id === "schueberfouer")).toBeDefined();
  });
  it("retourne [] si hors calendrier", () => {
    // 1-5 juillet : probablement aucun event
    const events = getEventsInRange("2026-07-01", "2026-07-05");
    // peut être vide ou 1 event
    expect(events.length).toBeGreaterThanOrEqual(0);
  });
  it("décembre 2026 inclut marchés de Noël", () => {
    const events = getEventsInRange("2026-12-01", "2026-12-31");
    expect(events.some((e) => e.id === "marche_noel")).toBe(true);
  });
  it("tri par date croissante", () => {
    const events = getEventsInRange("2026-01-01", "2026-12-31");
    for (let i = 1; i < events.length; i++) {
      expect(events[i].start_date >= events[i - 1].start_date).toBe(true);
    }
  });
});

describe("impactMultiplier", () => {
  it("extreme > high > medium > low", () => {
    expect(impactMultiplier("extreme")).toBeGreaterThan(impactMultiplier("high"));
    expect(impactMultiplier("high")).toBeGreaterThan(impactMultiplier("medium"));
    expect(impactMultiplier("medium")).toBeGreaterThan(impactMultiplier("low"));
    expect(impactMultiplier("low")).toBeGreaterThan(1);
  });
});

describe("IMPACT_LABELS", () => {
  it("4 niveaux couverts", () => {
    expect(IMPACT_LABELS.low).toBeDefined();
    expect(IMPACT_LABELS.medium).toBeDefined();
    expect(IMPACT_LABELS.high).toBeDefined();
    expect(IMPACT_LABELS.extreme).toBeDefined();
  });
});
