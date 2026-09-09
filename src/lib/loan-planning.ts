export function loanPayment(capital:number,annualPercent:number,months:number){
 const r=annualPercent/1200;return r===0?capital/months:capital*r/-Math.expm1(-months*Math.log1p(r));
}
function nonnegative(n:number,max=1e12){if(!Number.isFinite(n)||n<0||n>max)throw new Error('Invalid amount')}
function term(rate:number,years:number){nonnegative(rate,30);if(!Number.isInteger(years)||years<1||years>50)throw new Error('Invalid term')}
export const CAPACITY_EXAMPLE={income:5000,existing:500,ratio:40,rate:3.5,years:25,insurance:0,monthlyFees:0};
export function loanCapacity(i:typeof CAPACITY_EXAMPLE){
 for(const k of ['income','existing','insurance','monthlyFees'] as const)nonnegative(i[k]);nonnegative(i.ratio,100);term(i.rate,i.years);
 const grossBudget=Math.max(0,i.income*i.ratio/100-i.existing),loanBudget=Math.max(0,grossBudget-i.insurance-i.monthlyFees);
 const capital=loanBudget/loanPayment(1,i.rate,i.years*12);
 const shortfall=Math.max(0,i.existing+i.insurance+i.monthlyFees-i.income*i.ratio/100);
 return {grossBudget,loanBudget,capital,shortfall};
}
export const PREPAYMENT_EXAMPLE={capital:600000,rate:3.5,years:25,month:60,amount:100000,fees:0};
export type PrepaymentScenario=typeof PREPAYMENT_EXAMPLE & {strategy:'term'|'payment'};
/** Payment at period end, repayment immediately AFTER the selected regular instalment. */
export function loanPrepayment(i:PrepaymentScenario){
 for(const k of ['capital','amount','fees'] as const)nonnegative(i[k]);if(i.capital===0)throw new Error('Missing capital');term(i.rate,i.years);
 const months=i.years*12;if(!Number.isInteger(i.month)||i.month<1||i.month>months||!['term','payment'].includes(i.strategy))throw new Error('Invalid timing or strategy');
 const monthly=loanPayment(i.capital,i.rate,months),r=i.rate/1200;
 let balance=i.capital;
 for(let m=1;m<=i.month;m++)balance=m===months?0:Math.max(0,balance*(1+r)-monthly);
 const applied=Math.min(i.amount,balance),unused=i.amount-applied,after=balance-applied,remaining=months-i.month;
 const fees=applied>0?i.fees:0;
 const newMonthly=after===0?0:i.strategy==='term'?monthly:loanPayment(after,i.rate,remaining);
 let beforeBalance=balance,afterBalance=after,beforeInterest=0,afterInterest=0,newMonths=0,lastPayment=0,recoveryMonths:number|null=fees===0?0:null;
 const tolerance=1e-6;
 for(let m=1;m<=remaining;m++){
  const ib=beforeBalance*r,ia=afterBalance*r;beforeInterest+=ib;afterInterest+=ia;
  beforeBalance=Math.max(0,beforeBalance+ib-monthly);
  if(afterBalance>tolerance){lastPayment=m===remaining?afterBalance+ia:Math.min(newMonthly,afterBalance+ia);afterBalance=Math.max(0,afterBalance+ia-lastPayment);newMonths=m;if(afterBalance<tolerance)afterBalance=0;}
  if(recoveryMonths===null&&beforeInterest-afterInterest>=fees)recoveryMonths=m;
 }
 const savedInterest=Math.max(0,beforeInterest-afterInterest);
 return {monthly,balance,applied,unused,after,remaining,newMonthly,newMonths,lastPayment,beforeInterest,afterInterest,savedInterest,fees,netSaving:savedInterest-fees,cashNeeded:applied+fees,recoveryMonths};
}
