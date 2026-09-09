"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  propertyId: string;
  propertyName: string;
}

interface NavItem {
  href: string;
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
      { href: "/frontdesk", label: "item1", icon: "🛎️" },
      { href: "/pos", label: "item2", icon: "🍽️" },
      { href: "/calendrier", label: "item3", icon: "📅" },
    ],
  },
  {
    title: "section1",
    items: [
      { href: "/reservations", label: "item4", icon: "📋" },
      { href: "/reservations/nouveau", label: "item5", icon: "➕" },
      { href: "/groupes", label: "item6", icon: "👰" },
      { href: "/guests", label: "item7", icon: "👥" },
    ],
  },
  {
    title: "section2",
    items: [
      { href: "/tarifs", label: "item8", icon: "💰" },
      { href: "/tarifs/bulk", label: "item9", icon: "⚡" },
      { href: "/channels", label: "item10", icon: "🔗" },
    ],
  },
  {
    title: "section3",
    items: [
      { href: "/chambres", label: "item11", icon: "🏠" },
      { href: "/setup", label: "item12", icon: "⚙️" },
    ],
  },
  {
    title: "section4",
    items: [
      { href: "/factures", label: "item13", icon: "🧾" },
    ],
  },
  {
    title: "section5",
    items: [
      { href: "/rapports", label: "item14", icon: "📈" },
      { href: "/rapports/usali", label: "item15", icon: "📘" },
      { href: "/rapports/pickup", label: "item16", icon: "📊" },
      { href: "/rapports/forecast", label: "item17", icon: "🔮" },
      { href: "/rapports/heatmap", label: "item18", icon: "🗓️" },
    ],
  },
];

export default function PropertySidebar({ propertyId, propertyName }: Props) {
  const pathname = usePathname();
  const locale = useLocale(), t = useTranslations("pmsNavigation");
  const lp = locale === "fr" ? "" : `/${locale}`;
  const basePath = `${lp}/pms/${propertyId}`;
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
      <button type="button" aria-expanded={mobileOpen} aria-controls="pmsNavigation" onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-[60] rounded-full bg-navy px-4 py-3 text-sm font-bold text-white shadow-lg">
        {mobileOpen ? t("close") : t("tools")}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside id="pmsNavigation" aria-label={t("tools")} className={`
        ${mobileOpen ? "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto" : "hidden"}
        lg:block lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto
        bg-card border-r lg:border border-card-border lg:rounded-xl p-4 pb-20 lg:pb-4
      `}>
        <div className="mb-5 px-1">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("property")}</div>
          <Link href={basePath} className="mt-1 block text-base font-bold text-navy hover:underline truncate"
            onClick={() => setMobileOpen(false)}>
            {propertyName}
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
                        active ? "bg-navy text-white" : "hover:bg-background text-slate"
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
          <Link href={`${lp}/pms`} className="block text-muted hover:text-navy font-medium">
            {t("all")}
          </Link>
          <Link href={`${lp}/actions-prioritaires`} className="block text-muted hover:text-navy font-medium">
            {t("actions")}
          </Link>
        </div>
      </aside>
    </>
  );
}
