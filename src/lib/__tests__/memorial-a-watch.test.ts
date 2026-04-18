import { describe, it, expect } from "vitest";
import { MEMORIAL_WATCH, MEMORIAL_LAST_UPDATED } from "../memorial-a-watch";

describe("MEMORIAL_WATCH", () => {
  it("contains at least 6 entries", () => {
    expect(MEMORIAL_WATCH.length).toBeGreaterThanOrEqual(6);
  });

  it("every entry has valid date format YYYY-MM-DD", () => {
    for (const e of MEMORIAL_WATCH) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every entry has title and summary", () => {
    for (const e of MEMORIAL_WATCH) {
      expect(e.title.length).toBeGreaterThan(5);
      expect(e.summary.length).toBeGreaterThan(10);
    }
  });

  it("every entry has valid category", () => {
    const validCategories = ["klimabonus", "aides", "bail", "copropriete", "fiscal", "urbanisme"];
    for (const e of MEMORIAL_WATCH) {
      expect(validCategories).toContain(e.category);
    }
  });

  it("every entry has valid impact enum", () => {
    const validImpacts = ["nouveau", "modification", "abrogation"];
    for (const e of MEMORIAL_WATCH) {
      expect(validImpacts).toContain(e.impact);
    }
  });

  it("every URL starts with http://", () => {
    for (const e of MEMORIAL_WATCH) {
      expect(e.url).toMatch(/^https?:\/\//);
    }
  });

  it("MEMORIAL_LAST_UPDATED is a valid date", () => {
    expect(MEMORIAL_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("entries are reasonably recent (within last 3 years)", () => {
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000);
    for (const e of MEMORIAL_WATCH) {
      expect(new Date(e.date).getTime()).toBeGreaterThan(threeYearsAgo.getTime());
    }
  });
});
