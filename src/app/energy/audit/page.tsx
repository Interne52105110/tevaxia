"use client";
import {useState} from 'react';
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {AUDIT_QUESTIONS,summarizeAuditAnswers} from '@/lib/energy-audit';
export default function EnergyAuditGuide(){
 const locale=useLocale(),lp=locale==='fr'?'':'/'+locale,t=useTranslations('energyAudit'),a=useTranslations('energyQuestionnaireAudit');
 const [answers,setAnswers]=useState<Record<string,string>>({}),[currentIdx,setCurrentIdx]=useState(0),[showSummary,setShowSummary]=useState(false);
 const current=AUDIT_QUESTIONS[currentIdx],summary=summarizeAuditAnswers(answers),last=currentIdx===AUDIT_QUESTIONS.length-1;
 return <div className="mx-auto max-w-4xl px-4 py-10"><Link href={`${lp}/energy`} className="text-sm underline">{t('back')}</Link><h1 className="mt-4 text-2xl font-bold">{a('title')}</h1><p className="mt-3 text-muted">{a('intro')}</p>
 {!showSummary?<section className="mt-6 rounded-xl border border-card-border bg-card p-5">
  <p className="text-sm">{t('question',{n:currentIdx+1,total:AUDIT_QUESTIONS.length})}</p><label className="mt-3 block text-sm">{a('progress')}<progress className="mt-2 w-full" max={AUDIT_QUESTIONS.length} value={summary.answered}/></label>
  <fieldset className="mt-6" key={current.id}><legend className="font-semibold" id="audit-question">{t(current.labelKey)}</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{[...current.options.map(o=>o.valueKey),'unknown'].map(value=><label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-card-border p-4"><input type="radio" name={current.id} value={value} checked={answers[current.id]===value} onChange={()=>setAnswers({...answers,[current.id]:value})}/><span>{value==='unknown'?a('unknown'):t(value)}</span></label>)}</div></fieldset>
  <div className="mt-6 flex flex-wrap justify-between gap-3"><button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={currentIdx===0} onClick={()=>setCurrentIdx(i=>Math.max(0,i-1))}>{t('prev')}</button><button className="rounded-lg bg-navy px-4 py-2 text-white disabled:opacity-40" disabled={!answers[current.id]} onClick={()=>last?setShowSummary(true):setCurrentIdx(i=>Math.min(AUDIT_QUESTIONS.length-1,i+1))}>{last?a('finish'):t('next')}</button></div>
 </section>:<section id="audit-summary" className="mt-6 space-y-5"><h2 className="text-xl font-semibold">{a('summary')}</h2><p className="text-sm text-muted">{a('scope')}</p><div className="flex flex-wrap gap-5"><p>{a('documented')} : <strong id="audit-documented">{summary.documented}</strong></p><p>{a('unknownCount')} : <strong id="audit-unknown">{summary.unknown}</strong></p></div>
 <dl className="rounded-xl border border-card-border bg-card p-5">{summary.rows.map(row=><div key={row.id} className="border-b border-card-border py-3"><dt className="text-sm text-muted">{t(row.labelKey)}</dt><dd className="mt-1 font-medium">{row.valueKey==='unknown'||row.valueKey==='unanswered'?a(row.valueKey):t(row.valueKey)}</dd></div>)}</dl>
 <div className="rounded-xl border border-card-border bg-card p-5"><h3 className="font-semibold">{a('documents')}</h3><ul className="mt-3 list-disc space-y-3 pl-5 text-sm">{['envelope','heating','ventilation','water','usage'].map(k=><li key={k}>{a(k)}</li>)}</ul><p className="mt-4 text-sm">{a('grants')}</p></div>
 <div className="flex flex-wrap gap-3"><button className="rounded-lg border px-4 py-2" onClick={()=>{setShowSummary(false);setCurrentIdx(0)}}>{a('edit')}</button><button className="rounded-lg border px-4 py-2" onClick={()=>{setAnswers({});setCurrentIdx(0);setShowSummary(false)}}>{a('reset')}</button><Link className="rounded-lg bg-navy px-4 py-2 text-white" href={`${lp}/energy/renovation`}>{t('detailRenov')}</Link></div>
 </section>}
 <a className="mt-6 block text-sm underline" href="https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html">{a('source')}</a>
 </div>;
}
