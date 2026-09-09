import {describe,it,expect} from 'vitest';
import {calculateLoanOffer,compareLoanOffers,LOAN_OFFER_EXAMPLE as base} from '../loan-offers';
describe('loan proposal costs',()=>{
 it('separates capital, interest and entered costs',()=>{const r=calculateLoanOffer(120000,{rate:0,years:10,insuranceUpfront:2400,insuranceMonthly:20,feesUpfront:600,feesMonthly:5});expect(r).toEqual({monthlyLoan:1000,monthlyOutflow:1025,upfront:3000,interest:0,insurance:4800,fees:1200,cost:6000,total:126000})});
 it('counts upfront premiums once rather than annually',()=>{const r=calculateLoanOffer(100000,{...base,insuranceUpfront:5000});expect(r.insurance).toBe(5000);expect(r.upfront).toBe(5000)});
 it('keeps principal unchanged when cash fees increase',()=>{const a=calculateLoanOffer(100000,base),b=calculateLoanOffer(100000,{...base,feesUpfront:1200});expect(a.monthlyLoan).toBe(b.monthlyLoan);expect(b.cost-a.cost).toBeCloseTo(1200,6);expect(b.total-b.cost).toBeCloseTo(100000,6)});
 it('recognizes equal costs, including all ties',()=>{expect(compareLoanOffers(600000,[base,{...base},base]).lowest).toEqual([0,1,2])});
 it('ranks entered costs rather than nominal rates alone',()=>{const r=compareLoanOffers(100000,[{...base,rate:3,feesUpfront:50000},{...base,rate:3.5}]);expect(r.lowest).toEqual([1])});
 it('does not select a winner across different durations',()=>{const r=compareLoanOffers(100000,[base,{...base,years:10}]);expect(r.sameTerm).toBe(false);expect(r.lowest).toEqual([])});
 it('rejects missing, negative and non-finite inputs',()=>{for(const patch of [{rate:NaN},{years:0},{insuranceUpfront:-1},{insuranceMonthly:Infinity},{feesUpfront:NaN},{feesMonthly:-1}])expect(()=>calculateLoanOffer(100000,{...base,...patch})).toThrow();expect(()=>compareLoanOffers(0,[base,base])).toThrow()});
});
