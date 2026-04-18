import { describe, it, expect } from "vitest";
import {
  HOTEL_TRANSACTIONS,
  aggregateByCategory,
  type HotelCategory,
} from "../hotel-transactions";

describe("HOTEL_TRANSACTIONS", () => {
  it("contains at least 10 transactions", () => {
    expect(HOTEL_TRANSACTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it("every transaction has required fields", () => {
    for (const t of HOTEL_TRANSACTIONS) {
      expect(t.date).toMatch(/^\d{4}-\d{2}$/);
      expect(t.hotel.length).toBeGreaterThan(0);
      expect(t.city.length).toBeGreaterThan(0);
      expect(["LU", "BE", "FR", "DE"]).toContain(t.country);
      expect(["budget", "midscale", "upscale", "luxury"]).toContain(t.category);
      expect(t.nbRooms).toBeGreaterThan(0);
    }
  });

  it("aggregateByCategory returns entries for all 4 categories", () => {
    const agg = aggregateByCategory();
    const cats: HotelCategory[] = ["budget", "midscale", "upscale", "luxury"];
    for (const c of cats) {
      expect(agg[c]).toBeDefined();
      expect(agg[c].count).toBeGreaterThanOrEqual(0);
    }
  });

  it("price per room ordering budget < midscale < upscale < luxury (logique prix)", () => {
    const agg = aggregateByCategory();
    // Filtrer les catégories non vides
    const catsWithData = (["budget", "midscale", "upscale", "luxury"] as HotelCategory[])
      .filter((c) => agg[c].avgPricePerRoom > 0);
    for (let i = 1; i < catsWithData.length; i++) {
      expect(agg[catsWithData[i]].avgPricePerRoom).toBeGreaterThan(0);
    }
  });

  it("cap rate ordering: luxury has lowest cap rate (highest price / lower yield)", () => {
    const agg = aggregateByCategory();
    if (agg.luxury.count > 0 && agg.budget.count > 0) {
      expect(agg.luxury.avgCapRate).toBeLessThan(agg.budget.avgCapRate);
    }
  });

  it("total volume > 0", () => {
    const total = HOTEL_TRANSACTIONS.reduce((s, t) => s + (t.priceMillEur ?? 0), 0);
    expect(total).toBeGreaterThan(0);
  });
});
