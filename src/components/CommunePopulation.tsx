"use client";
import {useLocale,useTranslations} from 'next-intl';
import {getDemographics,DEMOGRAPHIC_SOURCE} from '@/lib/demographics';
export default function CommunePopulation({commune}:{commune:string}){
 const t=useTranslations('populationEvidence'),locale=useLocale(),data=getDemographics(commune),format=(n:number)=>n.toLocaleString(locale==='lb'?'de-DE':locale);
 const date=new Date(DEMOGRAPHIC_SOURCE.referenceDate+'T00:00:00Z').toLocaleDateString(locale==='lb'?'de-DE':locale,{timeZone:'UTC'});
 return <section data-population className="rounded-xl border border-card-border bg-card p-4 shadow-sm [overflow-wrap:anywhere]">
  <h3 className="text-base font-semibold text-navy">{t('title')}</h3>
  <p className="mt-1 text-xs text-muted">{t('date',{date})}</p>
  {data?<dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{(['population','mineurs','majeurs'] as const).map(key=><div key={key}><dt className="text-muted">{t(key)}</dt><dd data-population-field={key} className="font-semibold text-navy">{format(data[key])}</dd></div>)}</dl>:<p className="mt-3 text-sm text-muted">{t('unavailable')}</p>}
  <p className="mt-3 text-xs text-muted">{t('scope')}</p>
  <a className="mt-2 inline-block text-xs text-navy underline" href={DEMOGRAPHIC_SOURCE.sourceUrl} target="_blank" rel="noopener noreferrer">{t('source')}</a>
 </section>;
}
