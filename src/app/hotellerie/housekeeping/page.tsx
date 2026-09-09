"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { HOUSEKEEPING_FIELDS, calculateHousekeeping, housekeepingCsv, type HousekeepingField, type HousekeepingPlan } from "@/lib/hotellerie/housekeeping-plan";
export default function HousekeepingPage() {
  const t = useTranslations("housekeepingPlan"), locale = useLocale(), prefix = locale === "fr" ? "" : `/${locale}`;
  const [date, setDate] = useState(""), [reference, setReference] = useState("");
  const [values, setValues] = useState<Record<HousekeepingField, string>>(() => Object.fromEntries(HOUSEKEEPING_FIELDS.map(k => [k, ""])) as Record<HousekeepingField, string>);
  const input = { date, reference, ...Object.fromEntries(HOUSEKEEPING_FIELDS.map(k => [k, values[k].trim() ? Number(values[k]) : NaN])) } as HousekeepingPlan;
  let result: ReturnType<typeof calculateHousekeeping> | null = null;
  try { result = calculateHousekeeping(input); } catch {}
  const format = (n: number | null) => n === null ? t("unknown") : new Intl.NumberFormat(locale === "lb" ? "de-DE" : locale, { maximumFractionDigits: 2 }).format(n);
  const download = () => { const url = URL.createObjectURL(new Blob([housekeepingCsv(input)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "housekeeping-plan.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <div className="mx-auto max-w-6xl px-4 py-10">
    <Link className="text-sm underline" href={`${prefix}/hotellerie`}>{t("back")}</Link><h1 className="mt-3 text-2xl font-bold">{t("title")}</h1><p className="mt-3 text-sm">{t("scope")}</p>
    <label className="mt-5 block text-sm" htmlFor="hk-date">{t("date")}<input id="hk-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border p-2 sm:max-w-xs" /></label>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{HOUSEKEEPING_FIELDS.map(k => <label key={k} className="min-w-0 text-sm" htmlFor={`hk-${k}`}>{t(k)}<input id={`hk-${k}`} type="number" min="0" max={k.includes("Hours") ? 24 : 100000} step={["availableRooms", "checkoutRooms", "stayoverRooms", "supervisors"].includes(k) ? 1 : .01} value={values[k]} onChange={e => setValues(v => ({ ...v, [k]: e.target.value }))} className="mt-1 block w-full min-w-0 rounded-lg border p-2" /></label>)}</div>
    <p className="mt-4 text-sm">{t("timeScope")}</p><p className="mt-3 text-sm">{t("costScope")}</p>
    <label className="mt-4 block text-sm" htmlFor="hk-reference">{t("reference")}<textarea id="hk-reference" rows={4} maxLength={3000} value={reference} onChange={e => setReference(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
    {!result ? <p role="status" className="mt-5 rounded-lg border p-4 text-sm">{t("invalid")}</p> : <section className="mt-6"><h2 className="text-xl font-semibold">{t("results")}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(result).map(([k, v]) => <div key={k} className="min-w-0 rounded-lg border p-4"><h3 className="text-sm">{t(`result_${k}`)}</h3><p data-hk-result={k} className="mt-2 break-words text-xl font-semibold">{format(v)}</p></div>)}</div><p className="mt-4 text-sm">{t("resultScope")}</p><button id="hk-csv" className="mt-4 rounded-lg border p-3" onClick={download}>{t("csv")}</button></section>}
  </div>;
}
