import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLocalePrefix, localePath } from "../locale-path";

function mockPathname(pathname: string) {
  vi.stubGlobal("window", { location: { pathname } });
}

describe("getLocalePrefix", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty string on French (no prefix)", () => {
    mockPathname("/estimation");
    expect(getLocalePrefix()).toBe("");
  });

  it("returns empty string on home /", () => {
    mockPathname("/");
    expect(getLocalePrefix()).toBe("");
  });

  it("returns /en for English pages", () => {
    mockPathname("/en/estimation");
    expect(getLocalePrefix()).toBe("/en");
  });

  it("returns /de for German pages", () => {
    mockPathname("/de/valorisation");
    expect(getLocalePrefix()).toBe("/de");
  });

  it("returns /pt for Portuguese pages", () => {
    mockPathname("/pt/frais-acquisition");
    expect(getLocalePrefix()).toBe("/pt");
  });

  it("returns /lb for Luxembourgish pages", () => {
    mockPathname("/lb/energy/impact");
    expect(getLocalePrefix()).toBe("/lb");
  });

  it("detects locale on home pages /en, /de etc.", () => {
    mockPathname("/en");
    expect(getLocalePrefix()).toBe("/en");
    mockPathname("/lb");
    expect(getLocalePrefix()).toBe("/lb");
  });

  it("returns empty string for SSR context (no window)", () => {
    vi.unstubAllGlobals();
    // @ts-expect-error — simulation SSR
    globalThis.window = undefined;
    expect(getLocalePrefix()).toBe("");
  });

  it("does not match partial words like /enfants/", () => {
    mockPathname("/enfants/hello");
    expect(getLocalePrefix()).toBe("");
  });
});

describe("localePath", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("French: returns path unchanged", () => {
    mockPathname("/estimation");
    expect(localePath("/valorisation")).toBe("/valorisation");
  });

  it("English: prefixes path with /en", () => {
    mockPathname("/en/estimation");
    expect(localePath("/valorisation")).toBe("/en/valorisation");
  });

  it("German: prefixes path with /de", () => {
    mockPathname("/de/home");
    expect(localePath("/energy/impact")).toBe("/de/energy/impact");
  });

  it("does not double-prefix already-prefixed paths", () => {
    mockPathname("/en/home");
    expect(localePath("/en/valorisation")).toBe("/en/valorisation");
  });

  it("handles root path /", () => {
    mockPathname("/en/home");
    expect(localePath("/")).toBe("/en/");
  });
});
