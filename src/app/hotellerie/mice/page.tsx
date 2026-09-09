"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { calculateMiceBudget, miceBudgetCsv, MICE_FIELDS, type MiceBudget, type MiceField } from "@/lib/hotellerie/mice-budget";
export default function MicePage() {
 const t = useTranslations("miceBudget"), locale = useLocale(), prefix = locale === "fr" ? "" : `/${locale}`;
 const [start,setStart]=useState(""),[end,setEnd]=useState(""),[reference,setReference]=useState("");
 const [values,setValues]=useState<Record<MiceField,string>>(() => Object.fromEntries(MICE_FIELDS.map(k=>[k,""])) as Record<MiceField,string>);
 const input = {start,end,reference,...Object.fromEntries(MICE_FIELDS.map(k=>[k,values[k].trim() ? Number(values[k]) : NaN]))} as MiceBudget;
 let result: ReturnType<typeof calculateMiceBudget> | null = null; try {result=calculateMiceBudget(input)} catch {}
 const format=(n:number|null)=>n===null?"—":n.toLocaleString(locale==="lb"?"de-DE":locale,{maximumFractionDigits:2,minimumFractionDigits:2});
 const download=()=>{const url=URL.createObjectURL(new Blob([miceBudgetCsv(input)],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="mice-budget.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <div className="mx-auto max-w-6xl px-4 py-10">
 <Link href={`${prefix}/hotellerie`} className="text-sm underline">{t("back")}</Link><h1 className="mt-3 text-2xl font-bold">{t("title")}</h1><p className="mt-3 text-sm">{t("scope")}</p>
 <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="min-w-0" htmlFor="mice-start">{t("start")}<input id="mice-start" type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 block w-full min-w-0 rounded border p-2" /></label><label className="min-w-0" htmlFor="mice-end">{t("end")}<input id="mice-end" type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 block w-full min-w-0 rounded border p-2" /></label>
 {MICE_FIELDS.map(k=><label key={k} htmlFor={`mice-${k}`} className="min-w-0 text-sm">{t(k)}<input id={`mice-${k}`} type="number" min="0" max="10000000" step="any" value={values[k]} onChange={e=>setValues(v=>({...v,[k]:e.target.value}))} className="mt-1 block w-full min-w-0 rounded border p-2" /></label>)}</div>
 <label className="mt-5 block text-sm" htmlFor="mice-reference">{t("reference")}<textarea id="mice-reference" rows={4} maxLength={3000} value={reference} onChange={e=>setReference(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label><p className="mt-3 text-sm">{t("costScope")}</p>
 {!result?<p role="status" className="mt-5 rounded border p-4 text-sm">{t("invalid")}</p>:<section className="mt-6"><h2 className="text-xl font-semibold">{t("results")}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(result).map(([k,v])=><div key={k} className="min-w-0 rounded border p-4"><h3 className="text-sm">{t(`result_${k}`)}</h3><p data-mice-result={k} className="mt-2 break-words text-xl font-semibold">{format(v)}</p></div>)}</div><button id="mice-csv" onClick={download} className="mt-4 rounded border px-4 py-2">{t("csv")}</button></section>}
 </div>;
}
