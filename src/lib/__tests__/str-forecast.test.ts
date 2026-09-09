import { describe, it, expect } from "vitest";
import {
  parseStrCsv,
  sortedMonthly,
  buildStrForecast,
  generateStrSeed,
  type StrMonthlyMetric,
} from "../str-forecast";

describe("parseStrCsv", () => {
  it("parses YYYY-MM with decimal occupancy", () => {
    const csv = "2025-01,0.62,125\n2025-02,0.68,130";
    const out = parseStrCsv(csv);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ year: 2025, month: 1, occupancy: 0.62, adr: 125 });
  });

  it("normalizes percent occupancy > 1", () => {
    const out = parseStrCsv("2025-03,72,140");
    expect(out[0].occupancy).toBeCloseTo(0.72);
  });

  it("rejects malformed rows atomically and accepts an exact header", () => {
    expect(()=>parseStrCsv("date,occupancy,adr\n2025-01,0.6,120\nbad,bad,bad")).toThrow();
    expect(parseStrCsv("date,occupancy,adr\n2025-01,0.6,120")).toHaveLength(1);
  });

  it("accepts optional nights column", () => {
    const out = parseStrCsv("2025-04,0.80,150,24");
    expect(out[0].nights).toBe(24);
  });

  it("rejects month out of range", () => {
    expect(()=>parseStrCsv("2025-13,0.5,100\n2025-00,0.5,100")).toThrow();
  });
});

describe("sortedMonthly", () => {
  it("orders by year then month", () => {
    const rows: StrMonthlyMetric[] = [
      { year: 2025, month: 6, occupancy: 0.7, adr: 140, nights: 21 },
      { year: 2024, month: 12, occupancy: 0.55, adr: 110, nights: 17 },
      { year: 2025, month: 1, occupancy: 0.58, adr: 115, nights: 18 },
    ];
    const sorted = sortedMonthly(rows);
    expect(sorted[0]).toMatchObject({ year: 2024, month: 12 });
    expect(sorted[2]).toMatchObject({ year: 2025, month: 6 });
  });
});

describe("generateStrSeed", () => {
  it("produces the requested number of months", () => {
    const seed = generateStrSeed(0.6, 120, 18);
    expect(seed).toHaveLength(18);
  });

  it("occupancy stays in [0, 1]", () => {
    const seed = generateStrSeed(0.9, 200, 24);
    seed.forEach((m) => {
      expect(m.occupancy).toBeGreaterThanOrEqual(0);
      expect(m.occupancy).toBeLessThanOrEqual(1);
    });
  });

  it("shows higher ADR in summer months than winter", () => {
    const seed = generateStrSeed(0.65, 130, 120); // 10 ans pour moyenne
    const julAdr = seed.filter((m) => m.month === 7).reduce((s, v) => s + v.adr, 0);
    const janAdr = seed.filter((m) => m.month === 1).reduce((s, v) => s + v.adr, 0);
    expect(julAdr).toBeGreaterThan(janAdr);
  });
});

describe("buildStrForecast", () => {
  it("returns null with too few months", () => {
    const r = buildStrForecast([{ year: 2026, month: 1, occupancy: 0.6, adr: 120, nights: 18 }], 12);
    expect(r).toBeNull();
  });

  it("produces 12-month horizon with historical + forecast", () => {
    const seed = generateStrSeed(0.65, 130, 24);
    const r = buildStrForecast(seed, 12);
    expect(r).not.toBeNull();
    expect(r!.historical).toHaveLength(24);
    expect(r!.forecast).toHaveLength(12);
    expect(r!.method).toBe("seasonal");
  });

  it("uses a constant mean for 12-23 months", () => {
    const seed = generateStrSeed(0.65, 130, 15);
    const r = buildStrForecast(seed, 12);
    expect(r!.method).toBe("mean");
  });

  it("uses a constant mean for 6-11 months", () => {
    const seed = generateStrSeed(0.65, 130, 8);
    const r = buildStrForecast(seed, 6);
    expect(r!.method).toBe("mean");
  });

  it("forecast months are correctly chained from last historical month", () => {
    const seed: StrMonthlyMetric[] = [];
    for (let y = 2024; y <= 2025; y++) {
      for (let m = 1; m <= 12; m++) {
        seed.push({ year: y, month: m, occupancy: 0.7, adr: 130, nights: 20 });
      }
    }
    const r = buildStrForecast(seed, 6);
    expect(r!.forecast[0]).toMatchObject({ year: 2026, month: 1 });
    expect(r!.forecast[5]).toMatchObject({ year: 2026, month: 6 });
  });

  it("arithmetic scenarios are non-negative and occupancy is bounded", () => {
    const seed = generateStrSeed(0.9, 250, 24);
    const r = buildStrForecast(seed, 12);
    r!.forecast.forEach((p) => {
      expect(p.occupancy).toBeLessThanOrEqual(1);
      expect(p.occupancy).toBeGreaterThanOrEqual(0);
      expect(p.lowerRevenue).toBeGreaterThanOrEqual(0);
      expect(p.upperRevenue).toBeGreaterThanOrEqual(p.lowerRevenue);
    });
  });
});


describe('calendar revenue and honest scenario inputs',()=>{
 const six=()=>Array.from({length:6},(_,i)=>({year:2024,month:i+1,occupancy:.5,adr:100,nights:null}));
 it('uses leap-year calendar days and retains reported nights including zero',()=>{
  const rows:StrMonthlyMetric[]=six();rows[0].nights=10;rows[2].nights=0;
  const r=buildStrForecast(rows,2,10)!;
  expect(r.historical[0].revenue).toBe(1000);expect(r.historical[0].revenueBasis).toBe('reported-nights');
  expect(r.historical[1]).toMatchObject({days:29,nights:14.5,revenue:1450,revenueBasis:'occupancy-estimate'});
  expect(r.historical[2].revenue).toBe(0);
  expect(r.forecast[0]).toMatchObject({year:2024,month:7,days:31,revenue:1550,lowerRevenue:1395});
  expect(r.forecast[0].upperRevenue).toBeCloseTo(1705);expect(r.variationPct).toBe(10);
 });
 it('parses decimal commas, explicit small percentages and absent nights distinctly',()=>{
  const rows=parseStrCsv('date;occupancy;adr;nights\n2024-01;1%;100,50;0\n2024-02;0,5;100,50;');
  expect(rows[0]).toMatchObject({occupancy:.01,adr:100.5,nights:0});expect(rows[1].nights).toBeNull();
 });
 it('rejects duplicates, missing months and invalid observations or assumptions',()=>{
  for(const csv of ['2024-01,.5,100\n2024-01,.5,100','2024-01,.5,100\n2024-03,.5,100','2024-01,101%,100','2024-01,50%,-1','2024-02,50%,100,30','2024-01,50%,100,1.5','2024-01,50%oops,100'])expect(()=>parseStrCsv(csv),csv).toThrow();
  for(const [h,v]of [[0,0],[1.5,0],[25,0],[6,NaN],[6,-1],[6,101]])expect(()=>buildStrForecast(six(),h,v)).toThrow();
 });
 it('zero revenues stay zero without NaN or a synthetic confidence range',()=>{
  const r=buildStrForecast(six().map(r=>({...r,occupancy:0,adr:0})),6)!;
  expect(r.forecast.every(p=>p.revenue===0&&p.lowerRevenue===0&&p.upperRevenue===0)).toBe(true);
  expect(r).not.toHaveProperty('confidence');expect(r).not.toHaveProperty('mape');
 });
 it('demo is reproducible and contains no asserted actual nights',()=>{
  expect(generateStrSeed()).toEqual(generateStrSeed());expect(generateStrSeed().every(r=>r.nights===null)).toBe(true);
 });
});
