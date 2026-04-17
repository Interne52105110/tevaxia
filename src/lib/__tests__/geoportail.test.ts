import { describe, it, expect } from "vitest";
import {
  getGeoportailWMSUrl,
  buildGeoportailViewerUrl,
  GEOPORTAIL_LAYERS,
} from "../geoportail";

describe("GEOPORTAIL_LAYERS", () => {
  it("includes at least cadastre layer", () => {
    expect(GEOPORTAIL_LAYERS.cadastre).toBeDefined();
  });

  it("each layer has required fields", () => {
    Object.values(GEOPORTAIL_LAYERS).forEach((l) => {
      expect(l.wmsUrl).toMatch(/^https?:\/\//);
      expect(l.layers).toBeTruthy();
      expect(l.format).toMatch(/image\//);
      expect(typeof l.transparent).toBe("boolean");
      expect(l.attribution).toBeTruthy();
      expect(l.opacity).toBeGreaterThanOrEqual(0);
      expect(l.opacity).toBeLessThanOrEqual(1);
    });
  });
});

describe("getGeoportailWMSUrl", () => {
  it("returns WMS config for cadastre", () => {
    const { url, options } = getGeoportailWMSUrl("cadastre");
    expect(url).toMatch(/^https/);
    expect(options.layers).toBeTruthy();
    expect(options.transparent).toBe(true);
  });

  it("throws on unknown layer key", () => {
    expect(() => getGeoportailWMSUrl("unknown_layer_xyz")).toThrow(/Unknown/);
  });
});

describe("buildGeoportailViewerUrl", () => {
  it("builds URL with commune search", () => {
    const url = buildGeoportailViewerUrl("Luxembourg");
    expect(url).toContain("map.geoportail.lu");
    expect(url).toContain("search=Luxembourg");
  });

  it("handles commune name with spaces (URL encoded)", () => {
    const url = buildGeoportailViewerUrl("Esch-sur-Alzette");
    expect(url).toContain("Esch-sur-Alzette");
  });

  it("uses coordinates when provided", () => {
    const url = buildGeoportailViewerUrl("Anywhere", { lat: 49.61, lon: 6.13 });
    expect(url).toContain("X=6.13");
    expect(url).toContain("Y=49.61");
    // search param pas utilisé
    expect(url).not.toContain("search=");
  });

  it("custom layers parameter", () => {
    const url = buildGeoportailViewerUrl("Luxembourg", { layers: "100,200,300" });
    expect(url).toContain("layers=100");
  });

  it("default zoom = 17 if not provided", () => {
    const url = buildGeoportailViewerUrl("Luxembourg");
    expect(url).toContain("zoom=17");
  });

  it("custom zoom respected", () => {
    const url = buildGeoportailViewerUrl("Luxembourg", { zoom: 12 });
    expect(url).toContain("zoom=12");
  });

  it("URL includes language FR", () => {
    const url = buildGeoportailViewerUrl("Luxembourg");
    expect(url).toContain("lang=fr");
  });
});
