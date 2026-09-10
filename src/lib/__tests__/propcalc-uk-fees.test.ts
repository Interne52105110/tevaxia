import { expect, it } from 'vitest';
import { POST } from '@/app/api/v1/propcalc/fees/route';
import { POST as cashflow } from '@/app/api/v1/propcalc/cashflow/route';
const req=(body: object)=>new Request('https://tevaxia.lu/api/v1/propcalc/fees',{method:'POST',body:JSON.stringify(body)});
async function calculate(extra: object){const response=await POST(req({country:'uk',price:400000,...extra}));return{status:response.status,...await response.json()};}
it.each(['ENG','NIR'])('matches the official standard SDLT example for %s',async region=>expect((await calculate({region,price:295000})).data.totalFees).toBe(4750));
it('does not infer additional-property liability from the absence of main-residence use',async()=>{
 expect((await calculate({isPrimary:false})).data.totalFees).toBe(10000);
 expect((await calculate({isPrimary:true,ukAdditionalProperty:true})).data.totalFees).toBe(30000);
 expect((await calculate({isPrimary:true,ukAdditionalProperty:false})).data.totalFees).toBe(10000);
});
it('adds the non-resident surcharge to standard, additional and first-buyer rates',async()=>{
 expect((await calculate({ukNonResident:true})).data.totalFees).toBe(18000);
 expect((await calculate({ukNonResident:true,ukAdditionalProperty:true})).data.totalFees).toBe(38000);
 expect((await calculate({ukNonResident:true,isFirstTime:true,isPrimary:true})).data.totalFees).toBe(13000);
});
it('requires primary-residence use for first-buyer relief and respects the price ceiling',async()=>{
 expect((await calculate({isFirstTime:true,isPrimary:false})).data.totalFees).toBe(10000);
 expect((await calculate({isFirstTime:true,isPrimary:true,price:500000})).data.totalFees).toBe(10000);
 const over=await calculate({isFirstTime:true,isPrimary:true,price:500001});expect(over.data.totalFees).toBe(15000.05);expect(over.acquisitionCoverage.firstBuyerReliefApplied).toBe(false);
 expect((await calculate({isFirstTime:true,ukAdditionalProperty:true})).status).toBe(400);
});
it('uses the separate Welsh higher-rate bands from December 2024',async()=>{
 expect((await calculate({region:'WLS',price:260000})).data.totalFees).toBe(2100);
 expect((await calculate({region:'WLS',price:260000,ukAdditionalProperty:true})).data.totalFees).toBe(15950);
 expect((await calculate({region:'WLS',price:260000,isFirstTime:true,isPrimary:true,ukNonResident:true})).data.totalFees).toBe(2100);
});
it('matches Scottish official examples and keeps ADS separate from first-buyer relief',async()=>{
 expect((await calculate({region:'SCT',price:235000})).data.totalFees).toBe(1800);
 expect((await calculate({region:'SCT',price:875000})).data.totalFees).toBe(63350);
 expect((await calculate({region:'SCT',price:175000,isFirstTime:true,isPrimary:true})).data.totalFees).toBe(0);
 expect((await calculate({region:'SCT',price:175000,ukAdditionalProperty:true,ukNonResident:true})).data.totalFees).toBe(14600);
});
it.each([['ENG',2800],['NIR',2800],['SCT',3200],['WLS',2000]])('applies the 40000 GBP surcharge boundary in %s',async(region,expected)=>{
 expect((await calculate({region,price:39999,ukAdditionalProperty:true,ukNonResident:true})).data.totalFees).toBe(0);
 expect((await calculate({region,price:40000,ukAdditionalProperty:true,ukNonResident:true})).data.totalFees).toBe(expected);
});
it('reports the assumed jurisdiction and does not invent ancillary costs',async()=>{
 const json=await calculate({});expect(json.acquisitionCoverage.region).toBe('ENG');expect(json.acquisitionCoverage.defaultRegionAssumed).toBe(true);expect(json.acquisitionCoverage.status).toBe('partial');expect(json.acquisitionCoverage.excludedCosts).toContain('conveyancing');expect(json.data.breakdown).toHaveLength(1);
});
it('rejects unknown jurisdictions, wrong flag types and UK flags in another country',async()=>{
 for(const extra of [{region:'unknown'},{ukNonResident:1},{ukAdditionalProperty:'false'},{country:'fr',ukAdditionalProperty:true}])expect((await calculate(extra)).status).toBe(400);
});
it('makes the UK cashflow scenario an explicit additional purchase in England',async()=>{
 const response=await cashflow(req({country:'uk',propertyPrice:400000,downPayment:100000,monthlyRent:1800,annualRate:.04,durationYears:25}));expect(response.status).toBe(200);const json=await response.json();expect(json.data.totalInvestment).toBe(430000);expect(json.acquisitionCoverage.additionalPropertyAssumption).toBe(true);expect(json.data.currency).toBe('GBP');
});
