"use client";
import {useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {loanCapacity,loanPrepayment,CAPACITY_EXAMPLE,PREPAYMENT_EXAMPLE} from '@/lib/loan-planning';
import {LoanRateSources} from './LoanOffers';
export default function LoanPlanning({kind}:{kind:'capacity'|'prepayment'}){
 const t=useTranslations('loanPlanningAudit'),locale=useLocale();const [capacity,setCapacity]=useState({...CAPACITY_EXAMPLE}),[prepayment,setPrepayment]=useState({...PREPAYMENT_EXAMPLE});const [strategy,setStrategy]=useState<'term'|'payment'>('term');
 const money=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
 let result:Record<string,number|null>|null=null;try{result=kind==='capacity'?loanCapacity(capacity):loanPrepayment({...prepayment,strategy})}catch{/* No result for invalid input. */}
 const input=kind==='capacity'?capacity:prepayment;
 const keys=kind==='capacity'?['grossBudget','loanBudget','capital','shortfall']:['monthly','balance','applied','unused','after','cashNeeded','newMonthly','lastPayment','newMonths','beforeInterest','afterInterest','savedInterest','fees','netSaving','recoveryMonths'];
 return <section id={'planning-'+kind} className="space-y-5"><h2 className="text-lg font-semibold">{t(kind+'Title')}</h2><p className="text-sm text-muted">{t(kind+'Intro')}</p>
 <div className="grid gap-4 rounded-xl border border-card-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(input).map(([key,value])=><label key={key} className="text-sm">{t(key)}<input id={kind+'-'+key} type="number" min={key==='years'||key==='month'?1:0} max={key==='years'?50:key==='month'?prepayment.years*12:key==='ratio'?100:key==='rate'?30:1e12} step={key==='years'||key==='month'?1:'any'} value={Number.isNaN(value)?'':value} onChange={e=>{const n=e.target.valueAsNumber;if(kind==='capacity')setCapacity({...capacity,[key]:n});else setPrepayment({...prepayment,[key]:n});}} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5"/></label>)}</div>
 {kind==='prepayment'&&<label className="block text-sm">{t('strategy')}<select id="prepayment-strategy" value={strategy} onChange={e=>setStrategy(e.target.value as 'term'|'payment')} className="mt-2 block w-full rounded-lg border border-input-border bg-input-bg p-3"><option value="term">{t('term')}</option><option value="payment">{t('payment')}</option></select></label>}
 {!result&&<p role="alert" className="text-red-700">{t('invalid')}</p>}
 {result&&<div id={kind+'-results'} className="rounded-xl border border-card-border bg-card p-5"><dl>{keys.map(key=><div key={key} className="flex flex-wrap justify-between gap-2 border-b border-card-border py-3"><dt className="text-sm">{t('result_'+key)}</dt><dd id={kind+'-result-'+key} className="font-semibold">{result[key]===null?t('notRecovered'):['newMonths','recoveryMonths'].includes(key)?result[key]+' '+t('months'):money(result[key]!)}</dd></div>)}</dl></div>}
 <div className="space-y-3 rounded-xl border border-card-border p-5 text-sm text-muted"><h3 className="font-semibold">{t('method')}</h3><p>{t(kind+'Method')}</p><p>{t(kind+'Limits')}</p>{kind==='prepayment'&&<p>{t('legal')}</p>}<a className="block text-energy underline" href="https://www.cssf.lu/fr/contrats-credit-immobilier/">{t('source')}</a></div><LoanRateSources/>
 </section>;
}
