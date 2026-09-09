import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {HOUSE_PRICE_INDEX,HOUSE_PRICE_INDEX_SOURCE} from '../house-price-index';
describe('published Eurostat national annual house-price index',()=>{
 it('uses published levels with exactly 100 in the reference year',()=>{
  expect(HOUSE_PRICE_INDEX[0]).toEqual({year:2015,index:100,changePct:5.4});
  expect(HOUSE_PRICE_INDEX.at(-1)).toEqual({year:2025,index:165.14,changePct:1.6});
  expect(HOUSE_PRICE_INDEX.some(r=>r.year===2026)).toBe(false);
 });
 it('matches each observation and unit in the original JSON-stat response',()=>{
  const raw=JSON.parse(readFileSync('docs/sources/eurostat-prc-hpi-a-lu-2026-09-09.json','utf8'));
  expect(raw.id).toEqual(['freq','purchase','unit','geo','time']);
  expect(raw.dimension.geo.category.index).toEqual({LU:0});expect(raw.dimension.purchase.category.index).toEqual({TOTAL:0});
  const times=raw.dimension.time.category.index,units=raw.dimension.unit.category.index,n=raw.size[4];
  HOUSE_PRICE_INDEX.forEach(r=>{expect(r.index).toBe(raw.value[String(units.I15_A_AVG*n+times[String(r.year)])]);expect(r.changePct).toBe(raw.value[String(units.RCH_A_AVG*n+times[String(r.year)])])});
  expect(HOUSE_PRICE_INDEX_SOURCE.updated).toBe(raw.updated);
 });
 it('retains published falls and uses a consecutive annual series',()=>{
  expect(HOUSE_PRICE_INDEX.find(r=>r.year===2023)?.changePct).toBe(-9.1);
  expect(HOUSE_PRICE_INDEX.find(r=>r.year===2024)?.changePct).toBe(-5.2);
  expect(HOUSE_PRICE_INDEX.map(r=>r.year)).toEqual(Array.from({length:11},(_,i)=>2015+i));
 });
});
