"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

export type ModuleKey = "syndic" | "pms" | "crm" | "hotellerie";

interface ModuleTool {
  href: string;       // path SANS prefix locale, sans ?from=
  labelKey: string;   // clé i18n (sous {namespace}.tools.{key})
  descKey: string;    // clé i18n
  category: string;   // clé i18n catégorie
  categoryColor: string;
}

interface ModuleConfig {
  fromValue: string;       // valeur de ?from=
  hubHref: string;         // chemin du hub
  i18nNamespace: string;   // namespace next-intl
  tools: ModuleTool[];
}

const MODULES: Record<ModuleKey, ModuleConfig> = {
  syndic: {
    fromValue: "syndic",
    hubHref: "/syndic",
    i18nNamespace: "syndicContextBar",
    tools: [
      { href: "/syndic/coproprietes", labelKey: "coproprietes", descKey: "coproprietesDesc", category: "catCore", categoryColor: "bg-navy/10 text-navy" },
      { href: "/calculateur-loyer", labelKey: "loyerLegal", descKey: "loyerLegalDesc", category: "catCalc", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/portfolio", labelKey: "portefeuille", descKey: "portefeuilleDesc", category: "catAsset", categoryColor: "bg-indigo-100 text-indigo-900" },
      { href: "/energy/portfolio", labelKey: "portfolioEnergie", descKey: "portfolioEnergieDesc", category: "catEnergy", categoryColor: "bg-amber-100 text-amber-900" },
      { href: "/energy/epbd", labelKey: "epbd", descKey: "epbdDesc", category: "catEnergy", categoryColor: "bg-amber-100 text-amber-900" },
      { href: "/aml-kyc", labelKey: "amlKyc", descKey: "amlKycDesc", category: "catCompliance", categoryColor: "bg-slate-200 text-slate-900" },
      { href: "/syndic/benchmark", labelKey: "benchmark", descKey: "benchmarkDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/syndic/lettres-types", labelKey: "lettresTypes", descKey: "lettresTypesDesc", category: "catDocs", categoryColor: "bg-sky-100 text-sky-900" },
    ],
  },
  pms: {
    fromValue: "pms",
    hubHref: "/pms",
    i18nNamespace: "pmsContextBar",
    tools: [
      { href: "/pms", labelKey: "properties", descKey: "propertiesDesc", category: "catCore", categoryColor: "bg-navy/10 text-navy" },
      { href: "/hotellerie/forecast", labelKey: "forecast", descKey: "forecastDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/hotellerie/compset", labelKey: "compset", descKey: "compsetDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/hotellerie/dscr", labelKey: "dscr", descKey: "dscrDesc", category: "catFinance", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/hotellerie/exploitation", labelKey: "exploitation", descKey: "exploitationDesc", category: "catFinance", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/hotellerie/observatoire-lu", labelKey: "observatoire", descKey: "observatoireDesc", category: "catData", categoryColor: "bg-indigo-100 text-indigo-900" },
      { href: "/hotellerie/renovation", labelKey: "renovation", descKey: "renovationDesc", category: "catEnergy", categoryColor: "bg-amber-100 text-amber-900" },
      { href: "/aml-kyc", labelKey: "amlKyc", descKey: "amlKycDesc", category: "catCompliance", categoryColor: "bg-slate-200 text-slate-900" },
    ],
  },
  crm: {
    fromValue: "crm",
    hubHref: "/pro-agences",
    i18nNamespace: "crmContextBar",
    tools: [
      { href: "/pro-agences", labelKey: "dashboard", descKey: "dashboardDesc", category: "catCore", categoryColor: "bg-navy/10 text-navy" },
      { href: "/pro-agences/mandats", labelKey: "mandats", descKey: "mandatsDesc", category: "catPipeline", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/pro-agences/crm", labelKey: "contacts", descKey: "contactsDesc", category: "catContacts", categoryColor: "bg-indigo-100 text-indigo-900" },
      { href: "/pro-agences/performance", labelKey: "performance", descKey: "performanceDesc", category: "catReporting", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/pro-agences/commissions", labelKey: "commissions", descKey: "commissionsDesc", category: "catReporting", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/pro-agences/fiche-bien", labelKey: "ficheBien", descKey: "ficheBienDesc", category: "catDocs", categoryColor: "bg-sky-100 text-sky-900" },
      { href: "/aml-kyc", labelKey: "amlKyc", descKey: "amlKycDesc", category: "catCompliance", categoryColor: "bg-slate-200 text-slate-900" },
      { href: "/actions-prioritaires", labelKey: "alerts", descKey: "alertsDesc", category: "catAnalysis", categoryColor: "bg-amber-100 text-amber-900" },
    ],
  },
  hotellerie: {
    fromValue: "hotellerie",
    hubHref: "/hotellerie",
    i18nNamespace: "hotellerieContextBar",
    tools: [
      { href: "/hotellerie/pre-acquisition", labelKey: "preAcquisition", descKey: "preAcquisitionDesc", category: "catCore", categoryColor: "bg-navy/10 text-navy" },
      { href: "/hotellerie/valorisation", labelKey: "valorisation", descKey: "valorisationDesc", category: "catFinance", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/hotellerie/dscr", labelKey: "dscr", descKey: "dscrDesc", category: "catFinance", categoryColor: "bg-emerald-100 text-emerald-900" },
      { href: "/hotellerie/due-diligence", labelKey: "dueDiligence", descKey: "dueDiligenceDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/hotellerie/compset", labelKey: "compset", descKey: "compsetDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/hotellerie/forecast", labelKey: "forecast", descKey: "forecastDesc", category: "catAnalysis", categoryColor: "bg-fuchsia-100 text-fuchsia-900" },
      { href: "/hotellerie/observatoire-lu", labelKey: "observatoire", descKey: "observatoireDesc", category: "catData", categoryColor: "bg-indigo-100 text-indigo-900" },
      { href: "/pms", labelKey: "pms", descKey: "pmsDesc", category: "catOps", categoryColor: "bg-amber-100 text-amber-900" },
    ],
  },
};

export default function ModuleContextBar({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = MODULES[moduleKey];
  const t = useTranslations(config.i18nNamespace);
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Affiche la barre si :
  //   1. ?from=<module> est explicite (page externe accédée depuis le hub), OU
  //   2. on navigue dans une sous-route du module (/syndic/coproprietes…)
  // Mais JAMAIS sur le hub lui-même (l'utilisateur y est déjà).
  const hubFull = `${lp}${config.hubHref}`;
  const isOnHub = pathname === hubFull || pathname === `${hubFull}/`;
  const isOnSubpath = pathname.startsWith(`${hubFull}/`);
  const fromMatches = params.get("from") === config.fromValue;
  if (isOnHub) return null;
  if (!isOnSubpath && !fromMatches) return null;

  const buildHref = (path: string) => `${lp}${path}?from=${config.fromValue}`;

  return (
    <div className="sticky top-16 z-30 border-b border-card-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5">
          <Link href={`${lp}${config.hubHref}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t("backToHub")}
          </Link>

          <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                open ? "border-navy bg-navy text-white" : "border-card-border bg-white text-slate hover:border-navy/50 hover:text-navy"
              }`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {t("switcherButton")}
              <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {open && (
              <div role="menu"
                className="absolute left-0 top-full mt-2 w-[min(92vw,720px)] rounded-xl border border-card-border bg-card p-3 shadow-xl">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-wider font-bold text-muted">
                  {t("switcherPanelTitle")}
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {config.tools.map((tool) => (
                    <Link key={tool.href} href={buildHref(tool.href)}
                      onClick={() => setOpen(false)}
                      className="group rounded-lg border border-card-border/60 bg-background/40 p-2.5 hover:border-navy hover:bg-navy/5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tool.categoryColor}`}>
                            {t(tool.category)}
                          </span>
                          <div className="mt-1 text-xs font-bold text-navy group-hover:text-navy-light">{t(tool.labelKey)}</div>
                          <p className="mt-0.5 text-[10px] text-muted leading-snug line-clamp-2">{t(tool.descKey)}</p>
                        </div>
                        <svg className="h-3.5 w-3.5 text-muted group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
