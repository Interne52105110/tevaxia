import {describe,it,expect} from 'vitest';
import {compareMortgageConditions,MORTGAGE_COMPARISON_EXAMPLE as base} from '../energy-banking';
describe('explicit mortgage conditions',()=>{
 it('keeps identical conditions identical',()=>{const r=compareMortgageConditions(base);expect(r.a).toEqual(r.b);expect(r.monthlyDelta).toBe(0);expect(r.interestDelta).toBe(0)});
 it('calculates an independently known annuity and separates principal from interest',()=>{const r=compareMortgageConditions({...base,capital:100000,years:10,rateA:5});expect(r.a.monthly).toBeCloseTo(1060.655152,5);expect(r.a.interest).toBeCloseTo(27278.618287,4);expect(r.a.repaid).toBeCloseTo(127278.618287,4)});
 it('compares the same principal when LTV differs',()=>{const r=compareMortgageConditions({...base,ltvA:80,ltvB:70});expect(r.a.monthly).toBe(r.b.monthly);expect(r.b.ceiling).toBe(525000);expect(r.b.gap).toBe(75000);expect(r.ceilingDelta).toBe(-75000)});
 it('reduces payments and interest for a lower entered rate',()=>{const r=compareMortgageConditions({...base,rateB:3});expect(r.monthlyDelta).toBeLessThan(0);expect(r.interestDelta).toBeCloseTo(r.monthlyDelta*300,5);expect(r.ceilingDelta).toBe(0)});
 it('handles zero and near-zero rates without numerical cancellation',()=>{for(const rateA of [0,1e-10]){const r=compareMortgageConditions({...base,rateA});expect(r.a.monthly).toBeCloseTo(2000,5);expect(r.a.interest).toBeCloseTo(0,3)}});
 it('reports a gap at zero LTV without pretending to approve borrowing',()=>{const r=compareMortgageConditions({...base,ltvB:0});expect(r.b.ceiling).toBe(0);expect(r.b.gap).toBe(base.capital);expect(r.b.monthly).toBe(r.a.monthly)});
 it('rejects missing, non-finite and out-of-range inputs',()=>{for(const patch of [{value:0},{capital:-1},{years:0},{years:1.5},{years:51},{rateA:-1},{rateB:Infinity},{ltvA:101},{ltvB:-1},{capital:NaN}])expect(()=>compareMortgageConditions({...base,...patch})).toThrow()});
});
