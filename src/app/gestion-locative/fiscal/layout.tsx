import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";
import {getTranslations} from 'next-intl/server';

export async function generateMetadata():Promise<Metadata> {
 const t=await getTranslations('rentalFiscalWorksheet');
 return {
  title: t('title'),
  description: t('intro'),
  ...NOINDEX_METADATA,
 };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
