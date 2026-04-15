"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface Prefs {
  notify_market_alerts: boolean;
  notify_monthly_digest: boolean;
  notify_security: boolean;
  notify_product_news: boolean;
  consent_analytics: boolean;
  consent_marketing: boolean;
  consent_third_party: boolean;
}

const DEFAULTS: Prefs = {
  notify_market_alerts: true,
  notify_monthly_digest: false,
  notify_security: true,
  notify_product_news: false,
  consent_analytics: false,
  consent_marketing: false,
  consent_third_party: false,
};

export default function NotificationPreferencesSection() {
  const t = useTranslations("profil.preferences");
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            notify_market_alerts: data.notify_market_alerts,
            notify_monthly_digest: data.notify_monthly_digest,
            notify_security: data.notify_security,
            notify_product_news: data.notify_product_news,
            consent_analytics: data.consent_analytics,
            consent_marketing: data.consent_marketing,
            consent_third_party: data.consent_third_party,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const toggle = (key: keyof Prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const save = async () => {
    if (!user || !supabase) return;
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      ...prefs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user || !supabase) return null;

  const notifGroups: Array<{ key: keyof Prefs; label: string; hint?: string }> = [
    { key: "notify_market_alerts", label: t("marketAlerts"), hint: t("marketAlertsHint") },
    { key: "notify_monthly_digest", label: t("monthlyDigest"), hint: t("monthlyDigestHint") },
    { key: "notify_security", label: t("security"), hint: t("securityHint") },
    { key: "notify_product_news", label: t("productNews"), hint: t("productNewsHint") },
  ];

  const consentGroups: Array<{ key: keyof Prefs; label: string; hint?: string }> = [
    { key: "consent_analytics", label: t("consentAnalytics"), hint: t("consentAnalyticsHint") },
    { key: "consent_marketing", label: t("consentMarketing"), hint: t("consentMarketingHint") },
    { key: "consent_third_party", label: t("consentThirdParty"), hint: t("consentThirdPartyHint") },
  ];

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
      <p className="mt-0.5 text-xs text-muted">{t("desc")}</p>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : (
        <>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">{t("notifGroup")}</h3>
          <div className="mt-2 divide-y divide-card-border/50">
            {notifGroups.map((g) => (
              <label key={g.key} className="flex cursor-pointer items-start justify-between gap-4 py-3">
                <div>
                  <div className="text-sm font-medium text-navy">{g.label}</div>
                  {g.hint && <p className="text-xs text-muted mt-0.5">{g.hint}</p>}
                </div>
                <input
                  type="checkbox"
                  checked={prefs[g.key]}
                  onChange={() => toggle(g.key)}
                  className="mt-1 h-4 w-4 rounded border-input-border"
                />
              </label>
            ))}
          </div>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{t("consentGroup")}</h3>
          <p className="mt-1 text-xs text-muted">{t("consentIntro")}</p>
          <div className="mt-2 divide-y divide-card-border/50">
            {consentGroups.map((g) => (
              <label key={g.key} className="flex cursor-pointer items-start justify-between gap-4 py-3">
                <div>
                  <div className="text-sm font-medium text-navy">{g.label}</div>
                  {g.hint && <p className="text-xs text-muted mt-0.5">{g.hint}</p>}
                </div>
                <input
                  type="checkbox"
                  checked={prefs[g.key]}
                  onChange={() => toggle(g.key)}
                  className="mt-1 h-4 w-4 rounded border-input-border"
                />
              </label>
            ))}
          </div>

          <button
            onClick={save}
            className="mt-5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {saved ? t("saved") : t("save")}
          </button>
        </>
      )}
    </div>
  );
}
