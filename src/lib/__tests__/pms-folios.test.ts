import { describe, it, expect } from "vitest";
import {
  groupChargesByCategory,
  computeVatBreakdown,
  CATEGORY_DEFAULT_TVA,
  CATEGORY_LABELS,
  FB_CATEGORIES,
  OTHER_CATEGORIES,
} from "../pms/folios";
import type { PmsFolioCharge } from "../pms/types";

function fakeCharge(overrides: Partial<PmsFolioCharge>): PmsFolioCharge {
  const line_ht = overrides.line_ht ?? 100;
  const tva_rate = overrides.tva_rate ?? 17;
  const line_tva = overrides.line_tva ?? Math.round(line_ht * tva_rate) / 100;
  return {
    id: "c1",
    folio_id: "f1",
    category: "bar",
    description: "Test",
    quantity: 1,
    unit_price_ht: line_ht,
    tva_rate,
    line_ht,
    line_tva,
    line_ttc: line_ht + line_tva,
    posted_at: "2026-04-18T10:00:00Z",
    posted_by: null,
    voided: false,
    voided_at: null,
    voided_by: null,
    void_reason: null,
    source: null,
    external_ref: null,
    notes: null,
    created_at: "2026-04-18T10:00:00Z",
    ...overrides,
  };
}

describe("CATEGORY_DEFAULT_TVA — taux LU", () => {
  it("hébergement = 3%", () => {
    expect(CATEGORY_DEFAULT_TVA.room).toBe(3);
    expect(CATEGORY_DEFAULT_TVA.extra_bed).toBe(3);
  });
  it("F&B = 17%", () => {
    expect(CATEGORY_DEFAULT_TVA.breakfast).toBe(17);
    expect(CATEGORY_DEFAULT_TVA.dinner).toBe(17);
    expect(CATEGORY_DEFAULT_TVA.bar).toBe(17);
  });
  it("taxe séjour = 0%", () => {
    expect(CATEGORY_DEFAULT_TVA.taxe_sejour).toBe(0);
  });
});

describe("FB_CATEGORIES vs OTHER_CATEGORIES sans chevauchement", () => {
  it("aucune catégorie dans les deux listes", () => {
    const overlap = FB_CATEGORIES.filter((c) => OTHER_CATEGORIES.includes(c));
    expect(overlap).toHaveLength(0);
  });
  it("FB contient les catégories restauration", () => {
    expect(FB_CATEGORIES).toContain("breakfast");
    expect(FB_CATEGORIES).toContain("dinner");
    expect(FB_CATEGORIES).toContain("bar");
    expect(FB_CATEGORIES).toContain("meeting_room");
  });
});

describe("CATEGORY_LABELS exhaustif", () => {
  it("toutes les clés de CATEGORY_DEFAULT_TVA ont un label", () => {
    for (const k of Object.keys(CATEGORY_DEFAULT_TVA)) {
      expect(CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS]).toBeDefined();
    }
  });
});

describe("groupChargesByCategory", () => {
  it("totalise par catégorie en ignorant les VOID", () => {
    const charges = [
      fakeCharge({ category: "bar", line_ht: 20, line_tva: 3.4 }),
      fakeCharge({ category: "bar", line_ht: 30, line_tva: 5.1 }),
      fakeCharge({ category: "breakfast", line_ht: 15, line_tva: 2.55 }),
      fakeCharge({ category: "bar", line_ht: 100, line_tva: 17, voided: true }),
    ];
    const g = groupChargesByCategory(charges);
    expect(g.bar.count).toBe(2);
    expect(g.bar.ht).toBe(50);
    expect(g.breakfast.count).toBe(1);
    expect(g.breakfast.ht).toBe(15);
  });
});

describe("computeVatBreakdown", () => {
  it("sépare hébergement / F&B / autres / taxe séjour", () => {
    const charges = [
      fakeCharge({ category: "room", line_ht: 200, tva_rate: 3, line_tva: 6 }),
      fakeCharge({ category: "breakfast", line_ht: 15, tva_rate: 17, line_tva: 2.55 }),
      fakeCharge({ category: "parking", line_ht: 20, tva_rate: 17, line_tva: 3.4 }),
      fakeCharge({ category: "taxe_sejour", line_ht: 9, tva_rate: 0, line_tva: 0 }),
    ];
    const b = computeVatBreakdown(charges);
    expect(b.hebergement.ht).toBe(200);
    expect(b.hebergement.tva).toBe(6);
    expect(b.fb.ht).toBe(15);
    expect(b.fb.tva).toBe(2.55);
    expect(b.other.ht).toBe(20);
    expect(b.other.tva).toBe(3.4);
    expect(b.taxe_sejour).toBe(9);
    expect(b.total_ht).toBe(244);
  });
  it("extra_bed est rangé dans hébergement", () => {
    const charges = [fakeCharge({ category: "extra_bed", line_ht: 40, tva_rate: 3, line_tva: 1.2 })];
    const b = computeVatBreakdown(charges);
    expect(b.hebergement.ht).toBe(40);
    expect(b.fb.ht).toBe(0);
  });
  it("ignore les charges VOID", () => {
    const charges = [
      fakeCharge({ category: "bar", line_ht: 50, tva_rate: 17, line_tva: 8.5, voided: true }),
      fakeCharge({ category: "bar", line_ht: 10, tva_rate: 17, line_tva: 1.7 }),
    ];
    const b = computeVatBreakdown(charges);
    expect(b.fb.ht).toBe(10);
  });
});
