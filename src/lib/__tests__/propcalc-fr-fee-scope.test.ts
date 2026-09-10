import { expect, it } from 'vitest';
import { POST as fees } from '@/app/api/v1/propcalc/fees/route';
import { POST as cashflow } from '@/app/api/v1/propcalc/cashflow/route';
const req=(body: object)=>new Request('https://tevaxia.lu/api/v1/propcalc/fees',{method:'POST',body:JSON.stringify(body)});
const base={country:'fr',price:240000,region:'75',isNew:true};
it('does not infer VAT eligibility from building age',async()=>{
 expect((await fees(req(base))).status).toBe(400);
 const response=await fees(req({...base,frenchVatOnFullPrice:false}));expect(response.status).toBe(200);
 const json=await response.json();expect(json.data.breakdown[0].amount).toBe(15164.4);expect(json.acquisitionCoverage.reducedRate).toBe(false);
});
it.each([.055,.1,.2])('uses the price excluding declared VAT at %s, without adding VAT twice',async vatRate=>{
 const response=await fees(req({...base,price:200000*(1+vatRate),frenchVatOnFullPrice:true,frenchVatRate:vatRate}));expect(response.status).toBe(200);
 const json=await response.json();expect(json.data.breakdown[0].amount).toBe(1429.96);expect(json.acquisitionCoverage.saleVatRate).toBe(vatRate);
});
it.each([{}, {frenchVatRate:.19}, {frenchVatRate:0}, {frenchVatRate:'0.2'}])('requires an explicit supported rate: %j',async extra=>{
 expect((await fees(req({...base,frenchVatOnFullPrice:true,...extra}))).status).toBe(400);
});
it('does not accept irrelevant VAT qualifiers',async()=>{
 for(const extra of [{isNew:false,frenchVatOnFullPrice:true,frenchVatRate:.2},{frenchVatOnFullPrice:false,frenchVatRate:.2},{country:'lu',frenchVatOnFullPrice:true,frenchVatRate:.2}]) expect((await fees(req({...base,...extra}))).status).toBe(400);
});
it('does not invent a full guarantee cost from a registration rate',async()=>{
 const response=await fees(req({...base,isNew:false,loanAmount:200000}));const json=await response.json();
 expect(json.data.breakdown.some((item:{label:string})=>item.label==='fees.mortgageRegistration')).toBe(false);
 expect(json.acquisitionCoverage.status).toBe('partial');expect(json.acquisitionCoverage.excludedCosts).toContain('loanGuarantee');
});
it('adds only the supplied guarantee quote and keeps all other omissions explicit',async()=>{
 const response=await fees(req({...base,frenchVatOnFullPrice:true,frenchVatRate:.2,loanAmount:200000,loanGuaranteeCost:3000}));const json=await response.json();
 expect(response.status).toBe(200);expect(json.data.totalFees).toBe(7447.78);expect(json.acquisitionCoverage.excludedCosts).not.toContain('loanGuarantee');expect(json.acquisitionCoverage.excludedCosts).toContain('formalities');
});
it('distinguishes an explicit free guarantee from an unknown price and rejects quotes without financing',async()=>{
 const response=await fees(req({...base,isNew:false,loanAmount:200000,loanGuaranteeCost:0}));const json=await response.json();
 expect(json.data.breakdown.at(-1).amount).toBe(0);expect(json.acquisitionCoverage.excludedCosts).not.toContain('loanGuarantee');
 expect((await fees(req({...base,isNew:false,loanGuaranteeCost:1000}))).status).toBe(400);
});
it('does not charge ordinary CSI in the modeled local land-register case',async()=>{
 const response=await fees(req({...base,isNew:false,region:'67'}));const json=await response.json();
 expect(json.data.breakdown.some((item:{label:string})=>item.label==='fees.csi')).toBe(false);expect(json.acquisitionCoverage.excludedCosts).toContain('localLandRegisterPublication');
});
it('carries supplied financing cost and incomplete-cost coverage through the cashflow API',async()=>{
 const input={country:'fr',propertyPrice:240000,downPayment:60000,monthlyRent:1000,annualRate:.03,durationYears:20};
 const a=await(await cashflow(req(input))).json();const b=await(await cashflow(req({...input,loanGuaranteeCost:3000}))).json();
 expect(b.data.totalInvestment-a.data.totalInvestment).toBeCloseTo(3000,2);expect(a.acquisitionCoverage.excludedCosts).toContain('loanGuarantee');expect(b.acquisitionCoverage.excludedCosts).not.toContain('loanGuarantee');expect(b.acquisitionCoverage.status).toBe('partial');
});
