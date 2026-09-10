"use client";
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import {useTranslations,useLocale} from 'next-intl';
import {useAuth} from '@/components/AuthProvider';
import {loadRentalFiscalSnapshot,fiscalPaymentSummary,calculateRentalFiscalDraft,fiscalExpenseKeys,type RentalFiscalDraft,type RentalFiscalSnapshot} from '@/lib/rental-fiscal';

export default function DashboardFiscal(){const {user,loading}=useAuth();return loading?null:<FiscalContent key={user?.id??'guest'} owner={user?.id??null}/>;}
function FiscalContent({owner}:{owner:string|null}){
 const t=useTranslations('rentalFiscalWorksheet'),locale=useLocale(),lp=locale==='fr'?'':'/'+locale;
 const money=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-LU':locale,{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 const currentYear=Number(new Intl.DateTimeFormat('en',{timeZone:'Europe/Luxembourg',year:'numeric'}).format(new Date()));
 const [year,setYear]=useState(currentYear-1),[snapshot,setSnapshot]=useState<RentalFiscalSnapshot[]|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const [drafts,setDrafts]=useState<Record<number,Record<string,RentalFiscalDraft>>>({}),[exportError,setExportError]=useState(false);
 const live=useRef(true);
 useEffect(()=>{live.current=true;if(owner)void loadRentalFiscalSnapshot(owner).then(data=>{if(live.current)setSnapshot(data)}).catch(()=>{if(live.current)setFailed(true)});return()=>{live.current=false};},[owner,attempt]);
 const update=(lotId:string,key:keyof RentalFiscalDraft,value:string)=>setDrafts(old=>({...old,[year]:{...old[year],[lotId]:{...old[year]?.[lotId],[key]:value}}}));
 const exportDraft=()=>{try{
  const content=JSON.stringify({format:'tevaxia-rental-fiscal-worksheet-v1',owner,year,exportedAt:new Date().toISOString(),scope:'Unverified preparation worksheet, not a filed tax return',drafts:drafts[year]??{},source:snapshot?.map(row=>({lotId:row.lot.id,name:row.lot.name,declaredPayments:fiscalPaymentSummary(row.payments,year)}))},null,2);
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tevaxia-fiscal-draft-'+year+'.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setExportError(false);
 }catch{setExportError(true)}};
 if(!owner)return <div className="mx-auto max-w-5xl px-4 py-16"><Link className="underline" href={lp+'/connexion'}>{t('signIn')}</Link></div>;
 if(failed)return <div className="mx-auto max-w-5xl px-4 py-16"><p role="alert">{t('loadError')}</p><button className="mt-3 underline" onClick={()=>{setFailed(false);setSnapshot(null);setAttempt(n=>n+1)}}>{t('retry')}</button></div>;
 if(!snapshot)return <div role="status" className="mx-auto max-w-5xl px-4 py-16">{t('loading')}</div>;
 const rows=snapshot.map(row=>{const draft=drafts[year]?.[row.lot.id]??{};try{return {...row,draft,paid:fiscalPaymentSummary(row.payments,year),result:calculateRentalFiscalDraft(draft),invalid:false}}catch{return {...row,draft,paid:null,result:null,invalid:true}}});
 const complete=rows.length>0&&rows.every(row=>row.result&&!row.invalid),net=complete?rows.reduce((n,row)=>n+Math.round(row.result!.net*100),0)/100:null;
 const inputClass='mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-base';
 return <div className="bg-background py-8 sm:py-12"><div className="mx-auto max-w-6xl px-4 sm:px-6 [overflow-wrap:anywhere]">
  <Link href={lp+'/gestion-locative'} className="text-sm underline">{t('back')}</Link>
  <h1 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">{t('title')}</h1><p className="mt-3 text-base text-muted">{t('intro')}</p>
  <div className="mt-6 flex flex-wrap gap-4 items-end"><label className="text-sm">{t('year')}<select value={year} onChange={e=>setYear(Number(e.target.value))} className={inputClass}>{[currentYear-3,currentYear-2,currentYear-1,currentYear].map(y=><option key={y} value={y}>{y}</option>)}</select></label><button className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm" onClick={exportDraft}>{t('export')}</button></div>
  <p className="mt-3 text-sm text-muted">{t('draftNote')}</p>{exportError&&<p role="alert" className="mt-2 text-sm text-rose-700">{t('exportError')}</p>}
  <div className="mt-6 rounded-xl border border-card-border bg-card p-5"><h2 className="text-sm text-muted">{t('total')}</h2><p className="mt-2 text-2xl font-bold text-navy">{net===null?t('incomplete'):money(net)}</p><p className="mt-2 text-sm text-muted">{t('netNote')}</p></div>
  {!rows.length&&<p className="mt-6 text-muted">{t('empty')}</p>}
  <div className="mt-6 space-y-6">{rows.map(row=><section key={row.lot.id} className="rounded-xl border border-card-border bg-card p-5">
   <h2 className="text-xl font-semibold text-navy">{row.lot.name}</h2>
   {row.paid&&<div className="mt-4 rounded-lg bg-background p-4 text-sm"><h3 className="font-semibold text-navy">{t('sourceTitle',{year})}</h3><p className="mt-2">{t('paidRent')}: {money(row.paid.rent)}</p><p>{t('paidCharges')}: {money(row.paid.charges)}</p><p className="mt-2 text-muted">{t('sourceNote')}</p>{row.paid.partial>0&&<p className="mt-2 text-amber-800">{t('partialNote',{n:row.paid.partial})}</p>}{row.paid.crossYear>0&&<p className="mt-2 text-amber-800">{t('crossYearNote',{n:row.paid.crossYear})}</p>}</div>}
   <label className="mt-4 block text-sm font-semibold">{t('receipts')}<input type="number" min="0" step="0.01" value={row.draft.receipts??''} onChange={e=>update(row.lot.id,'receipts',e.target.value)} className={inputClass}/></label>
   <p className="mt-2 text-sm text-muted">{t('receiptsNote')}</p>
   <h3 className="mt-5 font-semibold text-navy">{t('expenses')}</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fiscalExpenseKeys.map(key=><label key={key} className="text-sm">{t(key)}<input type="number" min="0" step="0.01" value={row.draft[key]??''} onChange={e=>update(row.lot.id,key,e.target.value)} className={inputClass}/></label>)}</div>
   <button className="mt-3 text-sm underline" onClick={()=>setDrafts(old=>{const draft={...old[year]?.[row.lot.id]};for(const key of fiscalExpenseKeys)if(!draft[key]?.trim())draft[key]='0';return {...old,[year]:{...old[year],[row.lot.id]:draft}}})}>{t('zeroExpenses')}</button>
   <div className="mt-4 border-t border-card-border pt-4"><p className="text-sm text-muted">{t('result')}</p><p className="mt-1 text-xl font-bold text-navy">{row.result?money(row.result.net):t('incomplete')}</p>{row.invalid&&<p role="alert" className="mt-2 text-sm text-rose-700">{t('invalid')}</p>}</div>
  </section>)}</div>
  <section className="mt-8 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold text-navy">{t('checkTitle')}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">{['timing','chargesNote','investment','regime'].map(key=><li key={key}>{t(key)}</li>)}</ul><div className="mt-4 flex flex-wrap gap-4 text-sm underline"><a href="https://impotsdirects.public.lu/fr/az/l/logem_loc.html">{t('acd')}</a><a href="https://guichet.public.lu/fr/citoyens/fiscalite/immobilier/location/declarer-revenu-location.html">{t('guichet')}</a></div></section>
 </div></div>;
}
