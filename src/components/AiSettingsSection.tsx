"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface AiPrefs {
  ai_provider: "gemini" | "cerebras" | "groq" | "openai" | "anthropic";
  ai_api_key_encrypted: string;
}

const PROVIDERS = [
  { value: "gemini", label: "Google Gemini (3.6 Flash — gratuit, vision PDF)" },
  { value: "cerebras", label: "Cerebras (GPT-OSS 120B — payant depuis la migration PayGo)" },
  { value: "groq", label: "Groq (Llama 3.3 70B — gratuit)" },
  { value: "openai", label: "OpenAI (GPT-4o)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
] as const;

const KEY_PLACEHOLDERS: Record<AiPrefs["ai_provider"], string> = {
  gemini: "AQ.... ou AIza...",
  cerebras: "csk-...",
  groq: "gsk_...",
  openai: "sk-...",
  anthropic: "sk-ant-...",
};

export default function AiSettingsSection() {
  const { user } = useAuth();
  if (!user || !supabase) return null;
  return <AiSettingsForm key={user.id} userId={user.id} />;
}

function AiSettingsForm({ userId }: { userId: string }) {
  const t = useTranslations("aiSettings");
  const [prefs, setPrefs] = useState<AiPrefs>({ ai_provider: "gemini", ai_api_key_encrypted: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [hasByok, setHasByok] = useState(false);
  const [error, setError] = useState<"loadError" | "saveError" | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await client
          .from("user_ai_settings")
          .select("ai_provider, ai_api_key_encrypted, daily_usage, last_usage_date")
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data) {
          setPrefs({
            ai_provider: data.ai_provider,
            ai_api_key_encrypted: data.ai_api_key_encrypted ?? "",
          });
          const today = new Date().toISOString().slice(0, 10);
          setDailyUsage(data.last_usage_date === today ? data.daily_usage : 0);
          setHasByok(!!data.ai_api_key_encrypted);
        }
      } catch {
        if (!cancelled) setError("loadError");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [userId, loadAttempt]);

  const save = async () => {
    if (!supabase || saving || loading || error === "loadError") return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { error } = await supabase.from("user_ai_settings").upsert({
        user_id: userId,
        ai_provider: prefs.ai_provider,
        ai_api_key_encrypted: prefs.ai_api_key_encrypted || null,
      });
      if (error) throw error;
      setHasByok(!!prefs.ai_api_key_encrypted);
      setSaved(true);
    } catch {
      setError("saveError");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("desc")}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            hasByok ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
          }`}>
            {hasByok ? t("byokActive") : t("freeTier")}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : error === "loadError" ? (
        <div className="mt-4 space-y-2">
          <p role="alert" className="text-sm text-rose-700">{t("loadError")}</p>
          <button onClick={() => {
            setError(null);
            setLoading(true);
            setLoadAttempt((attempt) => attempt + 1);
          }} className="text-sm font-semibold text-navy underline">{t("retry")}</button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Provider select */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("providerLabel")}</label>
            <select
              disabled={saving}
              value={prefs.ai_provider}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, ai_provider: e.target.value as AiPrefs["ai_provider"] }));
                setSaved(false);
              }}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API key input */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("apiKeyLabel")}</label>
            <input
              disabled={saving}
              type="password"
              value={prefs.ai_api_key_encrypted}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, ai_api_key_encrypted: e.target.value }));
                setSaved(false);
              }}
              placeholder={KEY_PLACEHOLDERS[prefs.ai_provider]}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <p className="mt-1 text-xs text-muted">{t("apiKeyHint")}</p>
          </div>

          {/* Usage info */}
          <div className="rounded-lg border border-card-border bg-background p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("usageToday")}</span>
              <span className="font-semibold text-navy">
                {hasByok
                  ? t("unlimited")
                  : `${dailyUsage} / 5`
                }
              </span>
            </div>
          </div>

          {/* BYOK explanation */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">{t("byokExplain")}</p>
          </div>

          {error === "saveError" && <p role="alert" className="text-sm text-rose-700">{t("saveError")}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
          >
            {saving ? t("saving") : saved ? t("saved") : t("save")}
          </button>
        </div>
      )}
    </div>
  );
}
