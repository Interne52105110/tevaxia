import { describe, expect, it } from 'vitest';
import { POST as fees } from '@/app/api/v1/propcalc/fees/route';
import { POST as mortgage } from '@/app/api/v1/propcalc/mortgage/route';
import { POST as rental } from '@/app/api/v1/propcalc/yield/route';
import { POST as cashflow } from '@/app/api/v1/propcalc/cashflow/route';
import { assertPropcalcApiInput, assertFinitePropcalcResult } from '../propcalc/api-input';
const cases = [
 ['fees',fees,{country:'lu',price:300000}],
 ['mortgage',mortgage,{country:'lu',monthlyIncome:5000,downPayment:50000,annualRate:.035,durationYears:20}],
 ['yield',rental,{country:'lu',purchasePrice:300000,monthlyRent:1500}],
 ['cashflow',cashflow,{country:'lu',propertyPrice:300000,downPayment:50000,monthlyRent:1500,annualRate:.035,durationYears:20}],
] as const;
const request=(value:unknown)=>new Request('https://tevaxia.lu/api/v1/propcalc/test',{method:'POST',body:JSON.stringify(value)});
for(const [name,post,valid] of cases)describe(name+' API input boundary',()=>{
 it.each([null,[], 'string', true, 12])('rejects a non-object payload %j without a server error',async value=>expect((await post(request(value))).status).toBe(400));
 it('rejects non-string countries and unknown fields before calculating',async()=>{
  for(const extra of [{country:{}},{country:12},{unexpected:true}])expect((await post(request({...valid,...extra}))).status).toBe(400);
 });
 it('accepts a valid scenario with finite results and no fictitious quota header',async()=>{
  const response=await post(request(valid));expect(response.status).toBe(200);const result=await response.json();expect(result.success).toBe(true);expect(result.data.currency).toBe("EUR");expect(result.assumptions).toBeTypeOf("object");expect(()=>assertFinitePropcalcResult(result.data)).not.toThrow();expect(response.headers.get('x-ratelimit-limit')).toBeNull();expect(response.headers.get('cache-control')).toBe('no-store');
 });
});
it('refuses wrong optional types and non-finite numeric values',()=>{
 for(const extra of [{isNew:'false'},{buyerAge:null},{loanAmount:Infinity},{price:1e13},{isPrimary:0}])expect(()=>assertPropcalcApiInput({country:'lu',price:300000,...extra},'fees')).toThrow();
 for(const extra of [{annualRate:'0.035'},{annualRate:NaN},{existingDebts:-1},{durationYears:0},{residencyStatus:'unknown'}])expect(()=>assertPropcalcApiInput({country:'lu',monthlyIncome:5000,...extra},'mortgage')).toThrow();
});
it('rejects rates outside the declared ratio unit and unknown tax regimes',async()=>{
 for(const extra of [{vacancyRate:5},{marginalRate:null},{managementRate:-.1},{taxRegime:'unknown'}])expect((await rental(request({country:'lu',purchasePrice:300000,monthlyRent:1500,...extra}))).status).toBe(400);
});
it('does not silently cap requested mortgage duration',async()=>{
 expect((await mortgage(request({country:'lu',monthlyIncome:5000,durationYears:50}))).status).toBe(400);
});
it('keeps zero interest valid and rejects undefined equity ratios and excess downpayment',async()=>{
 const input={country:'lu',propertyPrice:300000,downPayment:50000,monthlyRent:1500,annualRate:0,durationYears:20};expect((await cashflow(request(input))).status).toBe(200);
 for(const downPayment of [0,1000000])expect((await cashflow(request({...input,downPayment}))).status).toBe(400);
});
it('never serializes a non-finite result as an apparently valid null',()=>{expect(()=>assertFinitePropcalcResult({nested:[{value:NaN}]})).toThrow();expect(()=>assertFinitePropcalcResult({value:Infinity})).toThrow();});
