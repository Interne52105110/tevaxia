import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("billingPreparation"), getLocale()]);
  return {
    title: t("title"), description: t("metaDescription"),
    robots: { index: true, follow: true },
    alternates: localizedAlternates("/facturation", locale),
  };
}

export default async function FacturationLanding() {
  const [t, locale] = await Promise.all([getTranslations("billingPreparation"), getLocale()]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="break-words text-3xl font-bold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/90">{t("subtitle")}</p>
          <p className="mt-4 max-w-3xl text-base text-white/80">{t("scope")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`${lp}/facturation/emission`} className="rounded-lg bg-gold px-5 py-3 font-bold text-navy-dark hover:bg-gold-light">{t("prepare")} →</Link>
            <Link href={`${lp}/facturation/historique`} className="rounded-lg border border-white/40 px-5 py-3 font-semibold text-white hover:bg-white/10">{t("history")}</Link>
            <Link href={`${lp}/pricing`} className="rounded-lg px-5 py-3 font-semibold text-white underline underline-offset-4">{t("offers")}</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        {(["data", "calculation", "export"] as const).map((key) => (
          <article key={key} className="min-w-0 rounded-xl border border-card-border bg-card p-6">
            <h2 className="break-words text-xl font-bold text-navy">{t(`${key}Title`)}</h2>
            <p className="mt-3 leading-relaxed text-slate">{t(`${key}Body`)}</p>
          </article>
        ))}
      </section>
      <section className="border-y border-card-border bg-card py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          {(["fr", "lu"] as const).map((country) => (
            <article key={country} className="min-w-0">
              <h2 className="text-2xl font-bold text-navy">{t(`${country}Title`)}</h2>
              <p className="mt-3 leading-relaxed text-slate">{t(`${country}Body`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-navy">{t("sourcesTitle")}</h2>
        <ul className="mt-4 space-y-3 text-navy">
          <li><a className="underline underline-offset-4" href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees">{t("frLink")}</a></li>
          <li><a className="underline underline-offset-4" href="https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/marche-public-concession/facturation/emission-facture-electronique-marche-public-contrat-concession.html">{t("luLink")}</a></li>
          <li><a className="underline underline-offset-4" href="https://fnfe-mpe.org/factur-x/implementer-factur-x/">{t("formatLink")}</a></li>
        </ul>
      </section>
    </div>
  );
}
