import {describe,it,expect} from 'vitest';
import {compareHvac,HVAC_SCENARIO_EXAMPLE as example,EMPTY_HVAC_QUOTES as empty} from '../hvac-scenario';
describe('HVAC comparison with declared inputs',()=>{
 it('keeps kWh units and computes seasonal energy, not instantaneous COP',()=>{
  const r=compareHvac({...example,heatBefore:18000,heatAfter:18000,factorBefore:.9,factorAfter:3,priceBefore:.1,priceAfter:.25,maintenanceBefore:200,maintenanceAfter:250},empty);
  expect(r.purchasedBefore).toBe(20000);expect(r.purchasedAfter).toBe(6000);expect(r.costBefore).toBe(2200);expect(r.costAfter).toBe(1750);expect(r.saving).toBe(450);
 });
 it('counts quotes and confirmed aid once and limits nominal payback to the horizon',()=>{
  const i={...example,heatBefore:18000,heatAfter:18000,factorAfter:3,grant:1000,years:20};const q={...empty,lot1:5000,other:500};
  const r=compareHvac(i,q);expect(r.budget).toBe(5500);expect(r.netBudget).toBe(4500);expect(r.payback).toBe(10);expect(r.balance).toBe(4500);
  expect(compareHvac({...i,years:9},q).payback).toBeNull();
 });
 it('preserves increased running costs, zero heat and missing quotations',()=>{
  const r=compareHvac({...example,priceAfter:2},empty);expect(r.saving).toBeLessThan(0);expect(r.payback).toBeNull();expect(r.balance).toBeNull();
  const zero=compareHvac({...example,heatBefore:0,heatAfter:0,extraAfter:25},empty);expect(zero.purchasedAfter).toBe(0);expect(zero.costAfter).toBe(275);
 });
 it('does not certify capacity or eligibility',()=>{
  expect(compareHvac({...example,designLoad:12,ratedPower:9},empty).powerGap).toBe(-3);
  expect(()=>compareHvac({...example,grant:1},empty)).toThrow();
  for(const patch of [{factorAfter:0},{heatBefore:-1},{priceAfter:NaN},{years:1.5}])expect(()=>compareHvac({...example,...patch},empty)).toThrow();
 });
});
