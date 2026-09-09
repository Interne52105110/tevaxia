"use client";
import {useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {PdfButton} from '@/components/PdfButton';
import {LENOZ_INPUT_KEYS,LENOZ_THRESHOLDS,LENOZ_SOURCES,classifyLenozThresholds,buildLenozReport,type LenozInputs} from '@/lib/lenoz-thresholds';
export default function LenozPage(){
 const t=useTranslations('lenozThresholdAudit'),locale=useLocale();
 const [i,setInput]=useState<LenozInputs>({global:NaN,economy:NaN,ecology:NaN,building:NaN,functionality:NaN});
 const r=(()=>{try{return classifyLenozThresholds(i)}catch{return null}})();
 return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10"><h1 className="text-2xl font-bold [overflow-wrap:anywhere]">{t('title')}</h1><p className="text-muted">{t('intro')}</p><p className="text-sm text-muted">{t('scope')}</p>
 <section className="rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('inputs')}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{LENOZ_INPUT_KEYS.map(k=><label key={k} className="text-sm">{t(k)} (%)<input id={'lenoz-'+k} type="number" min={0} max={100} step="any" value={Number.isNaN(i[k])?'':i[k]} onChange={e=>setInput({...i,[k]:e.target.valueAsNumber})} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5"/></label>)}</div></section>
 {!r&&<p role="status" className="text-sm text-muted">{t('invalid')}</p>}
 {r&&<section id="lenoz-results" className="space-y-4 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('result')}</h2><p id="lenoz-level" className="text-xl font-semibold">{t('level'+r.level)}</p><p className="text-sm text-muted">{t('resultNote')}</p><div className="flex justify-end"><PdfButton label="PDF" filename="lenoz-seuils.pdf" generateBlob={async()=>(await import('@/components/energy/EnergyAuditPdf')).generateEnergyAuditPdf(buildLenozReport(i,k=>t(k),locale))}/></div></section>}
 <section className="rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('thresholds')}</h2><p className="mt-3 text-sm text-muted">{t('exceptions')}</p><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th scope="col" className="p-3 text-left">{t('result')}</th><th scope="col" className="p-3">{t('globalShort')}</th><th scope="col" className="p-3">{t('categoryShort')}</th></tr></thead><tbody>{LENOZ_THRESHOLDS.map(v=><tr key={v.level} className="border-t border-card-border"><th scope="row" className="p-3 text-left">{t('level'+v.level)}</th><td className="p-3 text-center">≥ {v.global} %</td><td className="p-3 text-center">{v.category===0?t('noMinimum'):'≥ '+v.category+' %'}</td></tr>)}</tbody></table></div></section>
 <section className="space-y-3 text-sm"><h2 className="font-semibold">{t('sources')}</h2>{LENOZ_SOURCES.map((url,k)=><a key={url} href={url} className="block underline">{t('source'+k)}</a>)}</section>
 </div>;
}
