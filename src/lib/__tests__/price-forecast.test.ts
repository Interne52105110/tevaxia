import {describe,it,expect} from 'vitest';
import {buildPriceForecast,DEFAULT_SCENARIOS} from '../price-forecast';
const scenarios=(rates:number[])=>DEFAULT_SCENARIOS.map((s,i)=>({...s,annualGrowthPct:rates[i]}));
describe('declared property price scenarios',()=>{
 it('uses exact compound growth without inventing history',()=>{
  const r=buildPriceForecast(1000.1234,24,scenarios([-10,10,20]),'2026-12');
  expect(r.series).toHaveLength(25);expect(r.series.filter(p=>!p.isProjection)).toHaveLength(1);
  expect(r.series[0].central).toBe(1000.1234);
  expect(r.series[12].central).toBeCloseTo(1100.13574,8);
  expect(r.endCentral).toBeCloseTo(1210.149314,8);
  expect(r.endPessimiste).toBeCloseTo(810.099954,8);
  expect(r.endOptimiste).toBeCloseTo(1440.177696,8);
  expect(r.series[1].label).toBe('01/2027');expect(r.series[24].label).toBe('12/2028');
  expect(r).not.toHaveProperty('cagrHistorical');expect(r.series[0]).not.toHaveProperty('historical');
 });
 it('keeps zero growth exact and allows a negative ordered case',()=>{
  expect(buildPriceForecast(9876.54321,48,DEFAULT_SCENARIOS,'2026-01').endCentral).toBe(9876.54321);
  expect(buildPriceForecast(10000,6,scenarios([-20,-10,-5]),'2026-01').endCentral).toBeCloseTo(10000*Math.sqrt(.9),9);
 });
 it('rejects blank-equivalent, nonfinite or out-of-scope base prices and horizons',()=>{
  for(const p of [0,-1,NaN,Infinity,1000001])expect(()=>buildPriceForecast(p,12,DEFAULT_SCENARIOS,'2026-01')).toThrow();
  for(const h of [0,-1,1.5,49,NaN,Infinity])expect(()=>buildPriceForecast(1000,h,DEFAULT_SCENARIOS,'2026-01')).toThrow();
 });
 it('requires three unique ordered finite annual rates in the permitted range',()=>{
  for(const r of [[-100,0,5],[-101,0,5],[0,0,101],[0,NaN,2],[1,0,2],[0,2,1]])expect(()=>buildPriceForecast(1000,12,scenarios(r),'2026-01')).toThrow();
  expect(()=>buildPriceForecast(1000,12,DEFAULT_SCENARIOS.slice(1),'2026-01')).toThrow();
  expect(()=>buildPriceForecast(1000,12,[DEFAULT_SCENARIOS[0],DEFAULT_SCENARIOS[0],DEFAULT_SCENARIOS[2]],'2026-01')).toThrow();
 });
 it('requires a valid explicit month when supplied',()=>{
  for(const d of ['', '2026-00','2026-13','2026-1','1999-12','2100-01','2026-02-01'])expect(()=>buildPriceForecast(1000,12,DEFAULT_SCENARIOS,d)).toThrow();
 });
});
