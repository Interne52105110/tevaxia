import { describe, it, expect } from "vitest";
import { holtWinters, parseCsvMetrics, buildForecast, generateSeedData, validateMetricInputs, type DailyMetric } from "../hotel-forecast";

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

  it("rejects malformed lines atomically", () => {
    const csv = `garbage\n2026-01-01,0.75,120\nfoo,bar,baz`;
    expect(()=>parseCsvMetrics(csv)).toThrow();
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

  it("produces a 90-day projection with an explicit arithmetic variation", () => {
    const r = buildForecast(metrics, "occupancy", 90,10);
    expect(r).not.toBeNull();
    expect(r!.forecast).toHaveLength(90);
    expect(r!.forecast[0].isForecast).toBe(true);
    expect(r!.forecast[0].lower).toBeCloseTo(r!.forecast[0].value*.9);
    expect(r!.forecast[0].upper).toBeCloseTo(Math.min(1,r!.forecast[0].value*1.1));
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

  it("does not claim a backtest score", () => {
    expect(buildForecast(metrics, 'adr', 30)).not.toHaveProperty('mape');
  });
});


describe('hotel data validation and consistency',()=>{
 const rows:DailyMetric[]=Array.from({length:28},(_,i)=>({id:String(i),hotel_id:'test',metric_date:new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10),occupancy:.5,adr:100,revpar:50,source:'manual',notes:null,created_at:'',updated_at:''}));
 it('uses the product of projected occupancy and ADR for projected RevPAR',()=>{
  const r=buildForecast(rows,'revpar',30)!,o=buildForecast(rows,'occupancy',30)!,a=buildForecast(rows,'adr',30)!;
  r.forecast.forEach((p,i)=>{expect(p.value).toBeCloseTo(o.forecast[i].value*a.forecast[i].value);expect(p.value).toBeCloseTo(50);expect(p.lower).toBe(p.value);expect(p.upper).toBe(p.value)});
 });
 it('excludes demo rows and refuses gaps, duplicates, missing values and impossible dates',()=>{
  expect(buildForecast(rows.map(r=>({...r,source:'forecast_seed'})),'adr')).toBeNull();
  for(const bad of [rows.filter((_,i)=>i!==4),[...rows,rows[0]],rows.map((r,i)=>i===2?{...r,metric_date:'2024-02-30'}:r),rows.map((r,i)=>i===2?{...r,adr:null}:r),rows.map((r,i)=>i===2?{...r,occupancy:1.1}:r)])expect(()=>buildForecast(bad,'adr')).toThrow();
  expect(()=>buildForecast(rows,'adr',30,NaN)).toThrow();expect(()=>buildForecast(rows,'adr',181)).toThrow();
 });
 it('preserves CSV zeros, decimal commas and explicit small percentages',()=>{
  expect(parseCsvMetrics('date;occupancy;adr\n2024-01-01;1%;100,50\n2024-01-02;0;0')).toEqual([{metric_date:'2024-01-01',occupancy:.01,adr:100.5},{metric_date:'2024-01-02',occupancy:0,adr:0}]);
  for(const csv of ['2024-02-30,.5,100','2024-01-01,101%,100','2024-01-01,.5,-1','2024-01-01,.5,100abc','2024-01-01,.5,100\n2024-01-01,.5,100','2099-01-01,.5,100'])expect(()=>parseCsvMetrics(csv)).toThrow();
 });
 it('validates all inputs before persistence and refuses synthetic or contradictory metrics',()=>{
  expect(validateMetricInputs([{metric_date:'2024-01-01',occupancy:.75,adr:120}])[0].revpar).toBe(90);
  expect(validateMetricInputs([{metric_date:'2024-01-01',occupancy:0,adr:0}])[0].revpar).toBe(0);
  for(const bad of [{metric_date:'2024-01-01',occupancy:NaN,adr:100},{metric_date:'2024-01-01',occupancy:.5,adr:100,revpar:90},{metric_date:'2024-01-01',occupancy:.5,adr:100,source:'forecast_seed' as const},{metric_date:'2024-01-01'}])expect(()=>validateMetricInputs([bad])).toThrow();
 });
 it('smoothing rejects invalid parameters instead of producing NaN',()=>{
  expect(()=>holtWinters([1,NaN],2)).toThrow();expect(()=>holtWinters([1,2],0)).toThrow();expect(()=>holtWinters([1,2],2,{m:0})).toThrow();expect(()=>holtWinters([1,2],2,{alpha:2})).toThrow();
 });
});


it("requires explicit CSV percentages and complete observations", () => {
  expect(parseCsvMetrics("2024-01-01,1,100")[0].occupancy).toBe(1);
  expect(parseCsvMetrics("2024-01-01,1%,100")[0].occupancy).toBe(.01);
  for (const csv of ["2024-01-01,82,100", "2024-01-01,0,100"]) expect(() => parseCsvMetrics(csv)).toThrow();
  for (const row of [null, { metric_date: "2024-01-01", occupancy: .8 }, { metric_date: "2024-01-01", adr: 125 }, { metric_date: "2024-01-01", occupancy: 0, adr: null, revpar: 1 }]) expect(() => validateMetricInputs([row as never])).toThrow();
  expect(validateMetricInputs([{ metric_date: "2024-01-01", occupancy: 0, adr: null }])[0].revpar).toBe(0);
});
