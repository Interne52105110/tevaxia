import {describe,it,expect} from "vitest";
import {calculateEnergySharing as calc,ENERGY_SHARING_EXAMPLE as x} from "../energy-sharing-scenario";
describe("Energy sharing cash flows",()=>{
 it("balances energy and separates consumers from the owner",()=>{
  const r=calc(x);expect(r.surplus).toBe(14500);expect(r.consumerSavings).toBeCloseTo(1540);
  expect(r.producerCash).toBeCloseTo(2615);expect(r.collectiveBenefit).toBeCloseTo(4155);
  expect(r.producerPayback).toBeCloseTo(42120/2615);
 });
 it("cancels internal transfers exactly at collective level",()=>{
  const a=calc(x),b=calc({...x,sharingPrice:.25});
  expect(b.collectiveBenefit).toBeCloseTo(a.collectiveBenefit);
  expect(b.consumerSavings-a.consumerSavings).toBeCloseTo(-1400);
  expect(b.producerCash-a.producerCash).toBeCloseTo(1400);
 });
 it("uses actual shared energy for both percentages",()=>{
  const r=calc({...x,production:100000,consumption:1000,shared:500});
  expect(r.selfConsumptionPct).toBe(.5);expect(r.demandCoveredPct).toBe(50);
 });
 it("does not invent a 99-year payback when the flow is nonpositive",()=>{
  const r=calc({...x,shared:0,exportPrice:0,annualCosts:500});
  expect(r.producerCash).toBe(-500);expect(r.collectivePayback).toBeNull();expect(r.producerPayback).toBeNull();
 });
 it("preserves negative consumer savings and negative export prices",()=>{
  expect(calc({...x,sharingPrice:1}).consumerSavings).toBeLessThan(0);
  expect(calc({...x,exportPrice:-.1}).exportRevenue).toBe(-1450);
 });
 it("does not increase sharing when the number of participants changes",()=>{
  const r=calc({...x,participants:12});expect(r.collectiveBenefit).toBeCloseTo(calc(x).collectiveBenefit);
  expect(r.averageConsumerSavings).toBeCloseTo(calc(x).averageConsumerSavings/2);
 });
 it("handles zero generation and fully funded investment",()=>{
  const r=calc({...x,production:0,consumption:0,shared:0,investment:0,confirmedAid:0});
  expect(r.selfConsumptionPct).toBe(0);expect(r.demandCoveredPct).toBe(0);expect(r.producerPayback).toBe(0);
 });
 it("rejects impossible energy balances and grants",()=>{
  for(const patch of [{shared:28501},{shared:27001},{confirmedAid:42121},{participants:0},{participants:1.5},{production:NaN},{annualCosts:Infinity},{shared:-1},{exportPrice:-11}])
   expect(()=>calc({...x,...patch})).toThrow();
 });
});
