import {describe,it,expect} from 'vitest';
import {classifyLenozThresholds} from '../lenoz-thresholds';
const input=(global:number,minimum:number)=>({global,economy:minimum,ecology:minimum,building:minimum,functionality:minimum});
describe('official LENOZ threshold check',()=>{
 it('requires both overall and category thresholds',()=>{
  expect(classifyLenozThresholds(input(85,40)).level).toBe(1);expect(classifyLenozThresholds(input(100,39.99)).level).toBe(2);
  expect(classifyLenozThresholds(input(70,35)).level).toBe(2);expect(classifyLenozThresholds(input(100,34.99)).level).toBe(3);
  expect(classifyLenozThresholds(input(55,30)).level).toBe(3);expect(classifyLenozThresholds(input(100,29.99)).level).toBe(4);
 });
 it('class 4 has no category minimum but still needs 40% overall',()=>{
  expect(classifyLenozThresholds(input(40,0)).level).toBe(4);expect(classifyLenozThresholds(input(39.9999,100)).level).toBe(0);
 });
 it('does not round up at boundaries and checks every mandatory category',()=>{
  expect(classifyLenozThresholds(input(84.9999,100)).level).toBe(2);
  for(const k of ['economy','ecology','building','functionality'])expect(classifyLenozThresholds({...input(100,100),[k]:0}).level).toBe(4);
 });
 it('rejects unknown and out-of-range percentages',()=>{
  for(const n of [NaN,Infinity,-1,101])expect(()=>classifyLenozThresholds(input(n,40))).toThrow();
 });
});
