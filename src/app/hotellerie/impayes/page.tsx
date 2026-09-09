"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { calculateLatePayment, latePaymentCsv, LATE_PAYMENT_SOURCES, type LatePayment } from "@/lib/hotellerie/late-payment";
const blankPeriod = () => ({ start: "", end: "", rate: "", reference: "" });
export default function HotelImpayesPage() {
  const t = useTranslations("latePayment"), locale = useLocale(), prefix = locale === "fr" ? "" : `/${locale}`;
  const [debtor, setDebtor] = useState("");
  const [invoice, setInvoice] = useState(""), [principal, setPrincipal] = useState(""), [fees, setFees] = useState(""), [reference, setReference] = useState("");
  const [periods, setPeriods] = useState([blankPeriod()]);
  const input: LatePayment = { debtor: debtor as LatePayment["debtor"], invoice, principal: principal.trim() ? Number(principal) : NaN, fees: fees.trim() ? Number(fees) : NaN, reference, periods: periods.map(p => ({ ...p, rate: p.rate.trim() ? Number(p.rate) : NaN })) };
  let result: ReturnType<typeof calculateLatePayment> | null = null;
  try { result = calculateLatePayment(input); } catch {}
  const money = (n: number) => new Intl.NumberFormat(locale === "lb" ? "de-DE" : locale, { style: "currency", currency: "EUR" }).format(n);
  const download = () => { const url = URL.createObjectURL(new Blob([latePaymentCsv(input)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "late-payment.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <div className="mx-auto max-w-5xl px-4 py-10">
    <Link className="text-sm underline" href={`${prefix}/hotellerie`}>{t("back")}</Link><h1 className="mt-3 text-2xl font-bold">{t("title")}</h1>
    <p className="mt-3 text-sm">{t("scope")}</p><p className="mt-3 rounded-lg border p-4 text-sm">{t("legal")}</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm" htmlFor="late-debtor">{t("debtor")}<select id="late-debtor" value={debtor} onChange={e => setDebtor(e.target.value)} className="mt-1 block w-full rounded-lg border p-2"><option value="">{t("choose")}</option>{["business", "consumer", "public"].map(k => <option key={k} value={k}>{t(k)}</option>)}</select></label>
      <label className="min-w-0 text-sm" htmlFor="late-invoice">{t("invoice")}<input id="late-invoice" maxLength={160} value={invoice} onChange={e => setInvoice(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
      {[{ key: "principal", value: principal, set: setPrincipal }, { key: "fees", value: fees, set: setFees }].map(f => <label key={f.key} className="min-w-0 text-sm" htmlFor={`late-${f.key}`}>{t(f.key)}<input id={`late-${f.key}`} type="number" min="0" max="1000000000" step="0.01" value={f.value} onChange={e => f.set(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>)}
    </div>
    <label className="mt-4 block text-sm" htmlFor="late-reference">{t("reference")}<textarea id="late-reference" maxLength={3000} rows={3} value={reference} onChange={e => setReference(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
    <h2 className="mt-6 text-xl font-semibold">{t("periods")}</h2><p className="mt-2 text-sm">{t("datesScope")}</p>
    {periods.map((row, i) => <fieldset key={i} className="mt-4 min-w-0 rounded-lg border p-4"><legend className="px-2">{t("period")} {i + 1}</legend>
      <div className="grid gap-4 sm:grid-cols-3">{(["start", "end", "rate"] as const).map(k => <label key={k} htmlFor={`late-${i}-${k}`} className="min-w-0 text-sm">{t(k)}<input id={`late-${i}-${k}`} type={k === "rate" ? "number" : "date"} min={k === "rate" ? 0 : undefined} max={k === "rate" ? 100 : undefined} step={k === "rate" ? .0001 : undefined} value={row[k]} onChange={e => setPeriods(ps => ps.map((p, n) => n === i ? { ...p, [k]: e.target.value } : p))} className="mt-1 block w-full min-w-0 rounded-lg border p-2" /></label>)}</div>
      <label className="mt-4 block text-sm" htmlFor={`late-${i}-reference`}>{t("rateReference")}<textarea id={`late-${i}-reference`} rows={2} maxLength={1500} value={row.reference} onChange={e => setPeriods(ps => ps.map((p, n) => n === i ? { ...p, reference: e.target.value } : p))} className="mt-1 block w-full rounded-lg border p-2" /></label>
      {result && <p className="mt-3 text-sm" data-late-period={i}>{result.rows[i].days} {t("days")} · {money(result.rows[i].interest)}</p>}
      {periods.length > 1 && <button className="mt-3 rounded-lg border p-2 text-sm" onClick={() => setPeriods(ps => ps.filter((_, n) => n !== i))}>{t("remove")}</button>}
    </fieldset>)}
    <button id="late-add" disabled={periods.length >= 120} className="mt-4 rounded-lg border p-2" onClick={() => setPeriods(ps => [...ps, blankPeriod()])}>{t("add")}</button>
    {!result ? <p role="status" className="mt-5 rounded-lg border p-4 text-sm">{t("invalid")}</p> : <section className="mt-6"><h2 className="text-xl font-semibold">{t("results")}</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border p-4"><dt>{t("interest")}</dt><dd data-late-result="interest" className="mt-2 text-xl font-bold">{money(result.interest)}</dd></div><div className="rounded-lg border p-4"><dt>{t("total")}</dt><dd data-late-result="total" className="mt-2 text-xl font-bold">{money(result.total)}</dd></div></dl><p className="mt-3 text-sm">{t("resultScope")}</p><button id="late-csv" className="mt-4 rounded-lg border p-3" onClick={download}>{t("csv")}</button></section>}
    <p className="mt-6 text-sm">{t("sources")}</p><ul className="mt-2 space-y-2 text-sm">{LATE_PAYMENT_SOURCES.map((url, i) => <li key={url}><a className="underline" href={url} target="_blank" rel="noreferrer">{i ? "Ministère de la Justice" : "Guichet.lu"}</a></li>)}</ul>
  </div>;
}
