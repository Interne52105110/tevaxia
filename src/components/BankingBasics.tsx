"use client";
import {useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {calculerLTV,calculerDSCR} from '@/lib/calculations';
import {AMORTIZATION_EXAMPLE,amortization,bankingMoney,buildAmortizationReport} from '@/lib/banking-basics';
import {PdfButton} from '@/components/PdfButton';
type Kind='ltv'|'dscr'|'amortization';
const EXAMPLES={ltv:{value:750000,loan:600000},dscr:{rent:36000,costs:6000,debt:24000},amortization:AMORTIZATION_EXAMPLE};
export default function BankingBasics({kind}:{kind:Kind}){
 const t=useTranslations('bankingBasicsAudit'),locale=useLocale();
 const [values,setValues]=useState(EXAMPLES);
 const input=values[kind] as unknown as Record<string,number>;
 const money=(n:number)=>bankingMoney(n,locale),number=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{maximumFractionDigits:2}).format(n);
 const result=(()=>{try{
  if(!Object.values(input).every(n=>Number.isFinite(n)&&n>=0&&n<=1e12))return null;
  if(kind==='ltv'){const {value,loan}=values.ltv;return {rows:[['ltv',number(calculerLTV({valeurBien:value,montantPret:loan})*100)+' %'],['difference',money(Math.max(0,value-loan))],['excess',money(Math.max(0,loan-value))]]};}
  if(kind==='dscr'){const {rent,costs,debt}=values.dscr;return {rows:[['dscr',number(calculerDSCR({revenuLocatifAnnuel:rent,chargesAnnuelles:costs,serviceDetteAnnuel:debt}))],['noi',money(rent-costs)],['cash',money(rent-costs-debt)]]};}
  const r=amortization(values.amortization);return {rows:(['monthly','interest','total'] as const).map(k=>[k,money(r[k])]),annual:r.annual};
 }catch{return null;}})();
 return <section id={'basics-'+kind} className="space-y-6">
  <div className="rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t(kind+'Title')}</h2><p className="mt-3 text-sm text-muted">{t(kind+'Intro')}</p><p className="mt-3 text-sm text-muted">{t('example')}</p>
   <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(input).map(([key,value])=><label key={key} className="text-sm">{t(key)}<input id={'basics-'+kind+'-'+key} type="number" step={key==='years'?1:'any'} min={key==='years'?1:0} max={key==='years'?50:key==='rate'?30:1e12} value={Number.isNaN(value)?'':value} onChange={e=>setValues({...values,[kind]:{...input,[key]:e.target.valueAsNumber}})} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5"/></label>)}</div>
  </div>
  {!result&&<p role="alert" className="text-red-700">{t('invalid')}</p>}
  {result&&<div id={'basics-'+kind+'-results'} className="space-y-5"><dl className="rounded-xl border border-card-border bg-card p-5">{result.rows.map(([key,value])=><div key={key} className="flex flex-wrap justify-between gap-2 border-b border-card-border py-3"><dt>{t(key)}</dt><dd id={'basics-result-'+key} className="font-semibold">{value}</dd></div>)}</dl>
   {kind==='amortization'&&<><div className="flex justify-end"><PdfButton label="PDF" filename="amortissement.pdf" generateBlob={async()=>(await import('@/components/energy/EnergyAuditPdf')).generateEnergyAuditPdf(buildAmortizationReport(values.amortization,k=>t(k),locale))}/></div>
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card"><table className="w-full text-sm"><thead><tr>{['year','repaid','interest','remaining'].map(k=><th key={k} scope="col" className="p-3 text-right">{t(k)}</th>)}</tr></thead><tbody>{result.annual?.map(y=><tr key={y.year} className="border-t border-card-border"><th scope="row" className="p-3">{y.year}</th>{(['repaid','interest','remaining'] as const).map(k=><td key={k} className="p-3 text-right tabular-nums whitespace-nowrap">{money(y[k])}</td>)}</tr>)}</tbody></table></div></>}
  </div>}
  {kind!=='amortization'&&<div className="rounded-xl border border-card-border bg-card p-5 text-sm text-muted"><h3 className="font-semibold">{t('method')}</h3><p className="mt-3">{t(kind+'Note')}</p>{kind==='ltv'&&<a className="mt-3 block underline" href="https://www.cssf.lu/fr/Document/reglement-cssf-n-20-08-du-3-decembre-2020/">{t('source')}</a>}</div>}
 </section>;
}
