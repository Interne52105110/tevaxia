import type {Metadata} from 'next';
import Link from 'next/link';
import {getLocale,getTranslations} from 'next-intl/server';
import {localizedAlternates} from '@/lib/seo';
export async function generateMetadata():Promise<Metadata>{const t=await getTranslations('esgHub'),locale=await getLocale();return{title:t('metaTitle'),description:t('metaDesc'),alternates:localizedAlternates('/esg',locale)}}
export default async function EsgHubPage(){
 const t=await getTranslations('esgHub'),trajectory=await getTranslations('trajectoryAudit'),taxo=await getTranslations('taxonomyAudit'),locale=await getLocale(),prefix=locale==='fr'?'':'/'+locale;
 return <div className="[overflow-wrap:anywhere]"><section className="bg-navy px-4 py-16 text-white"><div className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold sm:text-4xl">{t('heroTitle')}</h1><p className="mt-5 max-w-3xl text-white/85">{t('heroSubtitle')}</p></div></section>
 <div className="mx-auto max-w-5xl space-y-8 px-4 py-10"><div className="grid gap-6 sm:grid-cols-2">{[{path:'/esg/crrem-pathways',title:trajectory('title'),intro:trajectory('intro')},{path:'/esg/taxonomy',title:taxo('title'),intro:taxo('intro')}].map(m=><Link key={m.path} href={prefix+m.path} className="rounded-xl border border-card-border bg-card p-6 hover:shadow-md"><h2 className="text-xl font-semibold">{m.title}</h2><p className="mt-4 text-muted">{m.intro}</p><span className="mt-5 inline-block font-medium underline">{t('ctaOpen')}</span></Link>)}</div>
 <section className="space-y-4 rounded-xl border border-card-border bg-card p-6"><h2 className="text-lg font-semibold">{t('methoTitle')}</h2><p className="text-sm text-muted">{trajectory('officialNote')}</p><a className="block text-sm underline" href="https://crrem.org/learn/">{trajectory('source0')}</a><p className="text-sm text-muted">{taxo('scope')}</p><a className="block text-sm underline" href="https://eur-lex.europa.eu/eli/reg_del/2021/2139/2026-01-01">{taxo('source0')}</a></section></div></div>;
}
