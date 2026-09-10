"use client";
import {useState} from 'react';
import Link from 'next/link';
import {useTranslations,useLocale} from 'next-intl';
import {rentalInsuranceBudget} from '@/lib/rental-insurance-budget';


export default function AssuranceImpayesPage(){
 const t=useTranslations('insuranceBudget'),locale=useLocale(),lp=locale==='fr'?'':'/'+locale;
 const formatEUR=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-LU':locale,{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 const [rent,setRent]=useState('1800'),[charges,setCharges]=useState('200'),[lots,setLots]=useState('1');
 const [premiums,setPremiums]=useState(['','','']);
 const parse=(raw:string)=>{if(!raw.trim())throw new Error('Missing amount');return Number(raw)};
 const results=premiums.map(raw=>{try{return {value:rentalInsuranceBudget({monthlyRent:parse(rent),monthlyCharges:parse(charges),lotCount:parse(lots),annualPremium:raw.trim()?parse(raw):null}),error:false}}catch{return {value:null,error:true}}});
 const inputClass='mt-1 w-full min-w-0 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-base';
 return <div className="bg-background py-8 sm:py-12"><div className="mx-auto max-w-5xl px-4 sm:px-6 [overflow-wrap:anywhere]">
  <Link href={lp+'/gestion-locative'} className="text-sm text-muted underline">{t('back')}</Link>
  <h1 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">{t('title')}</h1>
  <p className="mt-3 text-base text-muted">{t('intro')}</p>
  <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
   <h2 className="text-lg font-semibold text-navy">{t('scopeTitle')}</h2>
   <p className="mt-2 text-sm text-muted">{t('scopeNote')}</p>
   <div className="mt-4 grid gap-4 sm:grid-cols-3">
    <label className="text-sm">{t('rent')}<input type="number" min="0" step="0.01" value={rent} onChange={e=>setRent(e.target.value)} className={inputClass}/></label>
    <label className="text-sm">{t('charges')}<input type="number" min="0" step="0.01" value={charges} onChange={e=>setCharges(e.target.value)} className={inputClass}/></label>
    <label className="text-sm">{t('lots')}<input type="number" min="1" max="500" step="1" value={lots} onChange={e=>setLots(e.target.value)} className={inputClass}/></label>
   </div>
  </div>
  <div className="mt-6 grid gap-4 lg:grid-cols-3">{results.map((result,i)=><section key={i} className="min-w-0 rounded-xl border border-card-border bg-card p-5">
   <h2 className="text-lg font-semibold text-navy">{t('quote',{name:['A','B','C'][i]})}</h2>
   <label className="mt-3 block text-sm">{t('annualInput')}<input type="number" min="0" step="0.01" value={premiums[i]} onChange={e=>setPremiums(old=>old.map((p,j)=>j===i?e.target.value:p))} className={inputClass}/></label>
   {result.error?<p role="alert" className="mt-4 text-sm text-rose-700">{t('invalid')}</p>:<dl className="mt-4 space-y-4">
    <div><dt className="text-sm text-muted">{t('annual')}</dt><dd className="text-xl font-bold text-navy">{result.value?.annualPremium===null?t('missing'):formatEUR(result.value!.annualPremium!)}</dd></div>
    <div><dt className="text-sm text-muted">{t('monthly')}</dt><dd className="text-lg font-semibold text-navy">{result.value?.monthlyEquivalent===null?t('missing'):formatEUR(result.value!.monthlyEquivalent!)}</dd></div>
    <div><dt className="text-sm text-muted">{t('ratio')}</dt><dd className="text-lg font-semibold text-navy">{result.value?.premiumRate===null?t('missing'):new Intl.NumberFormat(locale==='lb'?'de-LU':locale,{maximumFractionDigits:2}).format(result.value!.premiumRate!)+' %'}</dd></div>
   </dl>}
  </section>)}</div>
  <p className="mt-4 text-sm text-muted">{t('calculationNote')}</p>
  <section className="mt-8 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold text-navy">{t('compareTitle')}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">{['checkScope','checkLimits','checkEligibility','checkClaims'].map(key=><li key={key}>{t(key)}</li>)}</ul></section>
  <section className="mt-8"><h2 className="text-lg font-semibold text-navy">{t('sourcesTitle')}</h2><p className="mt-2 text-sm text-muted">{t('sourcesNote')}</p><div className="mt-3 flex flex-wrap gap-4 text-sm underline"><a href="https://www.foyer.lu/fr/particuliers/habitation-quotidien/assurance-loyer-impaye/">Foyer</a><a href="https://www.baloise.lu/fr/particuliers/mon-assurance-luxembourg/assurance-habitation/assurance-habitation-home.html">Baloise</a></div></section>
 </div></div>;
}
