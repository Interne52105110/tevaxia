import {compareMortgageConditions} from './energy-banking';
export interface LoanOffer {rate:number; years:number; insuranceUpfront:number; insuranceMonthly:number; feesUpfront:number; feesMonthly:number}
export const LOAN_OFFER_EXAMPLE:LoanOffer={rate:3.5,years:25,insuranceUpfront:0,insuranceMonthly:0,feesUpfront:0,feesMonthly:0};
export function calculateLoanOffer(capital:number,offer:LoanOffer){
 for(const key of ['insuranceUpfront','insuranceMonthly','feesUpfront','feesMonthly'] as const)if(!Number.isFinite(offer[key])||offer[key]<0||offer[key]>1e9)throw new Error('Invalid cost');
 const loan=compareMortgageConditions({value:capital,capital,years:offer.years,rateA:offer.rate,rateB:offer.rate,ltvA:100,ltvB:100}).a;
 const months=offer.years*12,insurance=offer.insuranceUpfront+offer.insuranceMonthly*months,fees=offer.feesUpfront+offer.feesMonthly*months;
 const cost=loan.interest+insurance+fees;
 return {monthlyLoan:loan.monthly,monthlyOutflow:loan.monthly+offer.insuranceMonthly+offer.feesMonthly,upfront:offer.insuranceUpfront+offer.feesUpfront,interest:loan.interest,insurance,fees,cost,total:capital+cost};
}
export function compareLoanOffers(capital:number,offers:LoanOffer[]){
 if(offers.length<2)throw new Error('At least two offers required');
 const results=offers.map(o=>calculateLoanOffer(capital,o));
 const sameTerm=offers.every(o=>o.years===offers[0].years);
 const lowestCents=Math.min(...results.map(r=>Math.round(r.cost*100)));
 return {results,sameTerm,lowest:sameTerm?results.flatMap((r,i)=>Math.round(r.cost*100)===lowestCents?[i]:[]):[]};
}
