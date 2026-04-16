import { describe, it, expect } from "vitest";
import { holtWinters, parseCsvMetrics, buildForecast, generateSeedData, type DailyMetric } from "../hotel-forecast";

describe("holtWinters", () => {
  it("returns flat forecast for short series (fallback)", () => {
    const r = holtWinters([10, 11, 12], 5);
    expect(r.forecast).toHaveLength(5);
    expect(r.forecast.every((v) => v > 0)).toBe(true);
  });

  it("captures weekly seasonality and projects trend", () => {
    // 8 semaines de données avec motif hebdo : lun-ven = 0.7, sam-dim = 0.9
    const series: number[] = [];
    for (let w = 0; w < 8; w++) {
      for (let d = 0; d < 7; d++) {
        const weekend = d >= 5;
        series.push((weekend ? 0.9 : 0.7) + w * 0.002); // légère tendance
      }
    }
    const r = holtWinters(series, 14, { m: 7 });
    expect(r.forecast).toHaveLength(14);
    // Vérifier que la prévision jour 5 (samedi) > jour 0 (lundi)
    expect(r.forecast[5]).toBeGreaterThan(r.forecast[0]);
  });

  it("residStd is finite and non-negative", () => {
    const series = Array(30).fill(100).map((v, i) => v + Math.sin(i * Math.PI / 3) * 10);
    const r = holtWinters(series, 7);
    expect(Number.isFinite(r.residStd)).toBe(true);
    expect(r.residStd).toBeGreaterThanOrEqual(0);
  });
});

describe("parseCsvMetrics", () => {
  it("parses a basic CSV with header", () => {
    const csv = `date,occupancy,adr\n2026-01-01,0.75,120\n2026-01-02,0.82,125`;
    const out = parseCsvMetrics(csv);
    expect(out).toHaveLength(2);
    expect(out[0].metric_date).toBe("2026-01-01");
    expect(out[0].occupancy).toBeCloseTo(0.75);
    expect(out[0].adr).toBe(120);
  });

  it("normalizes percentage occupancy", () => {
    const csv = `2026-01-01,82%,130`;
    const out = parseCsvMetrics(csv);
    expect(out[0].occupancy).toBeCloseTo(0.82);
  });

  it("ignores malformed lines", () => {
    const csv = `garbage\n2026-01-01,0.75,120\nfoo,bar,baz`;
    const out = parseCsvMetrics(csv);
    expect(out).toHaveLength(1);
  });
});

describe("buildForecast", () => {
  const seed = generateSeedData(0.72, 130, 60);
  const metrics: DailyMetric[] = seed.map((s, i) => ({
    id: String(i),
    hotel_id: "h1",
    metric_date: s.metric_date,
    occupancy: s.occupancy,
    adr: s.adr,
    revpar: s.occupancy * s.adr,
    source: "manual",
    notes: null,
    created_at: "",
    updated_at: "",
  }));

  it("produces 90-day horizon forecast with confidence band", () => {
    const r = buildForecast(metrics, "occupancy", 90);
    expect(r).not.toBeNull();
    expect(r!.forecast).toHaveLength(90);
    expect(r!.forecast[0].isForecast).toBe(true);
    // Les bandes s'élargissent avec l'horizon
    const firstBand = r!.forecast[0].upper - r!.forecast[0].lower;
    const lastBand = r!.forecast[89].upper - r!.forecast[89].lower;
    expect(lastBand).toBeGreaterThanOrEqual(firstBand);
  });

  it("returns null when series too short", () => {
    const tiny = metrics.slice(0, 5);
    const r = buildForecast(tiny, "adr", 30);
    expect(r).toBeNull();
  });

  it("clamps occupancy forecasts to [0,1]", () => {
    const r = buildForecast(metrics, "occupancy", 30);
    expect(r).not.toBeNull();
    r!.forecast.forEach((p) => {
      expect(p.value).toBeGreaterThanOrEqual(0);
      expect(p.value).toBeLessThanOrEqual(1);
    });
  });

  it("MAPE is a finite percentage", () => {
    const r = buildForecast(metrics, "adr", 30);
    expect(r).not.toBeNull();
    expect(Number.isFinite(r!.mape)).toBe(true);
    expect(r!.mape).toBeGreaterThanOrEqual(0);
  });
});
