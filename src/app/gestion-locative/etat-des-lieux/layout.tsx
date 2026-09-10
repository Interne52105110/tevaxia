import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("glEdl");
  return { title: t("pageTitle"), description: t("pageSubtitle"), alternates: localizedAlternates("/gestion-locative/etat-des-lieux", locale) };
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
