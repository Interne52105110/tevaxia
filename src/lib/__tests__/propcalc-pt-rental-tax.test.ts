import { expect, it } from 'vitest';
import { calculatePortugueseRentalTax as calculate } from '../propcalc/portuguese-rental-tax';
import { POST } from '@/app/api/v1/propcalc/yield/route';
const base = { netRent: 8000, purchasePrice: 200000, portugueseCategoryFConfirmed: true, portugueseRentalUse: 'housing', portugueseAnnualTaxReceipts: 12000, portugueseDeductibleExpenses: 2000, portugueseModerateRentEligible: false };
const api = { country: 'pt', purchasePrice: 200000, monthlyRent: 1000, portugueseCategoryFConfirmed: true, portugueseRentalUse: 'housing', portugueseAnnualTaxReceipts: 12000, portugueseDeductibleExpenses: 2000, portugueseModerateRentEligible: false };
const req = (data: object) => new Request('https://example.test/api/v1/propcalc/yield', { method: 'POST', body: JSON.stringify(data) });
it.each(['flat_resident','flat_nonresident'])('uses 25%% residential category F for %s', taxRegime => {
 const result = calculate({...base,taxRegime});expect(result.taxableIncome).toBe(10000);expect(result.totalTax).toBe(2500);expect(result.netAfterTax).toBe(5500);
});
it.each(['flat_resident','flat_nonresident'])('uses 28%% for other category F rental for %s', taxRegime => expect(calculate({...base,taxRegime,portugueseRentalUse:'other'}).totalTax).toBe(2800));
it('applies qualified 2026 moderate-rent relief at 10% to fiscal net income',()=>{
 const result=calculate({...base,portugueseModerateRentEligible:true});expect(result.totalTax).toBe(1000);expect(result.portugueseTaxAssumptions.moderateRentReliefApplied).toBe(true);
});
it('does not infer moderate-rent eligibility from annual receipts',()=>expect(()=>calculate({...base,portugueseModerateRentEligible:undefined})).toThrow(/Explicitly confirm/));
it.each([{taxYear:2025},{portugueseRentalUse:'other'}])('rejects relief outside its supported year or use',extra=>expect(()=>calculate({...base,...extra,portugueseModerateRentEligible:true})).toThrow(/only/));
it('uses explicit marginal rate for englobamento without stacking autonomous relief',()=>{
 const result=calculate({...base,taxRegime:'progressive_resident',marginalRate:.42,portugueseModerateRentEligible:true});expect(result.totalTax).toBe(4200);expect(result.portugueseTaxAssumptions.moderateRentReliefApplied).toBe(false);
});
it('keeps tax despite negative economic cash income when fiscal expenses differ',()=>{
 const result=calculate({...base,netRent:-1000});expect(result.totalTax).toBe(2500);expect(result.netAfterTax).toBe(-3500);
});
it('does not manufacture a tax refund for a fiscal loss',()=>{
 const result=calculate({...base,netRent:-1000,portugueseDeductibleExpenses:15000});expect(result.taxableIncome).toBe(0);expect(result.netAfterTax).toBe(-1000);
});
it('preserves explicit zero and cent precision',()=>{
 expect(calculate({...base,portugueseAnnualTaxReceipts:0,portugueseDeductibleExpenses:0}).totalTax).toBe(0);
 expect(calculate({...base,portugueseAnnualTaxReceipts:12000.37}).totalTax).toBe(2500.09);
});
it('does not deduct financing or depreciation',()=>{
 for(const extra of [{annualMortgageInterest:1000},{annualDepreciation:1000}])expect(()=>calculate({...base,...extra})).toThrow(/does not deduct/);
});
it('requires fiscal inputs and qualification independently from modeled costs',()=>{
 for(const extra of [{portugueseCategoryFConfirmed:false},{portugueseAnnualTaxReceipts:undefined},{portugueseDeductibleExpenses:undefined},{portugueseDeductibleExpenses:-1},{portugueseAnnualTaxReceipts:NaN},{portugueseRentalUse:'short_let'},{taxYear:2027},{taxRegime:'long_duration'}])expect(()=>calculate({...base,...extra})).toThrow();
});
it('supports 2025 ordinary category F without requiring a 2026 qualification',()=>expect(calculate({...base,taxYear:2025,portugueseModerateRentEligible:undefined}).totalTax).toBe(2500));
it('routes API to fiscal receipts/expenses independently from vacancy and charges',async()=>{
 const response=await POST(req({...api,vacancyRate:.5,monthlyCharges:600}));expect(response.status).toBe(200);const result=await response.json();expect(result.data.netRent).toBe(-1200);expect(result.data.tax.taxableIncome).toBe(10000);expect(result.data.tax.totalTax).toBe(2500);expect(result.data.netAfterTax).toBe(-3700);expect(result.assumptions.portugueseTax.incomeYear).toBe(2026);
});
it('returns qualified relief and a year-specific result through API',async()=>{
 const response=await POST(req({...api,country:'PT',portugueseModerateRentEligible:true,taxYear:2026}));expect(response.status).toBe(200);expect((await response.json()).data.tax.totalTax).toBe(1000);
});
it('rejects missing qualification, wrong field types and foreign-country use through API',async()=>{
 for(const extra of [{portugueseModerateRentEligible:undefined},{portugueseCategoryFConfirmed:'true'},{portugueseDeductibleExpenses:null},{country:'it'},{country:'fr'}])expect((await POST(req({...api,...extra}))).status).toBe(400);
});
