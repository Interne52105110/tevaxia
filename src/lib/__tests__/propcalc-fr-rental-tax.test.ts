import { expect, it } from 'vitest';
import { calculateFrenchRentalTax as calculate } from '../propcalc/french-rental-tax';
import { calculateTaxImpact } from '../propcalc/rental';
import { getCountryData } from '../propcalc/countries';
import { POST } from '@/app/api/v1/propcalc/yield/route';
const base={netRent:8000,annualRent:12000,purchasePrice:200000,marginalRate:.30};
const micro={...base,frenchMicroEligible:true,frenchNonProfessional:true};
const req=(body:object)=>new Request('https://tevaxia.lu/api/v1/propcalc/yield',{method:'POST',body:JSON.stringify(body)});
it('separates long-term furnished rental from unclassified tourism',()=>{
 const long=calculate({...micro,taxRegime:'micro_bic'}),tourism=calculate({...micro,taxRegime:'micro_bic_tourism_unclassified'});
 expect(long.taxableIncome).toBe(6000);expect(long.socialCharges).toBe(1116);expect(long.netAfterTax).toBe(5084);
 expect(tourism.taxableIncome).toBe(8400);expect(tourism.socialCharges).toBe(1562.4);
});
it('retains 17.2% for ordinary unfurnished income',()=>{
 const result=calculate({...micro,taxRegime:'micro_foncier'});expect(result.taxableIncome).toBe(8400);expect(result.socialCharges).toBe(1444.8);
});
it.each(['micro_bic','micro_bic_tourism','micro_bic_tourism_unclassified'])('applies the aggregate 305 EUR minimum allowance to %s',regime=>{
 expect(calculate({...micro,annualRent:300,netRent:200,taxRegime:regime}).totalTax).toBe(0);
 expect(calculate({...micro,annualRent:400,netRent:200,taxRegime:regime}).taxableIncome).toBe(95);
});
it('does not apply the BIC minimum to micro-foncier',()=>expect(calculate({...micro,annualRent:300,netRent:200,taxRegime:'micro_foncier'}).taxableIncome).toBe(210));
it('still taxes micro receipts when the economic result is negative',()=>{
 const result=calculate({...micro,netRent:-1000,taxRegime:'micro_bic'});expect(result.totalTax).toBe(2916);expect(result.netAfterTax).toBe(-3916);
 const routed=calculateTaxImpact({...micro,netRent:-1000,taxRegime:'micro_bic',countryCode:'fr',socialChargesRate:0,countryData:getCountryData('fr')}) as {totalTax:number};expect(routed.totalTax).toBe(2916);
});
it('preserves real-regime losses without inventing an immediate tax credit',()=>{
 const result=calculate({...base,netRent:-1000,taxRegime:'reel_foncier'});expect(result.netAfterTax).toBe(-1000);expect(result.totalTax).toBe(0);
});
it('does not deduct actual expenses or interest twice under micro',()=>{
 const result=calculate({...micro,taxRegime:'micro_bic',annualMortgageInterest:2000});expect(result.taxableIncome).toBe(6000);expect(result.mortgageInterestDeduction).toBe(0);
 expect(calculate({...base,taxRegime:'reel_foncier',annualMortgageInterest:2000}).taxableIncome).toBe(6000);
});
it.each([2025,2026])('exposes the correct reference year and furnished threshold for %s',taxYear=>{
 const result=calculate({...micro,taxRegime:'micro_bic',taxYear});expect(result.frenchTaxAssumptions.microReferenceThreshold).toBe(taxYear===2025?77700:83600);expect(result.socialCharges).toBe(1116);
});
it('does not infer micro-BIC eligibility from current receipts alone',()=>{
 expect(()=>calculate({...base,taxRegime:'micro_bic',frenchNonProfessional:true})).toThrow(/frenchMicroEligible/);
 expect(calculate({...micro,taxRegime:'micro_bic',annualRent:90000}).frenchTaxAssumptions.microEligibilityConfirmed).toBe(true);
});
it('requires a non-professional scenario and refuses unsupported activity contributions',()=>{
 expect(()=>calculate({...base,taxRegime:'micro_bic',frenchMicroEligible:true})).toThrow(/non-professional/);
 expect(()=>calculate({...micro,taxRegime:'micro_bic_tourism',annualRent:23001})).toThrow(/activity/);
 expect(()=>calculate({...micro,taxRegime:'micro_bic_tourism_unclassified',annualRent:23001})).toThrow(/activity/);
});
it('checks micro-foncier annual threshold and rejects unsupported regimes, years and depreciation',()=>{
 for(const extra of [{taxRegime:'micro_foncier',annualRent:15001},{taxYear:2024},{taxYear:2027},{taxRegime:'unknown'},{annualDepreciation:100},{annualRent:NaN},{frenchSocialRegime:'activity'}])expect(()=>calculate({...micro,...extra})).toThrow();
});
it('models solidarity-only contributions explicitly without assuming exemption from nationality',()=>{
 expect(calculate({...micro,taxRegime:'micro_bic',frenchSocialRegime:'solidarity_only'}).socialCharges).toBe(450);
 expect(calculate({...micro,taxRegime:'micro_foncier',frenchSocialRegime:'solidarity_only'}).socialCharges).toBe(630);
});
it('uses modeled receipts after vacancy rather than taxing vacant rent',async()=>{
 const response=await POST(req({country:'fr',purchasePrice:200000,monthlyRent:1000,vacancyRate:.5,taxRegime:'micro_bic',frenchMicroEligible:true,frenchNonProfessional:true}));expect(response.status).toBe(200);
 const json=await response.json();expect(json.data.tax.taxableIncome).toBe(3000);expect(json.assumptions.annualTaxReceipts).toBe(6000);expect(json.assumptions.socialChargesRate).toBe(.186);
});
it('accepts explicit aggregate tax receipts including taxable tenant charges',async()=>{
 const response=await POST(req({country:'fr',purchasePrice:200000,monthlyRent:1000,annualTaxReceipts:15000,taxRegime:'micro_bic',frenchMicroEligible:true,frenchNonProfessional:true,taxYear:2025}));const json=await response.json();expect(response.status).toBe(200);expect(json.data.tax.taxableIncome).toBe(7500);expect(json.assumptions.frenchTax.incomeYear).toBe(2025);
});
it('defaults visibly to an unfurnished real-expense scenario, never an unqualified micro regime',async()=>{
 const response=await POST(req({country:'fr',purchasePrice:200000,monthlyRent:2000}));const json=await response.json();expect(response.status).toBe(200);expect(json.assumptions.taxRegime).toBe('reel_foncier');expect(json.assumptions.frenchTax.incomeYear).toBe(2026);
});
it('rejects missing micro qualification and French fields for another country',async()=>{
 expect((await POST(req({country:'fr',purchasePrice:200000,monthlyRent:1000,taxRegime:'micro_bic'}))).status).toBe(400);
 expect((await POST(req({country:'lu',purchasePrice:200000,monthlyRent:1000,taxYear:2026}))).status).toBe(400);
});
