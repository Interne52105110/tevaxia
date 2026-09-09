import type {EnergyAuditReport} from '../components/energy/EnergyAuditPdf';
export const HVAC_SCENARIO_EXAMPLE={heatBefore:18000,heatAfter:18000,factorBefore:.9,factorAfter:3.5,priceBefore:.1,priceAfter:.25,maintenanceBefore:200,maintenanceAfter:250,extraBefore:0,extraAfter:0,designLoad:10,ratedPower:10,grant:0,years:20};
export type HvacScenario=typeof HVAC_SCENARIO_EXAMPLE;
export const HVAC_LOTS=['lot1','lot2','lot3','lot4','lot5','lot6','lot7','other'] as const;
export type HvacQuotes=Record<typeof HVAC_LOTS[number],number>;
export const EMPTY_HVAC_QUOTES:HvacQuotes={lot1:0,lot2:0,lot3:0,lot4:0,lot5:0,lot6:0,lot7:0,other:0};
export const HVAC_SOURCES=['https://www.klima-agence.lu/sites/default/files/2023-09/Guide%20pratique_Pompe_a_chaleur_FR_26.09.23.pdf','https://aides.klima-agence.lu/'];
export function compareHvac(i:HvacScenario,quotes:HvacQuotes){
 for(const n of [...Object.values(i),...HVAC_LOTS.map(k=>quotes[k])])if(!Number.isFinite(n)||n<0||n>1e12)throw new RangeError('Invalid input');
 if(i.factorBefore<=0||i.factorAfter<=0||i.factorBefore>10||i.factorAfter>10||!Number.isInteger(i.years)||i.years<1||i.years>50)throw new RangeError('Invalid performance or horizon');
 const budget=HVAC_LOTS.reduce((n,k)=>n+quotes[k],0);if(i.grant>budget)throw new RangeError('Grant exceeds quoted cost');
 const purchasedBefore=i.heatBefore/i.factorBefore,purchasedAfter=i.heatAfter/i.factorAfter;
 const costBefore=purchasedBefore*i.priceBefore+i.maintenanceBefore+i.extraBefore,costAfter=purchasedAfter*i.priceAfter+i.maintenanceAfter+i.extraAfter;
 const saving=costBefore-costAfter,netBudget=budget-i.grant;
 const payback=budget>0&&saving>0&&netBudget/saving<=i.years?netBudget/saving:null;
 return {purchasedBefore,purchasedAfter,costBefore,costAfter,saving,budget,netBudget,payback,balance:budget>0?saving*i.years-netBudget:null,powerGap:i.ratedPower-i.designLoad};
}
export function formatHvacValue(key:string,n:number|null,locale:string,t:(key:string)=>string){
 if(n===null)return t('notReached');
 const fmt=new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{maximumFractionDigits:2}).format(n);
 return fmt+(key.startsWith('purchased')?' kWh':key==='powerGap'?' kW':key==='payback'?' '+t('yearUnit'):' EUR');
}
export function buildHvacReport(i:HvacScenario,quotes:HvacQuotes,t:(key:string)=>string,lot:(key:string)=>string,locale:string):EnergyAuditReport{
 const r=compareHvac(i,quotes),fmt=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{maximumFractionDigits:4}).format(n);
 return {title:t('title'),sections:[{title:t('method'),text:t('intro')+' '+t('energyNote')+' '+t('powerNote')},
 {title:t('inputs'),rows:Object.entries(i).map(([k,v])=>({label:t(k),value:fmt(v)}))},
 {title:t('quotes'),keepTogether:true,text:t('quoteNote'),rows:HVAC_LOTS.map(k=>({label:k==='other'?t('other'):lot('lots.'+k),value:fmt(quotes[k])+' EUR'}))},
 {title:t('results'),rows:Object.entries(r).map(([k,v])=>({label:t(k),value:formatHvacValue(k,v,locale,t)}))},
 {title:t('limits'),text:t('financialNote')+' '+t('aidNote')+(r.budget===0?' '+t('missingBudget'):'')}
 ],sources:HVAC_SOURCES};
}
