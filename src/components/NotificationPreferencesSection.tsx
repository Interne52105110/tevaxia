"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import { loadNotificationPreferences, saveNotificationPreferences, notificationKeys, legacyConsentKeys, type NotificationChoices, type PreferencesSnapshot } from "@/lib/notification-preferences";

export default function NotificationPreferencesSection() {
  const { user } = useAuth();
  return user ? <PreferencesForm key={user.id} owner={user.id} /> : null;
}
function PreferencesForm({ owner }: { owner: string }) {
  const t = useTranslations("profil.preferences");
  const [snapshot, setSnapshot] = useState<PreferencesSnapshot | null>(null);
  const [choices, setChoices] = useState<NotificationChoices | null>(null);
  const [withdraw, setWithdraw] = useState(false), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState<"load" | "save" | null>(null), [attempt, setAttempt] = useState(0);
  const live = useRef(true), running = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    void loadNotificationPreferences(owner).then(result => {
      if (active) { setSnapshot(result); setChoices(result.preferences); setWithdraw(false); setSaved(false); }
    }).catch(() => { if (active) setError("load"); });
    return () => { active = false; };
  }, [owner, attempt]);
  const reload = () => { setSnapshot(null); setChoices(null); setError(null); setSaved(false); setAttempt(n => n + 1); };
  const save = async () => {
    if (running.current || !snapshot || !choices) return;
    running.current = true; setBusy(true); setError(null); setSaved(false);
    try {
      const result = await saveNotificationPreferences(owner, snapshot, choices, withdraw, () => live.current);
      if (live.current) { setSnapshot(result); setChoices(result.preferences); setWithdraw(false); setSaved(true); }
    } catch { if (live.current) setError("save"); }
    finally { running.current = false; if (live.current) setBusy(false); }
  };
  const labels = { notify_market_alerts: "marketAlerts", notify_monthly_digest: "monthlyDigest", notify_security: "security", notify_product_news: "productNews" } as const;
  const legacyLabels = { consent_analytics: "legacyAnalytics", consent_marketing: "legacyMarketing", consent_third_party: "legacyThirdParty" } as const;
  return <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm [overflow-wrap:anywhere]">
    <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
    <p className="mt-1 text-sm text-muted">{t("desc")}</p>
    {!snapshot || !choices ? error === "load" ? <div className="mt-4"><p role="alert" className="text-sm text-rose-700">{t("loadError")}</p><button onClick={reload} className="mt-2 text-sm underline">{t("reload")}</button></div> : <p role="status" className="mt-4 text-sm text-muted">{t("loading")}</p> : <fieldset disabled={busy} className="mt-4 min-w-0">
      <legend className="text-sm font-semibold text-navy">{t("notifGroup")}</legend>
      <div className="divide-y divide-card-border/50">{notificationKeys.map(key => <label key={key} className="flex cursor-pointer items-start justify-between gap-4 py-3">
        <span><span className="text-sm font-medium text-navy">{t(labels[key])}</span><span className="mt-1 block text-xs text-muted">{t(labels[key] + "Hint")}</span></span>
        <input type="checkbox" aria-label={t(labels[key])} checked={choices[key]} onChange={() => { setChoices(old => old ? { ...old, [key]: !old[key] } : old); setSaved(false); }} className="mt-1 h-4 w-4 shrink-0 rounded border-input-border" />
      </label>)}</div>
      {legacyConsentKeys.some(key => snapshot.preferences[key]) && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <h3 className="font-semibold">{t("legacyTitle")}</h3><p className="mt-1">{t("legacyDescription")}</p>
        <ul className="mt-2 list-inside list-disc">{legacyConsentKeys.filter(key => snapshot.preferences[key]).map(key => <li key={key}>{t(legacyLabels[key])}</li>)}</ul>
        {withdraw ? <p className="mt-2 font-medium">{t("withdrawPending")}</p> : <button onClick={() => { setWithdraw(true); setSaved(false); }} className="mt-2 underline">{t("withdrawLegacy")}</button>}
      </div>}
      {error === "save" && <div className="mt-3"><p role="alert" className="text-sm text-rose-700">{t("saveError")}</p><button onClick={reload} className="mt-2 text-sm underline">{t("reload")}</button></div>}
      <button onClick={save} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("saving") : t("save")}</button>
      {saved && <p role="status" className="mt-2 text-sm text-emerald-700">{t("saved")}</p>}
    </fieldset>}
    <div className="mt-5 border-t border-card-border pt-4"><h3 className="text-sm font-semibold text-navy">{t("browserTitle")}</h3><p className="mt-1 text-sm text-muted">{t("browserDescription")}</p><CookieSettingsButton label={t("browserButton")} className="mt-2 text-sm underline" /></div>
  </section>;
}
