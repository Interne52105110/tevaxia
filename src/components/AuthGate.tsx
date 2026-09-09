"use client";
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {useAuth} from '@/components/AuthProvider';
/** Presentation gate for locally calculated details; server data still requires its own authorization. */
export default function AuthGate({children}:{children:React.ReactNode}){
 const {user,loading}=useAuth(),locale=useLocale(),t=useTranslations('authGate'),locked=loading||!user;
 // Keep the same child tree mounted through session changes, while excluding
 // masked controls from keyboard navigation and the accessibility tree.
 return <div className="relative" aria-busy={loading||undefined}><div data-auth-gate-content inert={locked} aria-hidden={locked||undefined} className={locked?'min-h-56 blur-sm pointer-events-none select-none':undefined}>{children}</div>{locked&&<div data-auth-gate-overlay className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60"><div className="mx-4 max-w-sm rounded-xl border border-card-border bg-card p-5 text-center shadow-lg sm:p-8">{loading?<p role="status" className="text-sm text-muted">{t('loading')}</p>:<><h3 className="text-base font-semibold text-navy">{t('title')}</h3><p className="mt-2 text-sm text-muted">{t('description')}</p><Link href={(locale==='fr'?'':'/'+locale)+'/connexion'} className="mt-4 inline-block rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-light">{t('action')}</Link></>}</div></div>}</div>;
}
