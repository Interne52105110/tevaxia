"use client";
import {useMemo,useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import LocaleLink from '@/components/LocaleLink';
import {getAllMarketData,slugifyCommune,MARKET_SOURCES} from '@/lib/market-data';
import {HOUSE_PRICE_INDEX} from '@/lib/house-price-index';
import {PriceEvolutionChart,PriceIndexChart} from '@/components/PriceChart';
type Sort='commune'|'prixM2Existant'|'nbTransactions';
export default function IndicesPage(){
 const t=useTranslations('officialPriceIndex'),locale=useLocale(),[sort,setSort]=useState<Sort>('commune'),[ascending,setAscending]=useState(true),[query,setQuery]=useState('');
 const format=(n:number)=>n.toLocaleString(locale==='lb'?'de-DE':locale,{minimumFractionDigits:2,maximumFractionDigits:2});
 const rows=useMemo(()=>getAllMarketData().filter(c=>c.commune.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())).sort((a,b)=>{
  const av=a[sort],bv=b[sort];if(av==null)return bv==null?0:1;if(bv==null)return -1;
  const diff=typeof av==='string'?av.localeCompare(String(bv)):av-Number(bv);return ascending?diff:-diff;
 }),[sort,ascending,query]);
 const latest=HOUSE_PRICE_INDEX[HOUSE_PRICE_INDEX.length-1];
 function changeSort(key:Sort){if(sort===key)setAscending(!ascending);else{setSort(key);setAscending(true)}}
 function download(){const fields=['commune','canton','prixM2Existant','prixM2VEFA','prixM2Annonces','loyerM2Annonces','nbTransactions','nbVEFA','periode','source'] as const,cell=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv='\uFEFF'+[fields.join(';'),...rows.map(r=>fields.map(k=>cell(r[k])).join(';'))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='communes-observations.csv';a.click();URL.revokeObjectURL(url)}
 return <div className="mx-auto max-w-7xl px-4 py-10 [overflow-wrap:anywhere]">
  <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t('pageTitle')}</h1><p className="mt-3 text-sm text-muted">{t('pageScope')}</p>
  <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-card-border bg-card p-4"><p className="text-sm text-muted">{t('latestIndex',{year:latest.year})}</p><p id="hpi-latest-index" className="text-2xl font-bold text-navy">{format(latest.index)}</p></div><div className="rounded-xl border border-card-border bg-card p-4"><p className="text-sm text-muted">{t('latestChange',{year:latest.year})}</p><p id="hpi-latest-change" className="text-2xl font-bold text-navy">{format(latest.changePct)} %</p></div></div>
  <div className="mt-6 grid gap-6 lg:grid-cols-2"><PriceEvolutionChart/><PriceIndexChart/></div>
  <section className="mt-8"><h2 className="text-xl font-semibold text-navy">{t('communesTitle')}</h2><p className="mt-2 text-sm text-muted">{t('communesScope')}</p>
   <div className="mt-4 flex flex-wrap gap-3"><input id="hpi-search" className="min-w-0 flex-1 rounded-lg border border-input-border bg-input-bg p-3" aria-label={t('search')} placeholder={t('search')} value={query} onChange={e=>setQuery(e.target.value)}/><button id="hpi-export" onClick={download} className="rounded-lg border border-card-border px-4 py-2 text-sm">{t('export')}</button></div>
   <div className="mt-4 overflow-x-auto rounded-xl border border-card-border"><table className="w-full text-sm"><thead><tr>{(['commune','prixM2Existant','nbTransactions'] as const).map(key=><th key={key} className="p-3 text-left" aria-sort={sort===key?(ascending?'ascending':'descending'):'none'}><button onClick={()=>changeSort(key)}>{t(key)} {sort===key?(ascending?'↑':'↓'):''}</button></th>)}<th className="p-3 text-left">{t('period')}</th></tr></thead><tbody>{rows.map(c=><tr key={c.commune} data-market-commune={c.commune} className="border-t border-card-border"><td className="p-3"><LocaleLink href={'/commune/'+slugifyCommune(c.commune)} className="text-navy underline">{c.commune}</LocaleLink></td><td className="p-3 whitespace-nowrap">{c.prixM2Existant==null?t('unpublished'):format(c.prixM2Existant)+' €'}</td><td className="p-3">{c.nbTransactions==null?t('unpublished'):c.nbTransactions}</td><td className="p-3">{c.periode}</td></tr>)}</tbody></table></div>
   <a className="mt-3 inline-block text-sm text-navy underline" href={MARKET_SOURCES.transactions} target="_blank" rel="noopener noreferrer">{t('communesSource')}</a>
  </section><div className="mt-6 flex flex-wrap gap-4"><LocaleLink href="/carte" className="text-navy underline">{t('map')}</LocaleLink><LocaleLink href="/estimation" className="text-navy underline">{t('estimate')}</LocaleLink></div>
 </div>;
}
