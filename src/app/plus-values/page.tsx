"use client";
import { useAuth } from "@/components/AuthProvider";

import { useState } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import Breadcrumbs from "@/components/Breadcrumbs";
import SaveButton from "@/components/SaveButton";
import { sauvegarderEvaluation } from "@/lib/storage";
import { calculerPlusValue, formatEUR2, type PlusValueInput } from "@/lib/calculations";

export default function PlusValues() {
  const { user: valuationUser } = useAuth();
 const t=useTranslations('plusValuesAudit');
 const [x,setX]=useState<PlusValueInput>({prixAcquisition:400000,anneeAcquisition:2015,dateAcquisition:'2015-01-15',prixCession:650000,anneeCession:2026,dateCession:'2026-09-08',travauxAnnee:2020,estResidencePrincipale:false,estCouple:false,revenuImposable:50000,modeAcquisition:'achat',soumisDependance:true});
 const set=(key:keyof PlusValueInput,value:unknown)=>setX(prev=>({...prev,[key]:value}));
 const result=calculerPlusValue(x);
 const fields: [keyof PlusValueInput,string][]=[['prixAcquisition','prixAcquisition'],['fraisAcquisition','fraisAcquisition'],['prixCession','prixCession'],['fraisCession','fraisCession'],['travauxDeductibles','travaux'],['travauxAnnee','travauxAnnee']];
 const money=(key:keyof PlusValueInput,label:string)=> <InputField key={key} label={t(label)} value={Number(x[key]??0)} onChange={v=>set(key,Number(v))} min={0} suffix={key==='travauxAnnee'?undefined:'€'}/>;
 const interval=(min:number,max:number)=>Math.abs(max-min)<.01?formatEUR2(min):`${formatEUR2(min)} – ${formatEUR2(max)}`;
 return <div className="bg-background py-8"><div className="mx-auto max-w-6xl px-4 sm:px-6">
  <Breadcrumbs/><h1 className="text-2xl font-bold text-navy">{t('title')}</h1><p className="my-4 text-sm text-muted">{t('scope')}</p>
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
   <div className="min-w-0 space-y-5 print:hidden">
    <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
     <h2 className="font-semibold text-navy">{t('transaction')}</h2>
     <InputField label={t('mode')} type="select" value={x.modeAcquisition??'achat'} onChange={v=>setX(p=>({...p,modeAcquisition:v as PlusValueInput['modeAcquisition'],abattementSuccessionDisponible:0}))} options={['achat','succession','donation'].map(value=>({value,label:t(value)}))}/>
     {x.modeAcquisition!=='achat'&&<p className="rounded-lg bg-amber-50 p-3 text-sm">{t('transmission')}</p>}
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(['dateAcquisition','dateCession'] as const).map(key=><label key={key} className="block text-sm font-medium">{t(key)}<input type="date" className="mt-1 w-full min-w-0 rounded-lg border border-input-border bg-input-bg p-2" value={x[key]??''} min={key==='dateCession'?'2025-01-01':'1941-01-01'} max="2026-12-31" onChange={e=>setX(p=>({...p,[key]:e.target.value,[key==='dateAcquisition'?'anneeAcquisition':'anneeCession']:Number(e.target.value.slice(0,4))}))}/></label>)}
      {fields.map(([key,label])=>money(key,label))}
     </div>
     <p className="text-xs text-muted">{t('justificatifs')}</p>
     <ToggleField label={t('transitoire')} checked={x.compromisEnregistreAvantJuillet2025??false} onChange={v=>set('compromisEnregistreAvantJuillet2025',v)} hint={t('transitoireHint')}/>
    </section>
    <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
     <h2 className="font-semibold text-navy">{t('fiscalite')}</h2>
     <ToggleField label={t('couple')} checked={x.estCouple} onChange={v=>setX(p=>({...p,estCouple:v,abattementSuccessionDisponible:0}))}/>
     {money('revenuImposable','revenu')}
     <p className="text-xs text-muted">{t('revenuHint')}</p>
     {money('abattementsAnterieurs','abattements')}
     {x.modeAcquisition==='succession'&&<>{money('abattementSuccessionDisponible','abatSuccession')}<p className="text-xs text-muted">{t('abatSuccessionHint')}</p></>}
     <ToggleField label={t('rp')} checked={x.estResidencePrincipale} onChange={v=>set('estResidencePrincipale',v)}/>
     <p className="text-xs text-muted">{t('rpHint')} <a className="underline" href="https://impotsdirects.public.lu/fr/az/v/vente_resid_principale.html">ACD — art. 102bis</a></p>
     <ToggleField label={t('dependance')} checked={x.soumisDependance??false} onChange={v=>set('soumisDependance',v)}/>
     {x.soumisDependance&&money('autresBasesDependance','autresDependance')}
    </section>
   </div>
   <div className="min-w-0 space-y-5">
    {result.erreurSaisie?<p role="alert" className="rounded-xl bg-amber-50 p-5">{t('erreur')}</p>:<>
     <div className="hidden print:block text-sm space-y-2"><p>{t("dateAcquisition")}: {x.dateAcquisition} — {t("dateCession")}: {x.dateCession}</p><p>{t("mode")}: {t(x.modeAcquisition??"achat")}</p>{fields.map(([key,label])=><p key={key}>{t(label)}: {String(x[key]??0)}</p>)}<p>{t("revenu")}: {formatEUR2(x.revenuImposable??0)}</p><p>{t("couple")}: {x.estCouple?"✓":"—"}</p></div>
     <div className="rounded-xl bg-navy p-5 text-white"><h2 className="font-semibold">{t(result.typeGain)}</h2><p className="mt-2 text-sm">{t('regime',{annees:result.seuilSpeculation,fraction:result.fractionTaux===.25?'¼':result.fractionTaux===.5?'½':'1'})}</p></div>
     <ResultPanel title={t('base')} lines={[
      {label:t('prixCession'),value:formatEUR2(x.prixCession)},
      {label:t('coefficient'),value:result.coefficient.toFixed(2)},
      {label:t('prixReevalue'),value:formatEUR2(result.prixAcquisitionRevalorise)},
      {label:t('fraisReevalues'),value:formatEUR2(result.fraisForfaitaires)},
      {label:t('gainBrut'),value:formatEUR2(result.gainBrut)},
      {label:t('abatSuccession'),value:formatEUR2(result.abattementSuccession)},
      {label:t('abatApplique'),value:formatEUR2(result.abattement)},
      {label:t('gainImposable'),value:formatEUR2(result.gainImposable),highlight:true},
     ]}/>
     <ResultPanel title={t('impots')} lines={[
      {label:t('ir'),value:formatEUR2(result.estimationImpot)},
      {label:t('emploi'),value:interval(result.emploiMin,result.emploiMax)},
      {label:t('dependanceResult'),value:formatEUR2(result.dependance)},
      {label:t('total'),value:interval(result.impotTotalMin,result.impotTotalMax),highlight:true},
      {label:t('produit'),value:interval(result.produitNetMin,result.produitNetMax),highlight:true},
     ]}/>
     <p className="rounded-xl bg-amber-50 p-4 text-xs">{t('provision')}</p>
     <p className="text-xs text-muted">{t('produitHint')}</p>
     <div className="flex flex-wrap gap-3 print:hidden"><SaveButton onClick={async ()=>await sauvegarderEvaluation({nom:`${t('title')} — ${x.dateCession}`,type:'plus-values',valeurPrincipale:result.impotTotalMax,data:{...x,versionCalcul:2}}, valuationUser?.id ?? null)}/><button className="rounded-lg bg-navy px-4 py-2 text-sm text-white" onClick={()=>window.print()}>{t('imprimer')}</button></div>
    </>}
    <div className="rounded-xl border border-card-border p-5 text-sm space-y-3"><h2 className="font-semibold">{t('sources')}</h2><p>{t('limitations')}</p><ul className="space-y-2">
     <li><a className="underline" href="https://impotsdirects.public.lu/fr/az/v/vente_immeuble.html">ACD — vente d’un immeuble</a></li>
     <li><a className="underline" href="https://impotsdirects.public.lu/dam-assets/fr/formulaires/pers_physiques/2025/700F-2025.pdf">Modèle 700 F 2025 — régime transitoire, p. 4</a></li>
     <li><a className="underline" href="https://impotsdirects.public.lu/fr/az/d/demi_txglob.html">ACD — demi-taux global</a></li>
     <li><a className="underline" href="https://impotsdirects.public.lu/fr/az/t/tarif_pers.html">ACD — barème 2025–2026</a></li>
     <li><a className="underline" href="https://impotsdirects.public.lu/content/dam/acd/fr/legislation/legi09/Circulaire_CADEP_1_du_23_octobre_2009.pdf">ACD — CADEP1, contribution dépendance</a></li>
    </ul></div>
   </div>
  </div>
 </div></div>;
}
