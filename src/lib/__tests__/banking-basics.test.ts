import {describe,it,expect} from 'vitest';
import {amortization,buildAmortizationReport} from '../banking-basics';
import {calculerLTV,calculerDSCR,genererTableauAmortissement} from '../calculations';
describe('banking ratios and schedule',()=>{
 it('rejects undefined ratios and preserves negative operating income',()=>{
  expect(()=>calculerLTV({valeurBien:0,montantPret:100})).toThrow();
  expect(()=>calculerLTV({valeurBien:100,montantPret:-1})).toThrow();
  expect(calculerLTV({valeurBien:100,montantPret:120})).toBe(1.2);
  expect(()=>calculerDSCR({revenuLocatifAnnuel:100,chargesAnnuelles:0,serviceDetteAnnuel:0})).toThrow();
  expect(calculerDSCR({revenuLocatifAnnuel:100,chargesAnnuelles:200,serviceDetteAnnuel:50})).toBe(-2);
 });
 it('matches an independently calculated one-year loan at 1% monthly',()=>{
  const r=amortization({capital:12000,rate:12,years:1});
  expect(r.monthly).toBeCloseTo(1066.18546414,6);
  expect(r.interest).toBeCloseTo(794.2255696812,6);
  expect(r.annual[0].repaid).toBeCloseTo(12000,6);expect(r.annual[0].remaining).toBe(0);
 });
 it('conserves principal and clears the final balance at zero and near-zero rates',()=>{
  for(const rate of [0,1e-12,.035,.3]){const rows=genererTableauAmortissement(12000,rate,50);
   expect(rows.reduce((n,r)=>n+r.capital,0)).toBeCloseTo(12000,6);expect(rows.at(-1)?.capitalRestant).toBe(0);
   expect(rows.every(r=>Number.isFinite(r.mensualite)&&r.capital>=0&&r.interets>=0)).toBe(true);
  }
  expect(amortization({capital:12000,rate:0,years:1}).monthly).toBe(1000);
 });
 it('rejects invalid loans before building a schedule',()=>{
  for(const i of [{capital:0,rate:3,years:25},{capital:1,rate:-1,years:1},{capital:1,rate:3,years:0},{capital:1,rate:3,years:1.5},{capital:NaN,rate:3,years:1},{capital:1,rate:31,years:1}])expect(()=>amortization(i)).toThrow();
 });
 it('exports only loan inputs, real totals and annual schedule',()=>{
  const r=buildAmortizationReport({capital:12000,rate:0,years:1},k=>k,'fr');
  expect(r.sections).toHaveLength(3);
  expect(r.sections[1].rows?.map(r=>r.label)).toEqual(['capital','rate','years','monthly','interest','total']);
  expect(r.sections[2].rows?.map(r=>r.label)).toEqual(['repaid','interest','remaining']);
 });
});
