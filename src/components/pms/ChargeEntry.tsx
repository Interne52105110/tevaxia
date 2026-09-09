"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CHARGE_CATEGORIES, prepareCharge, type ChargeDraft } from "@/lib/pms/charge-entry";
import { postCharge } from "@/lib/pms/folios";

const initial = (): ChargeDraft => ({ category: "breakfast", description: "", quantity: "1", unit_price_ht: "", tva_rate: "", notes: "" });
export default function ChargeEntry({ userId, folioId, onPosted }: { userId: string; folioId: string; onPosted: () => void }) {
  const t = useTranslations("pmsChargeEntry"), f = useTranslations("pmsFolio"), c = useTranslations("pmsJournal"), locale = useLocale();
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [status, setStatus] = useState("");
  const lock = useRef(false), alive = useRef(true), attempt = useRef<{ payload: string; id: string } | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  let prepared: ReturnType<typeof prepareCharge> | null = null;
  try { prepared = prepareCharge(draft); } catch { /* No preview for missing/invalid input. */ }
  const money = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  async function save() {
    if (lock.current) return;
    let line: ReturnType<typeof prepareCharge>;
    try { line = prepareCharge(draft); } catch { setStatus("invalid"); return; }
    const payload = JSON.stringify({ folioId, userId, ...line });
    if (attempt.current?.payload !== payload) attempt.current = { payload, id: crypto.randomUUID() };
    lock.current = true; setBusy(true); setStatus("");
    try {
      await postCharge({ id: attempt.current.id, folio_id: folioId, category: line.category, description: line.description, quantity: line.quantity, unit_price_ht: line.unit_price_ht, tva_rate: line.tva_rate, notes: line.notes, source: "manual" }, userId);
      if (!alive.current) return;
      attempt.current = null; setDraft(initial()); setStatus("saved"); onPosted();
    } catch { if (alive.current) setStatus("error"); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <section className="mt-5 rounded-xl border border-card-border bg-card p-4 [overflow-wrap:anywhere]">
    <h2 className="text-lg font-bold">{t("title")}</h2><p className="mt-2 text-sm leading-relaxed">{t("scope")}</p>
    <a className="mt-2 inline-block text-sm underline" href="https://pfi.public.lu/dam-assets/pdf/legislation/tva/loi/loi-tva-2026-01-01.pdf" target="_blank" rel="noreferrer">{t("source")}</a>
    <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
      <label htmlFor="charge-category">{f("colCategory")}<select id="charge-category" value={draft.category} onChange={e => { setDraft(d => ({ ...d, category: e.target.value as ChargeDraft["category"], tva_rate: "" })); setStatus(""); }} className="mt-1 w-full min-w-0 rounded border bg-input-bg p-3">{CHARGE_CATEGORIES.map(cat => <option key={cat} value={cat}>{c(`cat_${cat}`)}</option>)}</select></label>
      <label htmlFor="charge-description">{f("fDescription")}<input id="charge-description" maxLength={500} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} className="mt-1 w-full min-w-0 rounded border bg-input-bg p-3" /></label>
      {([['quantity','fQty'],['unit_price_ht','fPuHt'],['tva_rate','fTva']] as const).map(([key,label]) => <label key={key} htmlFor={`charge-${key}`}>{f(label)}<input id={`charge-${key}`} type="number" step="0.01" min={key === "quantity" ? "0.01" : "0"} max={key === "tva_rate" ? "99.99" : undefined} value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="mt-1 w-full min-w-0 rounded border bg-input-bg p-3" /></label>)}
      <label htmlFor="charge-notes" className="sm:col-span-2">{t("reference")}<textarea id="charge-notes" maxLength={2000} value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} className="mt-1 w-full min-w-0 rounded border bg-input-bg p-3" /></label>
    </fieldset>
    {prepared && <div className="mt-4 rounded-lg bg-background p-3" data-charge-preview><h3 className="font-semibold">{t("preview")}</h3><dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">{([['ht','colHt'],['vat','colTva'],['gross','colTtc']] as const).map(([key,label]) => <div key={key}><dt>{f(label)}</dt><dd data-charge-amount={key} className="font-bold tabular-nums">{money.format(prepared[key])}</dd></div>)}</dl></div>}
    {status && <p className="mt-3" role={status === "saved" ? "status" : "alert"}>{t(status)}</p>}
    <button id="charge-save" disabled={busy} onClick={save} className="mt-4 rounded-lg bg-navy px-5 py-3 font-semibold text-white disabled:opacity-50">{t(busy ? "saving" : "save")}</button>
  </section>;
}
