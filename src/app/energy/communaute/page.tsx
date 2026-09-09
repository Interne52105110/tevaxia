"use client";
import {useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {PdfButton} from "@/components/PdfButton";
import {calculateEnergySharing,ENERGY_SHARING_EXAMPLE,type EnergySharingInput} from "@/lib/energy-sharing-scenario";
import type {EnergyAuditReport} from "@/components/energy/EnergyAuditPdf";
const sources=["https://www.ilr.lu/secteurs-activites/energie/electricite/energie-renouvelable-partage/autoconsommation-partage-delectricite/","https://www.myilr.lu/mes-questions/energie/produire-autoconsommer-et-partager-delectricite/"];
export default function CommunautePage(){
 const t=useTranslations("energySharingAudit"),locale=useLocale();
 const [input,setInput]=useState({...ENERGY_SHARING_EXAMPLE});
 let result=null;try{result=calculateEnergySharing(input);}catch{/* Hide invalid output. */}
 const numberLocale=locale==="lb"?"de-DE":locale;
 const number=(n:number)=>new Intl.NumberFormat(numberLocale,{maximumFractionDigits:2}).format(n);
 const money=(n:number)=>new Intl.NumberFormat(numberLocale,{style:"currency",currency:"EUR",maximumFractionDigits:2}).format(n);
 const fields=Object.keys(ENERGY_SHARING_EXAMPLE) as (keyof EnergySharingInput)[];
 const energyKeys=["surplus","selfConsumptionPct","demandCoveredPct"] as const;
 const moneyKeys=["consumerSavings","averageConsumerSavings","internalPayment","exportRevenue","producerCash","collectiveBenefit","netInvestment"] as const;
 const payback=(n:number|null)=>n===null?t("notRecovered"):number(n)+" "+t("years");
 const rows=result?[...energyKeys.map(key=>({label:t(key),value:number(result[key])+(key==="surplus"?" kWh":" %")})),...moneyKeys.map(key=>({label:t(key),value:money(result[key])})),...(["producerPayback","collectivePayback"] as const).map(key=>({label:t(key),value:payback(result[key])}))]:[];
 const report:EnergyAuditReport={title:t("title"),sections:[{title:t("scopeTitle"),text:t("scope")+" "+t("timing")},{title:t("results"),rows},{title:t("inputs"),rows:fields.map(key=>({label:t(key),value:number(input[key])}))},{title:t("method"),text:t("formula")+" "+t("limits")+" "+t("allocation")}],sources};
 return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1><p className="mt-3 text-muted">{t("intro")}</p>
  <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-semibold">{t("scopeTitle")}</h2><p className="mt-2">{t("scope")}</p><p className="mt-2">{t("timing")}</p></section>
  <section className="mt-6 rounded-2xl border border-card-border bg-card p-5"><h2 className="font-semibold">{t("inputs")}</h2>
   <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(key=><label key={key} className="text-sm">{t(key)}<input id={"sharing-"+key} type="number" step={key==="participants"?1:"any"} min={key==="exportPrice"?-10:0} value={Number.isNaN(input[key])?"":input[key]} onChange={e=>setInput({...input,[key]:e.target.valueAsNumber})} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5"/></label>)}</div>
   <p className="mt-4 text-sm text-muted">{t("productionNote")} <a className="text-energy underline" href="https://re.jrc.ec.europa.eu/pvg_tools/en/">{t("pvgis")}</a></p>
  </section>
  {!result&&<p role="alert" className="mt-5 text-red-700">{t("invalid")}</p>}
  {result&&<section className="mt-6 rounded-2xl border border-card-border bg-card p-5"><h2 className="font-semibold">{t("results")}</h2>
   <dl className="mt-4">{rows.map((row,j)=><div key={j} className="flex flex-wrap justify-between gap-2 border-b border-card-border py-3"><dt>{row.label}</dt><dd className="font-semibold">{row.value}</dd></div>)}</dl>
   <p className="my-4 text-sm text-muted">{t("allocation")}</p><PdfButton label={t("pdf")} filename="tevaxia-energy-sharing.pdf" generateBlob={async()=>(await import("@/components/energy/EnergyAuditPdf")).generateEnergyAuditPdf(report)}/>
  </section>}
  <section className="mt-6 space-y-3 rounded-2xl border border-card-border p-5"><h2 className="font-semibold">{t("method")}</h2><p className="text-sm text-muted">{t("formula")}</p><p className="text-sm text-muted">{t("limits")}</p>{sources.map((url,j)=><a key={url} className="block text-energy underline" href={url}>{t(j===0?"ilr":"contracts")}</a>)}</section>
 </main>;
}
