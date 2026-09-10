"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadOwnedMarketAlerts, writeOwnedMarketAlert, type OwnedMarketAlert } from "@/lib/owned-market-alerts";
export default function MarketAlertsSection({ user }: { user: { id: string } | null }) {
  return user ? <ThresholdList key={user.id} owner={user.id} /> : null;
}
function ThresholdList({ owner }: { owner: string }) {
  const t = useTranslations("marketThresholds"), locale = useLocale();
  const [rows, setRows] = useState<OwnedMarketAlert[] | null>(null), [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<"load" | "save" | null>(null), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const live = useRef(true), running = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => { let active = true; void loadOwnedMarketAlerts(owner).then(result => { if (active) setRows(result.sort((a,b) => b.created_at.localeCompare(a.created_at))); }).catch(() => { if (active) setError("load"); }); return () => { active = false; }; }, [owner, attempt]);
  const reload = () => { if (running.current) return; setRows(null); setError(null); setSaved(false); setAttempt(value => value + 1); };
  const write = async (row: OwnedMarketAlert, remove: boolean) => {
    if (running.current || error) return;
    running.current = true; setBusy(true); setSaved(false);
    try {
      const result = await writeOwnedMarketAlert(owner, row, remove ? null : { commune: row.commune, target_price_m2: row.target_price_m2, direction: row.direction, active: !row.active }, () => live.current);
      if (live.current) { setRows(previous => previous ? remove ? previous.filter(item => item.id !== row.id) : previous.map(item => item.id === row.id ? result : item) : null); setSaved(true); }
    } catch { if (live.current) setError("save"); }
    finally { running.current = false; if (live.current) setBusy(false); }
  };
  const format = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { maximumFractionDigits: 2 });
  return <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm [overflow-wrap:anywhere]" aria-busy={busy || (!rows && !error)}>
    <h2 className="text-base font-semibold text-navy">{t("listTitle")}</h2><p className="mt-2 text-sm text-muted">{t("manualNotice")}</p>
    {!rows && !error && <p role="status" className="mt-4 text-sm">{t("loading")}</p>}
    {error && <div className="mt-4"><p role="alert" className="text-sm text-red-700">{t(error === "load" ? "loadFailed" : "saveFailed")}</p><button type="button" onClick={reload} disabled={busy} className="mt-2 text-sm underline">{t("reload")}</button></div>}
    {rows?.length === 0 && <p className="mt-4 text-sm text-muted">{t("empty")}</p>}
    {saved && <p role="status" className="mt-3 text-sm text-emerald-700">{t("confirmed")}</p>}
    <div className="mt-4 space-y-3">{rows?.map(row => <div key={row.id} className="rounded-lg border border-card-border p-3">
      <p className="text-sm font-medium text-navy">{row.commune}</p><p className="mt-1 text-xs text-muted">{row.target_price_m2 === null ? t("optionalTarget") : `${t(row.direction)} ${format.format(row.target_price_m2)} EUR/m²`}</p>
      <div className="mt-2 flex flex-wrap gap-3"><button type="button" disabled={busy || !!error} aria-pressed={row.active} aria-label={t(row.active ? "pauseNamed" : "resumeNamed", { commune: row.commune })} onClick={() => { void write(row, false); }} className="rounded-lg border border-card-border px-3 py-2 text-xs text-navy disabled:opacity-50">{t(row.active ? "pause" : "resume")}</button><button type="button" disabled={busy || !!error} aria-label={t("removeNamed", { commune: row.commune })} onClick={() => { void write(row, true); }} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 disabled:opacity-50">{t("remove")}</button></div>
    </div>)}</div>
  </section>;
}
