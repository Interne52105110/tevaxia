"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { YIELD_TYPES, loadYieldRules, saveYieldRule, removeYieldRule, validateYieldDraft, type YieldRule, type YieldType } from "@/lib/hotel-yield-rules";
export default function YieldAlertsPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("yieldRules"), locale = useLocale();
  if (loading) return <p role="status" className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6 text-center"><Link className="underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{t("signIn")}</Link></div>;
  if (!isSupabaseConfigured) return <p className="p-6">{t("unavailable")}</p>;
  return <Rules key={user.id} userId={user.id} />;
}
function Rules({ userId }: { userId: string }) {
  const t = useTranslations("yieldRules"), locale = useLocale(), prefix = locale === "fr" ? "" : `/${locale}`;
  const [data, setData] = useState<Awaited<ReturnType<typeof loadYieldRules>> | null>(null);
  const [selected, setSelected] = useState("");
  const [retry, setRetry] = useState(0), [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadYieldRules(userId).then(result => { if (active) { setData(result); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [userId, retry]);
  const hotel = data?.hotels.find(h => h.id === selected) ?? data?.hotels[0];
  return <div className="mx-auto max-w-5xl px-4 py-10">
    <Link className="text-sm underline" href={`${prefix}/hotellerie`}>{t("back")}</Link><h1 className="mt-3 text-2xl font-bold">{t("title")}</h1><p className="mt-4 rounded-lg border p-4 text-sm">{t("scope")}</p>
    {error && <div className="mt-4"><p role="alert">{t("error")}</p><button className="underline" onClick={() => { setError(false); setRetry(n => n + 1); }}>{t("retry")}</button></div>}
    {!data && !error && <p role="status" className="mt-4">{t("loading")}</p>}
    {data?.hotels.length === 0 && <p className="mt-4">{t("noHotels")} <Link className="underline" href={`${prefix}/hotellerie/groupe`}>{t("group")}</Link></p>}
    {!!data?.hotels.length && <label className="mt-5 block text-sm" htmlFor="yield-hotel">{t("hotel")}<select id="yield-hotel" value={hotel?.id ?? ""} onChange={e => setSelected(e.target.value)} className="mt-1 block w-full rounded-lg border p-2">{data.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
    {hotel && data && <HotelRules key={`${hotel.id}:${retry}`} hotelId={hotel.id} userId={userId} rules={data.rules.filter(r => r.hotel_id === hotel.id)} onSaved={() => { setData(null); setRetry(n => n + 1); }} />}
    <p className="mt-6 text-sm">{t("manual")}</p><div className="mt-3 flex flex-wrap gap-3"><Link className="underline" href={`${prefix}/hotellerie/benchmark`}>{t("benchmark")}</Link><Link className="underline" href={`${prefix}/hotellerie/compset`}>{t("compset")}</Link></div>
  </div>;
}
function HotelRules({ hotelId, userId, rules, onSaved }: { hotelId: string; userId: string; rules: YieldRule[]; onSaved: () => void }) {
  const t = useTranslations("yieldRules");
  const [draft, setDraft] = useState<{ id?: string; type: string; pct: string; days: string; active: boolean } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const lock = useRef(false), alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const input = draft ? { id: draft.id, hotel_id: hotelId, alert_type: draft.type as YieldType, threshold_pct: draft.pct.trim() ? Number(draft.pct) : NaN, threshold_days: draft.days.trim() ? Number(draft.days) : NaN, is_active: draft.active } : null;
  let valid = false; if (input) { try { validateYieldDraft(input); valid = true; } catch {} }
  const mutate = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(false);
    try { await action(); if (alive.current) onSaved(); }
    catch { if (alive.current) setError(true); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const label = (type: string) => (YIELD_TYPES as readonly string[]).includes(type) ? t(type) : t("unknown");
  return <section className="mt-5">
    <h2 className="text-xl font-semibold">{t("saved")}</h2><p className="mt-2 text-sm">{t("historyScope")}</p>
    {!rules.length && <p className="mt-4">{t("empty")}</p>}
    {rules.map(r => <article key={r.id} data-yield-rule={r.id} className="mt-4 rounded-lg border p-4"><h3 className="font-semibold">{label(r.alert_type)}</h3><p className="mt-2 text-sm">{t("threshold")}: {Number.isFinite(r.threshold_pct) ? r.threshold_pct : "—"} % · {r.threshold_days} {t("days")} · {t(r.is_active ? "enabled" : "disabled")}</p><p className="mt-2 text-sm">{t("notificationFlags")}: email {t(r.notify_email ? "yes" : "no")}, push {t(r.notify_push ? "yes" : "no")}</p><div className="mt-3 flex flex-wrap gap-3"><button data-edit disabled={busy} className="rounded-lg border p-2 text-sm" onClick={() => setDraft({ id: r.id, type: r.alert_type, pct: String(r.threshold_pct), days: String(r.threshold_days), active: r.is_active })}>{t("edit")}</button><button data-delete disabled={busy} className="rounded-lg border p-2 text-sm" onClick={() => { if (confirm(t("confirmDelete"))) void mutate(() => removeYieldRule(userId, r.id, hotelId)); }}>{t("delete")}</button></div></article>)}
    <button id="yield-add" disabled={busy} className="mt-4 rounded-lg border p-3" onClick={() => setDraft(draft ? null : { type: "", pct: "", days: "", active: false })}>{t(draft ? "cancel" : "add")}</button>
    {draft && <form className="mt-4 rounded-lg border p-4" onSubmit={e => { e.preventDefault(); if (valid && input) void mutate(() => saveYieldRule(userId, input)); }}><fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-3">
      <label className="min-w-0 text-sm" htmlFor="yield-type">{t("type")}<select id="yield-type" value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} className="mt-1 block w-full rounded-lg border p-2"><option value="">{t("choose")}</option>{YIELD_TYPES.map(k => <option key={k} value={k}>{t(k)}</option>)}</select></label>
      <label className="min-w-0 text-sm" htmlFor="yield-pct">{t("threshold")}<input id="yield-pct" type="number" step="0.01" value={draft.pct} onChange={e => setDraft({ ...draft, pct: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /></label>
      <label className="min-w-0 text-sm" htmlFor="yield-days">{t("window")}<input id="yield-days" type="number" min="1" max="366" step="1" value={draft.days} onChange={e => setDraft({ ...draft, days: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /></label>
      <label className="text-sm sm:col-span-3"><input id="yield-active" type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> {t("activeField")}</label>
    </fieldset><p className="mt-3 text-sm">{t("validation")}</p><button id="yield-save" disabled={!valid || busy} className="mt-4 rounded-lg bg-navy p-3 text-white disabled:opacity-50">{t(busy ? "loading" : "save")}</button></form>}
    {error && <p role="alert" className="mt-4 text-red-700">{t("error")}</p>}
  </section>;
}
