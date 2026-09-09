import {describe,it,expect} from 'vitest';
import {loanCapacity,loanPrepayment,CAPACITY_EXAMPLE,PREPAYMENT_EXAMPLE,loanPayment} from '../loan-planning';
const base={...PREPAYMENT_EXAMPLE,strategy:'term' as const};
describe('budget-constrained capacity',()=>{
 it('deducts insurance and fees before computing principal',()=>{const r=loanCapacity({...CAPACITY_EXAMPLE,rate:0,years:10,insurance:100,monthlyFees:50});expect(r.grossBudget).toBe(1500);expect(r.loanBudget).toBe(1350);expect(r.capital).toBe(162000)});
 it('respects the budget at a positive rate',()=>{const r=loanCapacity({...CAPACITY_EXAMPLE,insurance:100});expect(loanPayment(r.capital,3.5,300)+100+500).toBeCloseTo(2000,7)});
 it('returns no lending room when commitments exceed the ratio',()=>{const r=loanCapacity({...CAPACITY_EXAMPLE,existing:2100,insurance:50});expect(r.capital).toBe(0);expect(r.shortfall).toBe(150)});
 it('rejects empty and invalid data instead of showing a result',()=>{for(const patch of [{income:NaN},{existing:-1},{ratio:101},{insurance:-1},{monthlyFees:Infinity},{years:0},{rate:-1}])expect(()=>loanCapacity({...CAPACITY_EXAMPLE,...patch})).toThrow()});
});
describe('repayment after the selected regular instalment',()=>{
 it('handles zero interest and an exact shorter term independently',()=>{const r=loanPrepayment({capital:12000,rate:0,years:1,month:2,amount:3000,fees:50,strategy:'term'});expect(r.balance).toBe(10000);expect(r.after).toBe(7000);expect(r.newMonths).toBe(7);expect(r.newMonthly).toBe(1000);expect(r.cashNeeded).toBe(3050);expect(r.netSaving).toBe(-50);expect(r.recoveryMonths).toBeNull()});
 it('keeps the remaining term when lowering the payment',()=>{const r=loanPrepayment({capital:12000,rate:0,years:1,month:2,amount:3000,fees:0,strategy:'payment'});expect(r.newMonths).toBe(10);expect(r.newMonthly).toBe(700)});
 it('makes the final partial instalment explicit',()=>{const r=loanPrepayment({capital:12000,rate:0,years:1,month:2,amount:3500,fees:0,strategy:'term'});expect(r.newMonths).toBe(7);expect(r.lastPayment).toBe(500)});
 it('balances remaining payments and interest for either strategy',()=>{for(const strategy of ['term','payment'] as const){const r=loanPrepayment({...base,strategy});expect(r.newMonthly*(r.newMonths-1)+r.lastPayment).toBeCloseTo(r.after+r.afterInterest,4);expect(r.netSaving).toBeCloseTo(r.beforeInterest-r.afterInterest-r.fees,5)}});
 it('reports excess requested cash and handles full repayment fee recovery',()=>{const r=loanPrepayment({...base,amount:1000000,fees:1000});expect(r.after).toBe(0);expect(r.newMonths).toBe(0);expect(r.newMonthly).toBe(0);expect(r.applied+r.unused).toBe(1000000);expect(r.recoveryMonths).not.toBeNull()});
 it('tracks interest fee recovery beyond the shortened loan end',()=>{const r0=loanPrepayment({...base,amount:500000,fees:0});const r=loanPrepayment({...base,amount:500000,fees:r0.savedInterest-1});expect(r.recoveryMonths).toBeGreaterThan(r.newMonths);expect(r.netSaving).toBeCloseTo(1,4)});
 it('makes a zero repayment a no-op, with no event costs',()=>{const r=loanPrepayment({...base,amount:0,fees:1000});expect(r.fees).toBe(0);expect(r.savedInterest).toBeCloseTo(0,5);expect(r.newMonths).toBe(240)});
 it('handles the last scheduled instalment without NaN',()=>{const r=loanPrepayment({...base,month:300});expect(r.balance).toBe(0);expect(r.newMonths).toBe(0);expect(r.fees).toBe(0);expect(r.unused).toBe(base.amount)});
 it('rejects invalid timing, amounts and strategies rather than silently clamping them',()=>{for(const patch of [{month:0},{month:301},{month:1.5},{amount:-1},{fees:NaN},{capital:0},{strategy:'x'}])expect(()=>loanPrepayment({...base,...patch} as typeof base)).toThrow()});
});
