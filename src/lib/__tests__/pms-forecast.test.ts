import { describe, it, expect } from "vitest";
import { pickupRatePerDay, projectOccupancy, forecastAlert } from "../pms/forecast";

describe("pickupRatePerDay", () => {
  it("300 room nights / 30 jours = 10/jour", () => {
    expect(pickupRatePerDay(300, 30)).toBe(10);
  });
  it("window 0 → 0", () => {
    expect(pickupRatePerDay(100, 0)).toBe(0);
  });
});

describe("projectOccupancy", () => {
  it("OTB 30 + pickup 10 sur 50 chambres = 80%", () => {
    expect(projectOccupancy(30, 10, 50)).toBe(80);
  });
  it("capped à 100%", () => {
    expect(projectOccupancy(60, 20, 50)).toBe(100);
  });
  it("0 capacity → 0", () => {
    expect(projectOccupancy(10, 5, 0)).toBe(0);
  });
});

describe("forecastAlert", () => {
  it("J-2 @ 70% occ → critical", () => {
    const a = forecastAlert(70, 2);
    expect(a.level).toBe("critical");
  });
  it("J-7 @ 55% occ → warning", () => {
    expect(forecastAlert(55, 7).level).toBe("warning");
  });
  it("J-14 @ 40% occ → warning", () => {
    expect(forecastAlert(40, 14).level).toBe("warning");
  });
  it("J-14 @ 60% occ → ok", () => {
    expect(forecastAlert(60, 14).level).toBe("ok");
  });
  it("J-30 occupancy basse → ok (trop tôt pour alerter)", () => {
    expect(forecastAlert(30, 30).level).toBe("ok");
  });
  it("J-2 @ 85% occ → ok (sain)", () => {
    expect(forecastAlert(85, 2).level).toBe("ok");
  });
});
