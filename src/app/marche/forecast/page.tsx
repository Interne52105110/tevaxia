"use client";
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {buildPriceForecast,DEFAULT_SCENARIOS} from '@/lib/price-forecast';
import {getAllCommunes,getMarketDataCommune,MARKET_SOURCES} from '@/lib/market-data';
import {Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer,LineChart} from 'recharts';
export default function MarcheForecastPage(){
 const locale=useLocale(),lp=locale==='fr'?'':'/'+locale,t=useTranslations('marcheForecast');
 const [commune,setCommune]=useState(''),[price,setPrice]=useState(''),[start,setStart]=useState(''),[horizon,setHorizon]=useState(24),[rates,setRates]=useState(['0','0','0']);
 const market=commune?getMarketDataCommune(commune):null;
 const number=(n:number)=>n.toLocaleString(locale==='lb'?'de-DE':locale,{minimumFractionDigits:2,maximumFractionDigits:2});
 const forecast=useMemo(()=>{if(!price.trim()||rates.some(r=>!r.trim()))return null;try{return buildPriceForecast(Number(price),horizon,DEFAULT_SCENARIOS.map((s,i)=>({...s,annualGrowthPct:Number(rates[i])})),start)}catch{return null}},[price,horizon,rates,start]);
 const input='mt-1 w-full min-w-0 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm';
 return <main className="min-h-screen bg-background py-8 sm:py-12"><div className="mx-auto max-w-6xl px-4 sm:px-6 [overflow-wrap:anywhere]">
  <Link href={lp+'/marche'} className="text-sm text-muted">{t('back')}</Link><h1 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">{t('title')}</h1><p className="mt-3 max-w-3xl text-sm text-muted">{t('subtitle')}</p>
  <div className="mt-6 grid gap-4 lg:grid-cols-2">
   <section className="min-w-0 rounded-xl border border-card-border bg-card p-4 sm:p-5">
    <label htmlFor="price-commune" className="text-sm font-semibold">{t('commune')}</label><select id="price-commune" value={commune} onChange={e=>{setCommune(e.target.value);setPrice('')}} className={input}><option value="">{t('select')}</option>{getAllCommunes().map(c=><option key={c} value={c}>{c}</option>)}</select>
    {market&&<div data-price-reference className="mt-3 rounded-lg bg-navy/5 p-3 text-sm"><p>{t('reference')}</p><p className="my-2 text-xl font-bold">{market.prixM2Existant==null?t('unpublished'):number(market.prixM2Existant)+' €/m²'}</p><p>{market.periode}</p><p className="mt-1 text-xs">{market.source}</p><a className="mt-2 inline-block underline" href={MARKET_SOURCES.transactions} target="_blank" rel="noopener noreferrer">{t('source')}</a>{market.prixM2Existant!=null&&<button id="price-copy" type="button" onClick={()=>setPrice(String(market.prixM2Existant))} className="mt-3 block rounded border border-navy/30 px-3 py-2 text-left">{t('copy')}</button>}</div>}
    <p className="mt-3 text-sm text-muted">{t('referenceScope')}</p>
    <label htmlFor="price-base" className="mt-4 block text-sm font-semibold">{t('base')}</label><input id="price-base" type="number" min="0.01" max="1000000" step="any" value={price} onChange={e=>setPrice(e.target.value)} className={input}/>
    <label htmlFor="price-start" className="mt-4 block text-sm font-semibold">{t('start')}</label><input id="price-start" type="month" min="2000-01" max="2099-12" value={start} onChange={e=>setStart(e.target.value)} className={input}/>
   </section>
   <section className="min-w-0 rounded-xl border border-card-border bg-card p-4 sm:p-5">
    <label htmlFor="price-horizon" className="text-sm font-semibold">{t('horizon')}: {horizon} {t('months')}</label><input id="price-horizon" type="range" min="6" max="48" step="6" value={horizon} onChange={e=>setHorizon(Number(e.target.value))} className="mt-3 w-full"/>
    <p className="mt-3 text-sm text-muted">{t('ratesScope')}</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{DEFAULT_SCENARIOS.map((s,i)=><div key={s.name} className="min-w-0"><label htmlFor={'price-'+s.name} className="text-sm font-semibold">{t(s.name)}</label><input id={'price-'+s.name} type="number" step="any" min="-99.999" max="100" value={rates[i]} onChange={e=>setRates(old=>old.map((v,k)=>k===i?e.target.value:v))} className={input}/><p className="mt-1 text-xs text-muted">{t('annual')}</p></div>)}</div>
   </section>
  </div>
  {!forecast?<p role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">{t('invalid')}</p>:<section data-price-results className="mt-6 min-w-0 rounded-xl border border-card-border bg-card p-4 sm:p-5">
   <h2 className="font-semibold text-navy">{t('chartTitle')}</h2><div className="mt-4 grid gap-3 lg:grid-cols-3">{DEFAULT_SCENARIOS.map(s=><div key={s.name} className="min-w-0 rounded-lg bg-navy/5 p-3"><h3 className="text-sm">{t(s.name)}</h3><p data-price-end={s.name} className="mt-1 text-xl font-bold">{number(forecast.series[forecast.series.length-1][s.name])} €/m²</p></div>)}</div>
   <div className="mt-6 min-w-0"><ResponsiveContainer width="100%" height={340}><LineChart data={forecast.series}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label" minTickGap={45} tick={{fontSize:11}}/><YAxis width={65} tick={{fontSize:11}}/><Tooltip formatter={v=>typeof v==='number'?number(v)+' €/m²':'—'}/><Legend/>{DEFAULT_SCENARIOS.map(s=><Line key={s.name} type="linear" dataKey={s.name} name={t(s.name)} stroke={s.color} dot={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div>
   <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">{t('table')}</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-2 text-left">{t('month')}</th>{DEFAULT_SCENARIOS.map(s=><th className="p-2 text-right" key={s.name}>{t(s.name)} €/m²</th>)}</tr></thead><tbody>{forecast.series.map(p=><tr key={p.label}><th className="p-2 text-left font-normal">{p.label}{!p.isProjection?' *':''}</th>{DEFAULT_SCENARIOS.map(s=><td key={s.name} className="p-2 text-right">{number(p[s.name])}</td>)}</tr>)}</tbody></table></div><p className="mt-2 text-xs">* {t('anchor')}</p></details>
  </section>}
  <section className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><h2 className="font-semibold">{t('methodTitle')}</h2><p className="mt-2">{t('formula')}</p><p className="mt-2">{t('methodScope')}</p></section>
 </div></main>;
}
