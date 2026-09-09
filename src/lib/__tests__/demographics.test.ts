import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {getDemographics,DEMOGRAPHIC_SOURCE} from '../demographics';
import {getAllMarketData} from '../market-data';
describe('official RNPP population snapshot',()=>{
 it('covers 100 unique municipalities and preserves the administrative total',()=>{
  const rows=DEMOGRAPHIC_SOURCE.records;expect(rows).toHaveLength(100);expect(new Set(rows.map(r=>r.code)).size).toBe(100);
  expect(rows.reduce((s,r)=>s+r.population,0)).toBe(693913);
  rows.forEach(r=>{expect(r.population).toBe(r.mineurs+r.majeurs);expect(Number.isInteger(r.population)).toBe(true);expect(r.population).toBeGreaterThan(0)});
 });
 it('matches independently checked source examples',()=>{
  expect(getDemographics('Luxembourg')).toMatchObject({code:'0001',population:138215,mineurs:20122,majeurs:118093});
  expect(getDemographics('Esch-sur-Alzette')?.population).toBe(38323);
  expect(getDemographics('Redange')).toMatchObject({code:'0809',population:3170});
  expect(getDemographics('Groussbus-Wal')).not.toBeNull();expect(getDemographics('Bous-Waldbredimus')).not.toBeNull();
 });
 it('normalizes case and accents without inventing a fallback',()=>{
  expect(getDemographics('  PETANGE ')).toEqual(getDemographics('Pétange'));
  expect(getDemographics('XYZFAKECITY')).toBeNull();expect(getDemographics('_national')).toBeNull();expect(getDemographics('Grosbous')).toBeNull();
 });
 it('records source date and checksum and contains no unsupported economic estimates',()=>{
  expect(DEMOGRAPHIC_SOURCE.referenceDate).toBe('2026-07-01');
  const raw=readFileSync('docs/sources/rnpp-2026-07-01.csv');expect(createHash('sha256').update(raw).digest('hex')).toBe(DEMOGRAPHIC_SOURCE.sha256);
  expect(getDemographics('Luxembourg')).not.toHaveProperty('revenuMedian');expect(getDemographics('Luxembourg')).not.toHaveProperty('croissancePct');
 });
 it('provides an exact population match for every market municipality',()=>{
  const missing=getAllMarketData().map(c=>c.commune).filter(name=>!getDemographics(name));expect(missing).toEqual([]);
 });
});
