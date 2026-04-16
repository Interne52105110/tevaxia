"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { PROFILE_TYPES, type ProfileType } from "@/lib/profile-types";

interface ProfileTypeSelectorProps {
  onChange?: (types: ProfileType[]) => void;
}

export default function ProfileTypeSelector({ onChange }: ProfileTypeSelectorProps) {
  const { user } = useAuth();
  const t = useTranslations("profileTypes");
  const [selected, setSelected] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("user_preferences")
      .select("profile_types")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const types = (data as { profile_types?: ProfileType[] | null } | null)?.profile_types ?? [];
        setSelected(types);
        onChange?.(types);
        setLoading(false);
      });
  }, [user, onChange]);

  const persist = useCallback(
    async (next: ProfileType[]) => {
      if (!user || !supabase) return;
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        profile_types: next.length > 0 ? next : null,
      });
      if (error) {
        console.error("Error saving profile types:", error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    [user],
  );

  const toggle = (type: ProfileType) => {
    const next = selected.includes(type)
      ? selected.filter((t) => t !== type)
      : [...selected, type];
    setSelected(next);
    onChange?.(next);
    void persist(next);
  };

  if (!user || !supabase) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("description")}</p>
        </div>
        {saved && (
          <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-semibold">
            {t("saved")}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROFILE_TYPES.map((p) => {
            const isActive = selected.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => toggle(p.value)}
                className={`relative rounded-lg border p-3 text-left transition-all ${
                  isActive
                    ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                    : "border-card-border bg-background hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} text-white shadow-sm`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={p.iconPath} />
                    </svg>
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-navy" : "text-foreground"}`}>
                    {t(`${p.value}.label`)}
                  </span>
                  {isActive && (
                    <svg className="ml-auto h-4 w-4 text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] leading-tight text-muted">{t(`${p.value}.description`)}</p>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-4 rounded-lg bg-navy/5 border border-navy/10 p-3 text-xs text-navy/80">
          {t("selectedCount", { count: selected.length })}
        </div>
      )}
    </div>
  );
}
