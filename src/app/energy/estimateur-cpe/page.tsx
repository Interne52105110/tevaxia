"use client";
import {useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {measuredEnergyIntensity} from "@/lib/measured-energy";
const QUESTIONS=[
 ["type","stepTypeTitle",["optAppartement","optMaisonMitoyenne","optMaisonIndividuelle"]],
 ["annee","stepAnneeTitle",["optAvant1945","opt1945_1970","opt1970_1990","opt1990_2005","opt2005_2015","optApres2015"]],
 ["chauffage","stepChauffageTitle",["optFioul","optElectriqueDirect","optGazNaturel","optBoisPellets","optChauffageUrbain","optPompeAChaleur"]],
 ["isolation","stepIsolationTitle",["optAucuneIsolation","optIsolationPartielle","optBonneIsolation","optExcellenteIsolation"]],
 ["fenetres","stepFenetresTitle",["optSimpleVitrage","optDoubleVitrageAncien","optDoubleVitrageRecent","optTripleVitrage"]],
 ["ventilation","stepVentilationTitle",["optVentilationNaturelle","optVmcSimpleFlux","optVmcDoubleFlux"]]
] as const;
export default function EstimateurCpePage(){
 const t=useTranslations("cpePreparationAudit"),q=useTranslations("energy.estimateurCpe"),locale=useLocale();
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [surface,setSurface]=useState<number>(NaN),[energy,setEnergy]=useState<number>(NaN);
 let intensity=null;try{intensity=measuredEnergyIntensity(energy,surface);}catch{/* Incomplete measurements cannot produce a result. */}
 const fmt=(n:number)=>new Intl.NumberFormat(locale==="lb"?"de-DE":locale,{maximumFractionDigits:2}).format(n);
 return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1><p className="mt-3 text-muted">{t("intro")}</p>
  <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">{t("scope")}</section>
  <section className="mt-6 rounded-2xl border border-card-border bg-card p-5"><h2 className="font-semibold">{t("questions")}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{QUESTIONS.map(([key,title,options])=><label key={key} className="text-sm">{q(title)}<select id={"cpe-"+key} value={answers[key]??""} onChange={e=>setAnswers({...answers,[key]:e.target.value})} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-3"><option value="">{t("unknown")}</option>{options.map(option=><option key={option} value={option}>{q(option)}</option>)}</select></label>)}</div></section>
  <section className="mt-6 rounded-2xl border border-card-border p-5"><h2 className="font-semibold">{t("summary")}</h2><dl className="mt-4">{QUESTIONS.map(([key,title])=><div key={key} className="flex flex-wrap justify-between gap-2 border-b border-card-border py-3"><dt>{q(title)}</dt><dd className="font-medium">{answers[key]?q(answers[key]):t("unknown")}</dd></div>)}</dl><p className="mt-4 text-sm text-muted">{t("expert")}</p></section>
  <section className="mt-6 rounded-2xl border border-card-border p-5"><h2 className="font-semibold">{t("measurements")}</h2><p className="mt-2 text-sm text-muted">{t("measurementNote")}</p>
   <div className="mt-4 grid gap-4 sm:grid-cols-2"><label>{t("energy")}<input id="cpe-energy" type="number" min="0" step="any" value={Number.isNaN(energy)?"":energy} onChange={e=>setEnergy(e.target.valueAsNumber)} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-3"/></label><label>{t("surface")}<input id="cpe-surface" type="number" min="0.01" step="any" value={Number.isNaN(surface)?"":surface} onChange={e=>setSurface(e.target.valueAsNumber)} className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-3"/></label></div>
   {intensity!==null?<p id="cpe-measured-result" className="mt-4 font-semibold">{t("ratio")}: {fmt(intensity)} kWh/m²</p>:<p className="mt-4 text-sm text-muted">{t("missing")}</p>}
  </section>
  <section className="mt-6 space-y-3 rounded-2xl border border-card-border p-5"><h2 className="font-semibold">{t("documents")}</h2><p className="text-sm text-muted">{t("documentsText")}</p><a className="block text-energy underline" href="https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html">{t("source")}</a></section>
 </main>;
}
