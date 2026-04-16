import { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

const GUIDES = [
  { slug: "frais-notaire-luxembourg", titleKey: "fraisNotaireTitle", descKey: "fraisNotaireDesc" },
  { slug: "regle-5-pourcent-loyer", titleKey: "regle5PourcentTitle", descKey: "regle5PourcentDesc" },
  { slug: "bellegen-akt", titleKey: "bellegenAktTitle", descKey: "bellegenAktDesc" },
  { slug: "plus-value-immobiliere", titleKey: "plusValueTitle", descKey: "plusValueDesc" },
  { slug: "bail-habitation-luxembourg", titleKey: "bailHabitationTitle", descKey: "bailHabitationDesc" },
  { slug: "copropriete-luxembourg", titleKey: "coproTitle", descKey: "coproDesc" },
  { slug: "klimabonus", titleKey: "klimabonusTitle", descKey: "klimabonusDesc" },
  { slug: "estimation-bien-immobilier", titleKey: "estimationTitle", descKey: "estimationDesc" },
  { slug: "achat-immobilier-non-resident", titleKey: "achatNonResidentTitle", descKey: "achatNonResidentDesc" },
  { slug: "tva-3-pourcent-logement", titleKey: "tva3PourcentTitle", descKey: "tva3PourcentDesc" },
  { slug: "bail-commercial-luxembourg", titleKey: "bailCommercialTitle", descKey: "bailCommercialDesc" },
  { slug: "investir-hotel-luxembourg", titleKey: "investirHotelTitle", descKey: "investirHotelDesc" },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guideHub");
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function GuideHub() {
  const [t, locale] = await Promise.all([
    getTranslations("guideHub"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: t("title"),
              description: t("metaDescription"),
              numberOfItems: GUIDES.length,
              itemListElement: GUIDES.map((g, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t(g.titleKey),
                url: `https://tevaxia.lu/guide/${g.slug}`,
              })),
            }),
          }}
        />

        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          {t("title")}
        </h1>

        <div className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>{t("introP1")}</p>
          <p>{t("introP2")}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`${lp}/guide/${g.slug}`}
              className="group rounded-lg border border-card-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-navy group-hover:text-gold transition-colors">
                {t(g.titleKey)}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {t(g.descKey)}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-semibold text-navy">{t("aboutTitle")}</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>{t("aboutP1")}</p>
            <p>{t("aboutP2")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
