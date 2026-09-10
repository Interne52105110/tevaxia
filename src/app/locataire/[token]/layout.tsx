import type { Metadata } from "next";
import {getTranslations} from 'next-intl/server';

export async function generateMetadata():Promise<Metadata> {
 const t=await getTranslations('portalLandings.locataire.meta');
 return {
  title: t('title'),
  description: t('description'),
  robots: "noindex,nofollow", // Lien magique privé
  referrer: "no-referrer",
 };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
