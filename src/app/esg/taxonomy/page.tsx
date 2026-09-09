"use client";
import {useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {EMPTY_TAXONOMY,EPC_CLASS_ORDER,TAXONOMY_SOURCES,screenTaxonomy,type TaxonomyInput,type Evidence} from '@/lib/taxonomy';
const fieldClass='mt-2 w-full min-w-0 rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm';
export default function TaxonomyPage(){
 const t=useTranslations('taxonomyAudit'),locale=useLocale();
 const [i,setInput]=useState<TaxonomyInput>({...EMPTY_TAXONOMY});
 const r=screenTaxonomy(i);
 const set=<K extends keyof TaxonomyInput>(k:K,v:TaxonomyInput[K])=>setInput(prev=>({...prev,...(k==='period'||k==='route'?{ped:NaN,threshold:NaN,epc:'',epcEvidence:'unknown' as const,thresholdEvidence:'unknown' as const,envelope:'unknown' as const,gwp:'unknown' as const}:{}),[k]:v}));
 const numeric=(k:'ped'|'threshold'|'area'|'power')=><label className="min-w-0 text-sm" key={k}>{t(k)}<input id={'taxo-'+k} className={fieldClass} type="number" min={k==='threshold'||k==='area'?0.000001:0} step="any" value={Number.isNaN(i[k])?'':i[k]} onChange={e=>set(k,e.target.valueAsNumber)}/></label>;
 const evidence=(k:'epcEvidence'|'thresholdEvidence'|'envelope'|'gwp'|'monitoring'|'adaptation'|'safeguards')=><label key={k} className="block min-w-0 text-sm">{t(k)}<select id={'taxo-'+k} className={fieldClass} value={i[k]} onChange={e=>set(k,e.target.value as Evidence)}>{(['unknown','yes','no'] as const).map(v=><option key={v} value={v}>{t(v)}</option>)}</select></label>;
 const compare=i.period==='after'||(i.period==='before'&&i.route==='top15');
 return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 [overflow-wrap:anywhere]">
 <h1 className="text-2xl font-bold">{t('title')}</h1><p className="text-muted">{t('intro')}</p><p className="text-sm text-muted">{t('scope')}</p>
 <section className="space-y-4 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('inputs')}</h2>
 <div className="grid gap-4 sm:grid-cols-2"><label className="min-w-0 text-sm">{t('period')}<select id="taxo-period" className={fieldClass} value={i.period} onChange={e=>set('period',e.target.value as TaxonomyInput['period'])}>{(['unknown','before','after'] as const).map(v=><option key={v} value={v}>{t(v)}</option>)}</select></label>
 <label className="min-w-0 text-sm">{t('use')}<select id="taxo-use" className={fieldClass} value={i.use} onChange={e=>set('use',e.target.value as TaxonomyInput['use'])}>{(['unknown','residential','nonResidential'] as const).map(v=><option key={v} value={v}>{t(v)}</option>)}</select></label></div>
 <p className="text-sm text-muted">{t('periodNote')}</p>
 {i.period==='before'&&<div className="grid gap-4 sm:grid-cols-2"><label className="min-w-0 text-sm">{t('route')}<select id="taxo-route" className={fieldClass} value={i.route} onChange={e=>set('route',e.target.value as TaxonomyInput['route'])}><option value="epc">{t('routeEpc')}</option><option value="top15">{t('top15')}</option></select></label>{i.route==='epc'&&<label className="min-w-0 text-sm">{t('epc')}<select id="taxo-epc" className={fieldClass} value={i.epc} onChange={e=>set('epc',e.target.value)}><option value="">{t('unknown')}</option>{EPC_CLASS_ORDER.map(v=><option key={v}>{v}</option>)}</select></label>}</div>}
 {compare&&<><div className="grid gap-4 sm:grid-cols-2">{numeric('ped')}{numeric('threshold')}</div><p className="text-sm text-muted">{t('thresholdNote')}</p></>}
 {i.period==='after'&&<>{numeric('area')}<p className="text-sm text-muted">{t('largeNote')}</p></>}
 {i.use==='nonResidential'&&<>{numeric('power')}<p className="text-sm text-muted">{t('powerNote')}</p></>}
 </section>
 <section className="space-y-5 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('documents')}</h2><p className="text-sm text-muted">{t('answerNote')}</p>
 {i.period!=='unknown'&&evidence('epcEvidence')}{compare&&evidence('thresholdEvidence')}
 {i.period==='after'&&i.area>5000&&<>{evidence('envelope')}{evidence('gwp')}</>}
 {i.use==='nonResidential'&&i.power>290&&evidence('monitoring')}
 {evidence('adaptation')}<p className="text-sm text-muted">{t('adaptationNote')}</p>
 {evidence('safeguards')}<p className="text-sm text-muted">{t('safeguardsNote')}</p></section>
 <section id="taxo-results" className="space-y-4 rounded-xl border border-card-border bg-card p-5"><h2 className="text-lg font-semibold">{t('result')}</h2><p id="taxo-status" role="status" className="text-xl font-semibold">{t(r.status)}</p>
 {r.limit!==null&&<p id="taxo-limit">{t('limit')}: {new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{maximumFractionDigits:6}).format(r.limit)} kWh/m²/{locale==='fr'?'an':locale==='de'?'Jahr':locale==='lb'?'Joer':locale==='pt'?'ano':'year'}</p>}
 <dl className="space-y-3">{r.checks.map(c=><div key={c.key} className="grid gap-1 border-t border-card-border pt-3 sm:grid-cols-[1fr_auto]"><dt>{t(c.key)}</dt><dd id={'taxo-check-'+c.key} className="font-medium">{t(c.status)}</dd></div>)}</dl><p className="text-sm text-muted">{t('scope')}</p></section>
 <section className="space-y-3 text-sm"><h2 className="font-semibold">{t('sources')}</h2>{TAXONOMY_SOURCES.map((url,k)=><a key={url} href={url} className="block underline">{t('source'+k)}</a>)}</section>
 </div>;
}
