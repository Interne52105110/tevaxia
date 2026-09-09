"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface Props {
  coownershipId: string;
  coownershipName: string;
}

interface NavItem {
  href: string; // path relatif
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "section0",
    items: [
      { href: "", label: "item0", icon: "📊" },
      { href: "/archives", label: "item1", icon: "🗃️" },
      { href: "/messagerie", label: "item2", icon: "✉️" },
    ],
  },
  {
    title: "section1",
    items: [
      { href: "/comptabilite", label: "item3", icon: "📓" },
      { href: "/budget", label: "item4", icon: "📈" },
      { href: "/cles-repartition", label: "item5", icon: "🔑" },
      { href: "/appels", label: "item6", icon: "💸" },
      { href: "/rapprochement", label: "item7", icon: "🏦" },
      { href: "/sepa-virements", label: "item8", icon: "💳" },
      { href: "/ocr-factures", label: "item9", icon: "📷" },
      { href: "/fonds-travaux", label: "item10", icon: "🏛️" },
      { href: "/relances", label: "item11", icon: "⚠️" },
    ],
  },
  {
    title: "section2",
    items: [
      { href: "/assemblees", label: "item12", icon: "🏛️" },
      { href: "/annexes", label: "item13", icon: "📑" },
    ],
  },
  {
    title: "section3",
    items: [
      { href: "/travaux", label: "item14", icon: "🛠️" },
    ],
  },
];

export default function CoproSidebar({ coownershipId, coownershipName }: Props) {
  const locale = useLocale(), t = useTranslations("syndicNavigation");
  const lp = locale === "fr" ? "" : `/${locale}`;
  const pathname = usePathname();
  const basePath = `${lp}/syndic/coproprietes/${coownershipId}`;
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);

  const activeHref = SECTIONS.flatMap(section => section.items.map(item => item.href))
    .filter(href => pathname === `${basePath}${href}` || (href !== "" && pathname.startsWith(`${basePath}${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;


  return (
    <>
      {/* Mobile toggle */}
      <button type="button" aria-expanded={mobileOpen} aria-controls="syndicNavigation" onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-[60] rounded-full bg-navy px-4 py-3 text-sm font-bold text-white shadow-lg">
        {mobileOpen ? t("close") : t("tools")}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside id="syndicNavigation" aria-label={t("tools")} className={`
        ${mobileOpen ? "fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto" : "hidden"}
        lg:block lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto
        bg-card border-r lg:border border-card-border lg:rounded-xl p-4 pb-20 lg:pb-4
      `}>
        <div className="mb-5 px-1">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("property")}</div>
          <Link href={basePath} className="mt-1 block text-base font-bold text-navy hover:underline truncate"
            onClick={() => setMobileOpen(false)}>
            {coownershipName}
          </Link>
        </div>

        {SECTIONS.map((section) => (
          <div key={t(section.title)} className="mb-5">
            <div className="px-1 mb-2 text-xs uppercase tracking-wider text-muted font-bold">
              {t(section.title)}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link aria-current={active ? "page" : undefined} href={`${basePath}${item.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-navy text-white"
                          : "hover:bg-background text-slate"
                      }`}>
                      <span className="shrink-0 text-lg leading-tight">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold leading-tight ${active ? "" : "text-navy"}`}>
                          {t(item.label)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-5 border-t border-card-border pt-4 px-1 space-y-1.5 text-xs">
          <Link href={`${lp}/syndic/portefeuille`} className="block text-muted hover:text-navy font-medium">
            {t("all")}
          </Link>
          <Link href={`${lp}/syndic/lettres-types`} className="block text-muted hover:text-navy font-medium">
            {t("letters")}
          </Link>
          <Link href={`${lp}/syndic/benchmark`} className="block text-muted hover:text-navy font-medium">
            {t("benchmark")}
          </Link>
          <Link href={`${lp}/actions-prioritaires`} className="block text-muted hover:text-navy font-medium">
            {t("actions")}
          </Link>
        </div>
      </aside>
    </>
  );
}
