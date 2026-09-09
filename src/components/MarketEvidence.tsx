"use client";
import {useLocale,useTranslations} from 'next-intl';
import {MARKET_SOURCES,type MarketDataCommune} from '@/lib/market-data';
import {marketObservationRows} from '@/lib/market-evidence';
export default function MarketEvidence({market}:{market:MarketDataCommune}){
 const t=useTranslations('marketEvidence'),locale=useLocale(),number=(n:number,d:number)=>n.toLocaleString(locale==='lb'?'de-DE':locale,{minimumFractionDigits:d,maximumFractionDigits:d});
 return <section data-market-evidence className="rounded-xl border border-card-border bg-card p-4 shadow-sm [overflow-wrap:anywhere]">
  <h3 className="font-semibold text-navy">{t('title')}</h3><p className="mt-2 text-xs text-muted">{t('period')}: {market.periode}</p><p className="mt-1 text-xs text-muted">{market.source}</p>
  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">{marketObservationRows(market).map(r=><div key={r.field}><dt className="text-muted">{t(r.label)}</dt><dd data-observation={r.field} className="font-semibold text-navy">{r.value==null?t('unpublished'):number(r.value,r.unit==='money'?2:0)+(r.unit==='money'?' €':'')}</dd></div>)}</dl>
  <p className="mt-3 text-xs text-muted">{t('scope')}</p><p className="mt-2 text-xs text-muted">{t('ratioScope')}</p>
  <div className="mt-3 flex flex-wrap gap-3 text-xs text-navy underline">{([['transactions','sourceSales'],['annonces','sourceAsking'],['loyers','sourceRent']] as const).map(([key,label])=><a key={key} href={MARKET_SOURCES[key]} target="_blank" rel="noopener noreferrer">{t(label)}</a>)}</div>
 </section>;
}
