"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import OwnedSharedLinksSection from "@/components/OwnedSharedLinksSection";
export default function SharedLinksPage() {
  const { user, loading } = useAuth(), t = useTranslations('liensPartages'), locale = useLocale(), prefix = locale === 'fr' ? '' : '/' + locale;
  return <div className="mx-auto max-w-5xl px-4 py-10">
    <Link href={prefix + '/profil'} className="text-sm text-navy underline">{t('backToProfile')}</Link>
    <h1 className="mt-3 mb-5 text-2xl font-bold text-navy">{t('title')}</h1>
    {loading ? <p role="status">{t('loading')}</p> : user ? <OwnedSharedLinksSection user={user}/> : <p className="text-sm text-muted">{t('loginRequired')} <Link href={prefix + '/connexion'} className="underline">{t('login')}</Link></p>}
  </div>;
}
