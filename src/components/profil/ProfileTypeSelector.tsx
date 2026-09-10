"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { PROFILE_TYPES, type ProfileType } from "@/lib/profile-types";
import { loadProfileTypes, saveProfileTypes, type ProfileTypesSnapshot } from "@/lib/profile-type-preferences";
interface ProfileTypeSelectorProps { onChange?: (types: ProfileType[]) => void }
export default function ProfileTypeSelector({ onChange }: ProfileTypeSelectorProps) {
  const { user } = useAuth();
  return user ? <ProfileTypesForm key={user.id} owner={user.id} onChange={onChange} /> : null;
}
function ProfileTypesForm({ owner, onChange }: ProfileTypeSelectorProps & { owner: string }) {
  const t = useTranslations("profileTypes");
  const [snapshot, setSnapshot] = useState<ProfileTypesSnapshot | null>(null);
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState<"load" | "save" | null>(null), [attempt, setAttempt] = useState(0);
  const live = useRef(true), running = useRef(false), callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    void loadProfileTypes(owner).then(result => {
      if (active) { setSnapshot(result); callback.current?.(result.types ?? []); }
    }).catch(() => { if (active) setError("load"); });
    return () => { active = false; };
  }, [owner, attempt]);
  const selected = snapshot?.types ?? [];
  const reload = () => { if (running.current) return; setSnapshot(null); setError(null); setSaved(false); setAttempt(n => n + 1); };
  const persist = async (next: ProfileType[]) => {
    if (running.current || !snapshot || error) return;
    running.current = true; setBusy(true); setSaved(false);
    try {
      const result = await saveProfileTypes(owner, snapshot, next, () => live.current);
      if (live.current) { setSnapshot(result); callback.current?.(result.types ?? []); setSaved(true); }
    } catch { if (live.current) setError("save"); }
    finally { running.current = false; if (live.current) setBusy(false); }
  };
  const toggle = (type: ProfileType) => { void persist(selected.includes(type) ? selected.filter(value => value !== type) : [...selected, type]); };
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 [overflow-wrap:anywhere]" aria-busy={busy || (!snapshot && !error)}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-navy">{t("title")}</h3>
          <p className="mt-0.5 text-xs text-muted">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <span role="status" className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium ring-1 ring-emerald-100">
              ✓ {t("saved")}
            </span>
          )}
          {selected.length > 0 && (
            <button
              type="button"
              disabled={busy || !!error}
              onClick={() => { void persist([]); }}
              className="text-[11px] text-muted hover:text-rose-600 underline underline-offset-2"
            >
              {t("clearAll")}
            </button>
          )}
        </div>
      </div>

      {!snapshot && !error && <p role="status" className="mt-3 text-sm text-muted">{t("loading")}</p>}
      {busy && <p role="status" className="mt-3 text-sm text-muted">{t("saving")}</p>}
      {error && <div className="mt-3">
        <p role="alert" className="text-sm text-red-700">{t(error === "load" ? "loadFailed" : "saveFailed")}</p>
        <button type="button" onClick={reload} disabled={busy} className="mt-2 text-sm text-navy underline">{t("retry")}</button>
      </div>}
      {/* Selections and workspace filtering change only after server confirmation. */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PROFILE_TYPES.map((p) => {
          const isActive = selected.includes(p.value);
          return (
            <button
              key={p.value}
              type="button"
              disabled={busy || !snapshot || !!error}
              aria-pressed={isActive}
              onClick={() => toggle(p.value)}
              title={t(`${p.value}.description`)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-navy bg-navy text-white shadow-sm"
                  : "border-card-border bg-background text-slate hover:border-navy/40 hover:bg-card"
              }`}
            >
              {isActive && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {t(`${p.value}.label`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
