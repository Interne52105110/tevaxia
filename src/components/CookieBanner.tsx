"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { listenAnalyticsConsent, OPEN_COOKIE_SETTINGS_EVENT, readAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics-consent";

export default function CookieBanner() {
  const t = useTranslations("cookie"), locale = useLocale();
  const [visible, setVisible] = useState(false), [warning, setWarning] = useState(false), [hasChoice, setHasChoice] = useState(false);
  useEffect(() => {
    const refresh = () => { const choice = readAnalyticsConsent(); setHasChoice(choice !== null); if (choice === null) setVisible(true); };
    const open = () => { setWarning(false); setVisible(true); };
    refresh();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    const unsubscribe = listenAnalyticsConsent(refresh);
    return () => { window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open); unsubscribe(); };
  }, []);
  const choose = (choice: AnalyticsConsent) => {
    const persisted = setAnalyticsConsent(choice);
    setHasChoice(true); setWarning(!persisted); if (persisted) setVisible(false);
  };
  if (!visible) return null;
  return <section aria-label={t("settingsTitle")} className="print:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto p-4 sm:p-6">
    <div className="mx-auto max-w-2xl rounded-xl border border-card-border bg-card p-5 shadow-lg [overflow-wrap:anywhere]">
      <h2 className="mb-2 text-base font-semibold text-navy">{t("settingsTitle")}</h2>
      <p className="text-sm leading-relaxed text-slate">{t("message")}</p>
      {warning && <p role="alert" className="mt-2 text-sm text-amber-800">{t("storageWarning")}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <a href={`${locale === "fr" ? "" : `/${locale}`}/confidentialite`} className="text-xs text-muted underline">{t("privacyLink")}</a>
        <div className="flex flex-wrap gap-3">
          {hasChoice && <button onClick={() => setVisible(false)} className="rounded-lg border border-card-border px-4 py-2 text-sm">{t("close")}</button>}
          <button onClick={() => choose("denied")} className="rounded-lg border border-card-border px-5 py-2 text-sm font-medium text-muted hover:bg-background">{t("refuse")}</button>
          <button onClick={() => choose("granted")} className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light">{t("accept")}</button>
        </div>
      </div>
    </div>
  </section>;
}
