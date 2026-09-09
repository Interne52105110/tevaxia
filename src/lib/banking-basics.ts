import {calculerMensualite,genererTableauAmortissement} from './calculations';
import type {EnergyAuditReport} from '../components/energy/EnergyAuditPdf';
export const AMORTIZATION_EXAMPLE={capital:600000,rate:3.5,years:25};
export function amortization(i:typeof AMORTIZATION_EXAMPLE){
 if(i.capital<=0 || !Number.isInteger(i.years))throw new RangeError('Invalid principal or years');
 const monthly=calculerMensualite(i.capital,i.rate/100,i.years),schedule=genererTableauAmortissement(i.capital,i.rate/100,i.years);
 const interest=schedule.reduce((n,r)=>n+r.interets,0);
 const annual=[];
 for(let j=0;j<schedule.length;j+=12){const rows=schedule.slice(j,j+12);annual.push({year:j/12+1,repaid:rows.reduce((n,r)=>n+r.capital,0),interest:rows.reduce((n,r)=>n+r.interets,0),remaining:rows[rows.length-1].capitalRestant});}
 return {monthly,interest,total:i.capital+interest,annual};
}
export function bankingMoney(n:number,locale:string){return new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);}
export function buildAmortizationReport(i:typeof AMORTIZATION_EXAMPLE,t:(key:string)=>string,locale:string):EnergyAuditReport{
 const r=amortization(i),money=(n:number)=>bankingMoney(n,locale);
 return {title:t('amortizationTitle'),sections:[{title:t('method'),text:t('amortizationIntro')},
 {title:t('amortizationTitle'),rows:[{label:t('capital'),value:money(i.capital)},{label:t('rate'),value:new Intl.NumberFormat(locale==='lb'?'de-DE':locale).format(i.rate)+' %'},{label:t('years'),value:String(i.years)},...(['monthly','interest','total'] as const).map(k=>({label:t(k),value:money(r[k])}))]},
 ...r.annual.map(y=>({title:t('year')+' '+y.year,keepTogether:true,rows:(['repaid','interest','remaining'] as const).map(k=>({label:t(k),value:money(y[k])}))}))],sources:['https://www.cssf.lu/fr/contrats-credit-immobilier/']};
}
