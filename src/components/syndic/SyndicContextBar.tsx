"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

/**
 * Barre de contexte affichée sur les pages satellites atteintes depuis
 * /syndic (via ?from=syndic). Offre un retour rapide + switcher vers
 * les autres outils du module syndic sans perdre le contexte.
 *
 * Inspiré des patterns Linear / Matera / Stripe Dashboard : secondary nav
 * persistante, breadcrumb explicite, jamais piéger l'utilisateur sur une
 * page isolée.
 */
export default function SyndicContextBar() {
  const t = useTranslations("syndicContextBar");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useSearchParams();

  if (params.get("from") !== "syndic") return null;

  const tools: Array<{ href: string; label: string; icon: string }> = [
    { href: `${lp}/syndic/coproprietes?from=syndic`, label: t("coproprietes"), icon: "★" },
    { href: `${lp}/calculateur-loyer?from=syndic`, label: t("loyerLegal"), icon: "€" },
    { href: `${lp}/portfolio?from=syndic`, label: t("portefeuille"), icon: "▦" },
    { href: `${lp}/energy/portfolio?from=syndic`, label: t("portfolioEnergie"), icon: "⚡" },
    { href: `${lp}/energy/epbd?from=syndic`, label: t("epbd"), icon: "⏱" },
    { href: `${lp}/aml-kyc?from=syndic`, label: t("amlKyc"), icon: "🛡" },
    { href: `${lp}/syndic/benchmark?from=syndic`, label: t("benchmark"), icon: "📊" },
    { href: `${lp}/syndic/lettres-types?from=syndic`, label: t("lettresTypes"), icon: "📝" },
  ];

  return (
    <div className="sticky top-16 z-20 border-b border-card-border bg-navy/5 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5 overflow-x-auto">
          <Link href={`${lp}/syndic`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light transition-colors">
            ← {t("backToSyndic")}
          </Link>
          <div className="h-5 w-px bg-card-border shrink-0" />
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold shrink-0 hidden sm:block">
            {t("otherTools")}
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-card-border bg-white px-2.5 py-1 text-xs font-medium text-slate hover:border-navy hover:text-navy hover:bg-navy/5 transition-colors">
                <span className="text-[10px]">{tool.icon}</span>
                <span>{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
