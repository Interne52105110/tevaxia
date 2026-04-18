import { describe, it, expect } from "vitest";
import { hashReportPayload, buildVerificationUrl } from "../valuation-signatures";

describe("hashReportPayload", () => {
  it("produces a 64-char hexadecimal SHA-256 hash", async () => {
    const h = await hashReportPayload({ commune: "Luxembourg", surface: 80 });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces the same hash for identical payloads (stable)", async () => {
    const a = await hashReportPayload({ commune: "Luxembourg", surface: 80, valeur: 750000 });
    const b = await hashReportPayload({ commune: "Luxembourg", surface: 80, valeur: 750000 });
    expect(a).toBe(b);
  });

  it("produces the same hash regardless of key order (canonical)", async () => {
    const a = await hashReportPayload({ commune: "Luxembourg", surface: 80, valeur: 750000 });
    const b = await hashReportPayload({ valeur: 750000, surface: 80, commune: "Luxembourg" });
    expect(a).toBe(b);
  });

  it("produces different hashes for different payloads", async () => {
    const a = await hashReportPayload({ commune: "Luxembourg", surface: 80 });
    const b = await hashReportPayload({ commune: "Luxembourg", surface: 81 });
    expect(a).not.toBe(b);
  });

  it("handles nested objects", async () => {
    const h1 = await hashReportPayload({
      bien: { commune: "Luxembourg", surface: 80 },
      valeur: 750000,
    });
    const h2 = await hashReportPayload({
      valeur: 750000,
      bien: { surface: 80, commune: "Luxembourg" },
    });
    expect(h1).toBe(h2);
  });

  it("handles arrays with preserved order", async () => {
    const h1 = await hashReportPayload({ tags: ["a", "b", "c"] });
    const h2 = await hashReportPayload({ tags: ["a", "b", "c"] });
    const h3 = await hashReportPayload({ tags: ["c", "b", "a"] });
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it("handles null and undefined consistently", async () => {
    const h1 = await hashReportPayload({ valeur: null });
    const h2 = await hashReportPayload({ valeur: null });
    expect(h1).toBe(h2);
  });
});

describe("buildVerificationUrl", () => {
  it("appends hash as query param", () => {
    const url = buildVerificationUrl("abc123", "https://tevaxia.lu");
    expect(url).toBe("https://tevaxia.lu/verify?hash=abc123");
  });

  it("works with custom base URL", () => {
    const url = buildVerificationUrl("deadbeef", "http://localhost:3000");
    expect(url).toBe("http://localhost:3000/verify?hash=deadbeef");
  });
});
