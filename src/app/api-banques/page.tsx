import type {Metadata} from 'next';
import Link from 'next/link';
import {getLocale,getTranslations} from 'next-intl/server';
export async function generateMetadata():Promise<Metadata>{const t=await getTranslations('bankApiAudit');return {title:t('title'),description:t('intro')}}
export default async function ApiBanques(){
 const [locale,t]=await Promise.all([getLocale(),getTranslations('bankApiAudit')]),prefix=locale==='fr'?'':'/'+locale;
 const sample=`POST https://tevaxia.lu/api/v1/estimation
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

${JSON.stringify({commune:'Luxembourg',typeBien:'appartement',surface:85,nbChambres:2,etage:'adjEtage2e3eRef',etat:'adjEtatBonRef',exterieur:'adjExtBalconRef',parking:false,classeEnergie:'D',estNeuf:false},null,2)}`;
 return <main id="bank-api" className="mx-auto max-w-5xl px-4 py-12 space-y-8 [overflow-wrap:anywhere]"><header className="space-y-4"><p className="text-sm text-muted">{t('badge')}</p><h1 className="text-3xl font-bold">{t('title')}</h1><p className="text-lg text-muted">{t('intro')}</p><a className="inline-block rounded-lg bg-navy text-white px-4 py-3" href="mailto:contact@tevaxia.lu?subject=API%20banques">{t('contact')}</a></header><section className="rounded-xl border border-card-border bg-card p-5 space-y-3"><h2 className="text-xl font-semibold">{t('scopeTitle')}</h2><p>{t('scope')}</p><p>{t('data')}</p><p>{t('limits')}</p><Link className="block underline" href={prefix+'/estimation'}>{t('try')}</Link></section><section className="space-y-4"><h2 className="text-xl font-semibold">{t('requestTitle')}</h2><p>{t('auth')}</p><pre className="overflow-x-auto rounded-xl bg-slate-950 text-emerald-300 p-5 text-sm"><code>{sample}</code></pre><p>{t('response')}</p><p className="text-sm text-muted">{t('errors')}</p><Link className="block underline" href={prefix+'/api-docs'}>{t('docs')}</Link></section><section className="rounded-xl border border-card-border bg-card p-5 space-y-3"><h2 className="text-xl font-semibold">{t('prudentialTitle')}</h2><p>{t('prudential')}</p><Link className="block underline" href={prefix+'/valorisation'}>{t('valuation')}</Link></section><section className="space-y-3"><h2 className="text-xl font-semibold">{t('integrationTitle')}</h2><p>{t('integration')}</p><p>{t('logging')}</p><p>{t('availability')}</p></section></main>;
}
