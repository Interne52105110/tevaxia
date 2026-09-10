export interface RentalInsuranceBudgetInput {
 monthlyRent:number;
 monthlyCharges:number;
 lotCount:number;
 annualPremium:number|null;
}
function cents(n:number):number{
 if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>1e8||Math.abs(n*100-Math.round(n*100))>0.0001)throw new Error('Invalid insurance budget amount');
 return Math.round(n*100);
}
/** A cost comparison for user-supplied whole-portfolio quotes, not an insurance offer. */
export function rentalInsuranceBudget(input:RentalInsuranceBudgetInput){
 const rent=cents(input.monthlyRent),charges=cents(input.monthlyCharges);
 if(!Number.isInteger(input.lotCount)||input.lotCount<1||input.lotCount>500)throw new Error('Invalid lot count');
 const base=(rent+charges)*input.lotCount*12;
 if(!Number.isSafeInteger(base))throw new Error('Insurance budget too large');
 const premium=input.annualPremium===null?null:cents(input.annualPremium);
 return {
  annualBase:base/100,
  annualPremium:premium===null?null:premium/100,
  monthlyEquivalent:premium===null?null:premium/1200,
  premiumRate:premium===null||base===0?null:premium/base*100,
 };
}
