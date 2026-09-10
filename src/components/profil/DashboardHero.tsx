"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadAccountDashboard, type AccountDashboard } from "@/lib/account-dashboard";
import type { UserProfile } from "@/lib/profile";
import type { User } from "@supabase/supabase-js";

interface DashboardHeroProps {
  user: User | null;
  profile: UserProfile;
}

const TIER_STYLE: Record<string, { dot: string; label: string }> = {
  free: { dot: "bg-slate-400", label: "Free" },
  pro: { dot: "bg-emerald-400", label: "Pro" },
  enterprise: { dot: "bg-amber-400", label: "Enterprise" },
};

function greetingKey(hour: number): "greetMorning" | "greetAfternoon" | "greetEvening" {
  if (hour < 12) return "greetMorning";
  if (hour < 18) return "greetAfternoon";
  return "greetEvening";
}

function firstName(profile: UserProfile, user: User | null): string {
  if (profile.nomComplet?.trim()) {
    return profile.nomComplet.trim().split(" ")[0];
  }
  if (user?.user_metadata?.full_name) {
    return String(user.user_metadata.full_name).split(" ")[0];
  }
  if (user?.user_metadata?.name) {
    return String(user.user_metadata.name).split(" ")[0];
  }
  return "";
}

export default function DashboardHero(props: DashboardHeroProps) {
  return <AccountHero key={props.user?.id ?? "guest"} {...props} />;
}
function AccountHero({ user, profile }: DashboardHeroProps) {
  const t = useTranslations("dashboardHero"), locale = useLocale();
  const [stats, setStats] = useState<AccountDashboard | null>(null);
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/dep-driven sync with external source (URL, localStorage, Supabase)
    setHour(new Date().getHours());
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void loadAccountDashboard(user.id).then(result => { if (active) setStats(result); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [user, attempt]);
  const reload = () => { setStats(null); setFailed(false); setAttempt(value => value + 1); };
  const tierStyle = stats?.plan ? TIER_STYLE[stats.plan.tier] : { dot: "bg-slate-400", label: t("planUnknown") };
  const name = firstName(profile, user);
  const greeting = t(greetingKey(hour));
  const initial = (name || profile.societe || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-2xl border border-card-border/60 bg-gradient-to-br from-navy-dark via-navy to-navy-light p-6 sm:p-8 shadow-lg text-white overflow-hidden relative">
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white p-1 object-contain shrink-0 ring-1 ring-white/20" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/80 to-gold text-navy-dark flex items-center justify-center text-lg font-bold shrink-0 ring-1 ring-white/20">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-medium">
                {greeting}
              </div>
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight truncate leading-tight">
                {name || profile.societe || t("defaultUser")}
              </h2>
              {profile.societe && name && (
                <div className="mt-0.5 text-xs text-white/60 truncate">{profile.societe}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/15`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tierStyle.dot}`} />
              {tierStyle.label}
            </span>

          </div>
        </div>

        <p className="mt-5 text-xs text-white/70">{t("countScope")}</p>
        {(failed || stats?.incomplete) && <p role="alert" className="mt-3 text-sm text-amber-200">{t("countsUnavailable")}</p>}
        <button type="button" onClick={reload} className="mt-2 text-xs text-white/80 underline">{t("refreshCounts")}</button>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label={t("kpiValuations")} value={stats?.valuations ?? "—"} hint={stats?.plan ? `/ ${new Intl.NumberFormat(locale).format(stats.plan.itemsCap)}` : undefined} />
          <Kpi label={t("kpiApiKeys")} value={stats?.apiKeys ?? "—"} />
          <Kpi label={t("kpiActiveAlerts")} value={stats?.thresholds ?? "—"} />
          <Kpi label={t("kpiSharedLinks")} value={stats?.sharedLinks ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  const locale = useLocale();
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.06] backdrop-blur-sm px-4 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.09] [overflow-wrap:anywhere]">
      <div className="text-xs text-white/70 font-medium">{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
        <span className="min-w-0 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value}</span>
        {hint && <span className="text-[10px] text-white/40 font-mono truncate">{hint}</span>}
      </div>
    </div>
  );
}
