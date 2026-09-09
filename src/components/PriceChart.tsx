"use client";
import {useId} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {XAxis,YAxis,Tooltip,ResponsiveContainer,ReferenceLine,Line,LineChart} from 'recharts';
import {HOUSE_PRICE_INDEX,HOUSE_PRICE_INDEX_SOURCE} from '@/lib/house-price-index';
function OfficialPriceChart({kind,compact=false}:{kind:'changePct'|'index';compact?:boolean}){
 const t=useTranslations('officialPriceIndex'),locale=useLocale(),id=useId(),number=(n:number,d=2)=>n.toLocaleString(locale==='lb'?'de-DE':locale,{minimumFractionDigits:d,maximumFractionDigits:d});
 return <section data-official-hpi={kind} className={compact?'':'rounded-xl border border-card-border bg-card p-4 shadow-sm'} aria-labelledby={id}>
  <h3 id={id} className="text-sm font-semibold text-navy">{t(kind==='index'?'indexTitle':'changeTitle')}</h3>
  <p className="mt-1 text-xs text-muted">{t('scope')}</p>
  <ResponsiveContainer width="100%" height={compact?120:200}><LineChart data={HOUSE_PRICE_INDEX} margin={{top:15,right:8,bottom:0,left:-15}}>
   <XAxis dataKey="year" tick={{fontSize:10}} tickLine={false}/><YAxis tick={{fontSize:10}} tickFormatter={v=>kind==='changePct'?`${v}%`:String(v)}/>
   <Tooltip formatter={value=>[number(Number(value),kind==='changePct'?1:2)+(kind==='changePct'?' %':''),t(kind==='index'?'index':'change')]} labelFormatter={label=>String(label)}/>
   <ReferenceLine y={kind==='index'?100:0} stroke="#64748b" strokeDasharray="3 3"/>
   <Line type="linear" dataKey={kind} stroke={kind==='index'?'#9e7b21':'#1B2A4A'} dot={{r:3}} strokeWidth={2} isAnimationActive={false}/>
  </LineChart></ResponsiveContainer>
  <details className="mt-2 text-xs"><summary className="cursor-pointer text-navy">{t('table')}</summary><div className="overflow-x-auto"><table className="mt-2 w-full"><thead><tr><th className="p-1 text-left">{t('year')}</th><th className="p-1 text-right">{t('index')}</th><th className="p-1 text-right">{t('change')}</th></tr></thead><tbody>{HOUSE_PRICE_INDEX.map(r=><tr key={r.year} data-hpi-year={r.year}><td className="p-1">{r.year}</td><td className="p-1 text-right">{number(r.index)}</td><td className="p-1 text-right">{number(r.changePct,1)} %</td></tr>)}</tbody></table></div></details>
  <a className="mt-2 inline-block text-xs text-navy underline" href={HOUSE_PRICE_INDEX_SOURCE.sourceUrl} target="_blank" rel="noopener noreferrer">{t('source')}</a>
 </section>;
}
export function PriceEvolutionChart({compact=false}:{compact?:boolean}){return <OfficialPriceChart kind="changePct" compact={compact}/>}
export function PriceIndexChart(){return <OfficialPriceChart kind="index"/>}
