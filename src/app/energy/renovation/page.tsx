"use client";
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import InputField from '@/components/InputField';
import { PdfButton } from '@/components/PdfButton';
import { formatEUR2 } from '@/lib/calculations';
import { calculerScenarioRenovation, type RenovationScenarioInput } from '@/lib/renovation-scenario';

export default function RenovationPage(){
 const t=useTranslations('renovationAudit'),locale=useLocale(),lp=locale==='fr'?'':`/${locale}`;
 const [input,setInput]=useState<RenovationScenarioInput>({travauxTTC:80000,honorairesTTC:8000,aidesConfirmees:0,anneeVersementAides:0,factureAvant:6000,factureApres:2500,entretienSupplementaire:300,hausseEnergiePct:0,actualisationPct:3,horizonAns:20,montantPret:0,tauxPretPct:3.5,dureePretAns:15});
 const {result,error}=useMemo(()=>{try{return {result:calculerScenarioRenovation(input),error:false};}catch{return {result:null,error:true};}},[input]);
 const field=(key:keyof RenovationScenarioInput,suffix='€',min=0,max?:number)=><InputField key={key} label={t(key)} value={Number.isNaN(input[key])?'':input[key]} onChange={v=>setInput(p=>({...p,[key]:v===''?NaN:Number(v)}))} suffix={suffix} min={min} max={max} />;
 const box='rounded-xl border border-card-border bg-card p-5 sm:p-6';
 const rows=result?[['cost',formatEUR2(result.coutTotal)],['net',formatEUR2(result.coutNetAides)],['initial',formatEUR2(result.besoinInitial)],['equity',formatEUR2(result.apportInitial)],['savings',formatEUR2(result.economieNetteAn1)],['npv',formatEUR2(result.van)],['irr',result.triPct===null?t('notDefined'):`${result.triPct.toLocaleString(locale)} %`],['payback',result.anneeRetour===null?t('notRecovered'):t('yearNumber',{n:result.anneeRetour})]]:[];
 return <main className="py-8 sm:py-12"><div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl text-navy font-bold">{t('title')}</h1><p className="mt-3 text-muted max-w-4xl">{t('intro')}</p>
  <div className="grid gap-6 lg:grid-cols-2 mt-6">
   <div className="space-y-6">
    <section className={`${box} space-y-4`}><h2 className="text-lg font-semibold text-navy">{t('budget')}</h2>{field('travauxTTC')}{field('honorairesTTC')}{field('aidesConfirmees')}{field('anneeVersementAides','',0,input.horizonAns)}<p className="text-sm text-muted">{t('aidNote')}</p><Link className="block text-navy underline" href={`${lp}/simulateur-aides`}>{t('aidLink')}</Link></section>
    <section className={`${box} space-y-4`}><h2 className="text-lg font-semibold text-navy">{t('energy')}</h2>{field('factureAvant')}{field('factureApres')}{field('entretienSupplementaire')}<p className="text-sm text-muted">{t('energyNote')}</p></section>
    <section className={`${box} space-y-4`}><h2 className="text-lg font-semibold text-navy">{t('assumptions')}</h2>{field('horizonAns','',1,50)}{field('hausseEnergiePct','%',-99,100)}{field('actualisationPct','%',-99,100)}<p className="text-sm text-muted">{t('assumptionsNote')}</p></section>
    <section className={`${box} space-y-4`}><h2 className="text-lg font-semibold text-navy">{t('finance')}</h2>{field('montantPret')}{field('tauxPretPct','%',0,100)}{field('dureePretAns','',1,40)}<p className="text-sm text-muted">{t('financeNote')}</p></section>
   </div>
   <div className="space-y-6">
    {error&&<p role="alert" className="bg-red-50 text-red-800 rounded-xl p-5">{t('error')}</p>}
    {result&&<>
     <section className="bg-navy text-white p-5 sm:p-6 rounded-xl" aria-live="polite"><h2 className="text-lg font-semibold">{t('results')}</h2><dl className="mt-4 space-y-3">{rows.map(([k,v])=><div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-white/15 pb-2"><dt className="text-white/80">{t(k)}</dt><dd className="font-semibold" data-testid={`renovation-${k}`}>{v}</dd></div>)}</dl></section>
     <p className="text-sm text-muted rounded-xl border border-card-border p-5">{t('scope')}</p>
     {input.montantPret>0&&<section className={box}><h2 className="text-lg font-semibold text-navy">{t('financeResults')}</h2><dl className="mt-4 space-y-3">{[['payment',result.mensualite],['interestCost',result.interetsPret],['cashAfterDebt',result.soldeAnnuelApresCredit]].map(([key,value])=><div key={key} className="flex flex-wrap justify-between gap-3"><dt className="text-muted">{t(key as string)}</dt><dd className="font-semibold">{formatEUR2(value as number)}</dd></div>)}</dl></section>}
     <div className="flex justify-end"><PdfButton label="PDF" filename="renovation-scenario.pdf" generateBlob={async()=>(await import('@/components/energy/RenovationScenarioPdf')).generateScenarioPdf(input,result,{title:t('title'),scope:t('scope'),assumptions:t('assumptionsNote'),labels:Object.fromEntries([...Object.keys(input),...rows.map(([k])=>k),'year','flow','cumulative','discounted','payment','interestCost','cashAfterDebt','inputs','results','schedule','notDefined','notRecovered'].map(k=>[k,t(k)])),results:rows.map(([k,v])=>({label:t(k),value:v}))})} /></div>
     <details className={box}><summary className="cursor-pointer font-semibold text-navy">{t('schedule')}</summary><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr>{['year','flow','cumulative','discounted'].map(k=><th key={k} className="text-right p-2">{t(k)}</th>)}</tr></thead><tbody>{result.flux.map(f=><tr key={f.annee} className="border-t border-card-border"><td className="p-2 text-right">{f.annee}</td>{[f.flux,f.cumule,f.actualise].map((v,i)=><td key={i} className="p-2 text-right whitespace-nowrap">{formatEUR2(v)}</td>)}</tr>)}</tbody></table></div></details>
     <section className={`${box} space-y-3`}><h2 className="text-lg font-semibold text-navy">{t('sources')}</h2><p className="text-sm text-muted">{t('sourceNote')}</p><a className="block text-navy underline" href="https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html">Klimabonus 2026 — Guichet.lu</a><a className="block text-navy underline" href="https://pfi.public.lu/fr/citoyen/tva/logement.html">TVA logement — AED</a></section>
    </>}
   </div>
  </div>
 </div></main>;
}
