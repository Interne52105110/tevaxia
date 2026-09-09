"use client";
import {useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {compareMortgageConditions,MORTGAGE_COMPARISON_EXAMPLE,type MortgageComparisonInput} from "@/lib/energy-banking";
export default function MortgageConditions(){
 const t=useTranslations('mortgageConditionsAudit'),locale=useLocale();
 const [input,setInput]=useState({...MORTGAGE_COMPARISON_EXAMPLE});
 let result=null;try{result=compareMortgageConditions(input)}catch{/* Invalid inputs do not produce results. */}
 const money=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
 const keys=Object.keys(MORTGAGE_COMPARISON_EXAMPLE) as (keyof MortgageComparisonInput)[];
 return <section id="mortgage-conditions" className="space-y-6">
  <div className="rounded-xl border border-card-border bg-card p-5"><h2 className="font-semibold text-lg">{t('title')}</h2><p className="mt-3 text-sm text-muted">{t('intro')}</p><p className="mt-3 text-sm text-muted">{t('example')}</p>
   <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{keys.map(key=><label key={key} className="text-sm">{t(key)}<input id={'mortgage-'+key} type="number" step={key==='years'?1:'any'} min={key==='years'?1:0} max={key==='years'?50:key.startsWith('rate')?30:key.startsWith('ltv')?100:1e12} value={Number.isNaN(input[key])?'':input[key]} onChange={e=>setInput({...input,[key]:e.target.valueAsNumber})} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5"/></label>)}</div>
  </div>
  {!result&&<p role="alert" className="text-red-700">{t('invalid')}</p>}
  {result&&<div id="mortgage-results" className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{(['a','b'] as const).map(side=><div key={side} className="rounded-xl border border-card-border bg-card p-5"><h3 className="font-semibold">{t(side)}</h3><dl>{(['monthly','interest','repaid','ceiling','gap'] as const).map(key=><div key={key} className="flex flex-wrap justify-between gap-2 border-b border-card-border py-3"><dt className="text-sm">{t(key)}</dt><dd id={'mortgage-'+side+'-'+key} className="font-semibold">{money(result[side][key])}</dd></div>)}</dl>{result[side].gap>0&&<p className="mt-3 text-sm text-amber-800">{t('gapNote')}</p>}</div>)}</div>
   <div className="rounded-xl border border-card-border p-5"><h3 className="font-semibold">{t('difference')}</h3><dl>{(['monthlyDelta','interestDelta','ceilingDelta'] as const).map(key=><div key={key} className="flex flex-wrap justify-between gap-2 py-2"><dt>{t(key)}</dt><dd id={'mortgage-'+key} className="font-semibold">{money(result[key])}</dd></div>)}</dl></div>
  </div>}
  <div className="space-y-3 rounded-xl border border-card-border bg-card p-5 text-sm text-muted"><h3 className="font-semibold text-foreground">{t('method')}</h3><p>{t('limits')}</p><p>{t('ltvNote')}</p><p>{t('cpeNote')}</p><a className="block text-energy underline" href="https://www.cssf.lu/fr/Document/reglement-cssf-n-20-08-du-3-decembre-2020/">{t('source')}</a></div>
 </section>;
}
