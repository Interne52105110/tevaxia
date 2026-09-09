export interface MortgageComparisonInput { value:number; capital:number; years:number; rateA:number; rateB:number; ltvA:number; ltvB:number }
export const MORTGAGE_COMPARISON_EXAMPLE:MortgageComparisonInput={value:750000,capital:600000,years:25,rateA:3.5,rateB:3.5,ltvA:80,ltvB:80};
/** Constant-rate, monthly, end-of-period annuity. No fees, insurance or lender decision. */
export function compareMortgageConditions(input:MortgageComparisonInput){
 for(const key of Object.keys(MORTGAGE_COMPARISON_EXAMPLE) as (keyof MortgageComparisonInput)[]){
  if(!Number.isFinite(input[key]))throw new Error('Invalid input');
 }
 if(input.value<=0||input.value>1e12||input.capital<=0||input.capital>1e12||!Number.isInteger(input.years)||input.years<1||input.years>50||input.rateA<0||input.rateA>30||input.rateB<0||input.rateB>30||input.ltvA<0||input.ltvA>100||input.ltvB<0||input.ltvB>100)throw new Error('Invalid input');
 const months=input.years*12;
 const calculate=(rate:number,ltv:number)=>{
  const monthlyRate=rate/1200;
  const monthly=monthlyRate===0?input.capital/months:input.capital*monthlyRate/-Math.expm1(-months*Math.log1p(monthlyRate));
  const repaid=monthly*months;
  const ceiling=input.value*ltv/100;
  return {monthly,repaid,interest:Math.max(0,repaid-input.capital),ceiling,gap:Math.max(0,input.capital-ceiling)};
 };
 const a=calculate(input.rateA,input.ltvA),b=calculate(input.rateB,input.ltvB);
 return {a,b,monthlyDelta:b.monthly-a.monthly,interestDelta:b.interest-a.interest,ceilingDelta:b.ceiling-a.ceiling};
}
