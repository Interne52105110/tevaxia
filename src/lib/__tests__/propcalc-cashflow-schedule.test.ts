import { expect, it } from 'vitest';
import { calculateInvestorCashFlow } from '@/lib/propcalc/cashflow';
const base = { propertyPrice: 12000, downPayment: 2000, annualRate: 0, loanDurationYears: 1, monthlyRent: 100, marginalTaxRate: 0 };
it('settles a zero-interest loan with the final four-cent adjustment', () => {
 const r=calculateInvestorCashFlow(base);
 expect(r.monthlyMortgage).toBe(833.33);expect(r.annualMortgage).toBe(10000);
 expect(r.projection[0].remainingLoan).toBe(0);expect(r.projection[0].principalPaid).toBe(10000);
 expect(r.projection[1].annualMortgage).toBe(0);
});
it('uses the same first-year cash flow for summary and projection, and starts indexation in year two',()=>{
 const r=calculateInvestorCashFlow({...base,annualRate:.06,loanDurationYears:2});
 expect(r.projection[0].grossAnnualRent).toBe(1200);expect(r.projection[1].grossAnnualRent).toBe(1224);
 expect(r.cashFlowAfterTax).toBe(r.projection[0].annualCashFlow);
 expect(r.projection[0].cumulativeCashFlow).toBe(r.cashFlowAfterTax);
 expect(r.annualInterest).toBeLessThan(600);expect(r.annualInterest).toBeGreaterThan(450);
 expect(r.projection[1].remainingLoan).toBe(0);
 expect(r.projection.slice(0,2).reduce((sum,p)=>sum+p.principalPaid,0)).toBeCloseTo(10000,2);
});
it('handles a final partial year of six monthly payments',()=>{
 const r=calculateInvestorCashFlow({...base,loanDurationYears:1.5});
 expect(r.projection[0].annualMortgage).toBe(6666.72);
 expect(r.projection[1].annualMortgage).toBe(3333.28);
 expect(r.projection[1].remainingLoan).toBe(0);expect(r.projection[2].annualMortgage).toBe(0);
});
it('does not infer depreciation from a national regime or invented land split',()=>{
 const r=calculateInvestorCashFlow({...base,countryData:{rentalTax:{depreciation:{post1925:{years:50}}}}});
 expect(r.annualDepreciation).toBe(0);
});
it('applies the UK profit cap and identical relief in each projection year',()=>{
 const r=calculateInvestorCashFlow({...base,annualRate:.12,loanDurationYears:20,monthlyRent:10,marginalTaxRate:.4,countryCode:'uk'});
 expect(r.incomeTax).toBe(24);expect(r.projection[0].incomeTax).toBe(24);
 expect(r.projection[1].incomeTax).toBe(24.48);
});
it('compares leverage with the tax of an unfinanced purchase',()=>{
 const r=calculateInvestorCashFlow({...base,annualRate:.06,loanDurationYears:2,marginalTaxRate:.3});
 const expected=r.cashFlowAfterTax/2000-(1200-360)/12000;
 expect(r.leverageEffect).toBeCloseTo(expected,4);
});
it.each([{propertyPrice:0},{monthlyRent:-1},{annualRate:NaN},{downPayment:13000},{loanDurationYears:1.01},{vacancyRate:1.1}])('rejects invalid scenario %j',input=>{
 expect(()=>calculateInvestorCashFlow({...base,...input})).toThrow(RangeError);
});
it('preserves a negative result in cents and permits an unfinanced core scenario',()=>{
 const r=calculateInvestorCashFlow({...base,downPayment:12000,monthlyRent:10.01,annualInsurance:200.05});
 expect(r.loanAmount).toBe(0);expect(r.cashFlowAfterTax).toBe(-79.93);expect(r.monthlyCashFlow).toBe(-6.66);
});
