"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { loadOwnedMarketAlerts, parseMarketTarget, writeOwnedMarketAlert, type OwnedMarketAlert } from "@/lib/owned-market-alerts";
interface Props { commune: string; showLabel?: boolean; activeAlertCount?: number }
export default function MarketAlertButton(props: Props) {
  const { user, loading } = useAuth();
  return <ThresholdEditor key={`${user?.id ?? "guest"}:${props.commune}`} {...props} owner={user?.id} authLoading={loading} />;
}
function ThresholdEditor({ commune, showLabel, owner, authLoading }: Props & { owner?: string; authLoading: boolean }) {
  const t = useTranslations("marketThresholds"), locale = useLocale(), prefix = locale === "fr" ? "" : `/${locale}`;
  const [open, setOpen] = useState(false), [rows, setRows] = useState<OwnedMarketAlert[] | null>(null);
  const [target, setTarget] = useState(""), [direction, setDirection] = useState<"below" | "above">("below");
  const [error, setError] = useState<"load" | "save" | "invalid" | "duplicate" | null>(null);
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null), running = useRef(false), live = useRef(true), fieldId = useId();
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => { const node = dialog.current; if (!node) return; if (open && !node.open) node.showModal(); else if (!open && node.open) node.close(); }, [open]);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    void loadOwnedMarketAlerts(owner, commune).then(result => {
      if (!active) return;
      setRows(result);
      if (result.length > 1) { setError("duplicate"); return; }
      setTarget(result[0]?.target_price_m2 == null ? "" : String(result[0].target_price_m2));
      setDirection(result[0]?.direction ?? "below");
    }).catch(() => { if (active) setError("load"); });
    return () => { active = false; };
  }, [owner, commune, attempt]);
  const reload = () => { if (running.current) return; setRows(null); setError(null); setSaved(false); setAttempt(value => value + 1); };
  const write = async (remove: boolean) => {
    if (!owner || !rows || rows.length > 1 || running.current || (error && error !== "invalid")) return;
    let amount: number | null;
    try { amount = remove ? null : parseMarketTarget(target); } catch { setError("invalid"); return; }
    if (remove && !rows[0]) return;
    running.current = true; setBusy(true); setError(null); setSaved(false);
    try {
      const result = await writeOwnedMarketAlert(owner, rows[0] ?? null, remove ? null : { commune, target_price_m2: amount, direction, active: true }, () => live.current);
      if (live.current) { setRows(remove ? [] : [result]); if (remove) { setTarget(""); setDirection("below"); } setSaved(true); }
    } catch { if (live.current) setError("save"); }
    finally { running.current = false; if (live.current) setBusy(false); }
  };
  const blocked = busy || rows === null || (!!error && error !== "invalid");
  return <>
    <button type="button" onClick={() => setOpen(true)} disabled={authLoading} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-xs text-navy hover:bg-background">
      <span aria-hidden="true">{rows?.some(row => row.active) ? "●" : "◇"}</span>{showLabel ? commune : t("button")}
    </button>
    <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else setOpen(false); }} aria-labelledby={`${fieldId}-title`} className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-xl border border-card-border bg-card p-5 text-slate shadow-xl backdrop:bg-black/40 [overflow-wrap:anywhere]">
      <h2 id={`${fieldId}-title`} className="text-base font-semibold text-navy">{t("title", { commune })}</h2>
      <p className="mt-2 text-sm text-muted">{t("manualNotice")}</p>
      {!owner ? <p className="mt-4 text-sm"><Link href={`${prefix}/connexion`} className="text-navy underline">{t("login")}</Link></p> : <form className="mt-4 space-y-3" aria-busy={busy} onSubmit={event => { event.preventDefault(); void write(false); }}>
        {rows === null && !error && <p role="status" className="text-sm">{t("loading")}</p>}
        <label htmlFor={`${fieldId}-target`} className="block text-sm">{t("target")}</label>
        <input id={`${fieldId}-target`} type="text" inputMode="decimal" value={target} disabled={blocked} onChange={event => setTarget(event.target.value)} className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
        <p className="text-xs text-muted">{t("optionalTarget")}</p>
        <label htmlFor={`${fieldId}-direction`} className="block text-sm">{t("direction")}</label>
        <select id={`${fieldId}-direction`} value={direction} disabled={blocked} onChange={event => setDirection(event.target.value as "below" | "above")} className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"><option value="below">{t("below")}</option><option value="above">{t("above")}</option></select>
        {error && <p role="alert" className="text-sm text-red-700">{t(error === "load" ? "loadFailed" : error === "invalid" ? "invalidTarget" : error === "duplicate" ? "duplicates" : "saveFailed")}</p>}
        {error && error !== "invalid" && <button type="button" onClick={reload} disabled={busy} className="text-sm underline">{t("reload")}</button>}
        {error === "duplicate" && <Link href={`${prefix}/profil`} className="block text-sm text-navy underline">{t("manage")}</Link>}
        {saved && <p role="status" className="text-sm text-emerald-700">{t("confirmed")}</p>}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={blocked} className="rounded-lg bg-navy px-3 py-2 text-sm text-white disabled:opacity-50">{busy ? t("saving") : t("save")}</button>{rows?.length === 1 && <button type="button" disabled={blocked} onClick={() => { void write(true); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50">{t("remove")}</button>}</div>
      </form>}
      <button type="button" disabled={busy} onClick={() => setOpen(false)} className="mt-4 text-sm text-muted underline">{t("close")}</button>
    </dialog>
  </>;
}
