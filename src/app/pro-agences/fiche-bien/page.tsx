"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { generatePropertyPresentationPdfBlob } from "@/components/PropertyPresentationPdf";
import { calculerFraisAcquisition, calculerMensualite } from "@/lib/calculations";

import {bankingMoney} from '@/lib/banking-basics';

export default function FicheBienPage() {
  const t = useTranslations("proaFicheBien");
  const audit = useTranslations('agencyPresentationAudit');
  const banking = useTranslations('bankingBasicsAudit');
  const locale = useLocale();
  const formatEUR = (n:number)=>bankingMoney(n,locale);
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

  const [agencyName, setAgencyName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentContact, setAgentContact] = useState("");
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Appartement");
  const [address, setAddress] = useState("");
  const [commune, setCommune] = useState("");
  const [surface, setSurface] = useState(85);
  const [nbRooms, setNbRooms] = useState(3);
  const [nbBedrooms, setNbBedrooms] = useState(2);
  const [energyClass, setEnergyClass] = useState("");
  const [insulationClass,setInsulationClass]=useState('');
  const [includeValuation,setIncludeValuation]=useState(false);
  const [existing,setExisting]=useState(true);
  const [error,setError]=useState('');
  const [parking, setParking] = useState(true);
  const [yearBuilt, setYearBuilt] = useState(2010);
  const [description, setDescription] = useState("");
  const [featuresText, setFeaturesText] = useState(t("defaultFeatures"));
  const [askingPrice, setAskingPrice] = useState(750000);
  const [estimatedValue, setEstimatedValue] = useState(730000);
  const [estimationRange, setEstimationRange] = useState(10);
  const [includeFinancing, setIncludeFinancing] = useState(true);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(3.3);
  const [loanDuration, setLoanDuration] = useState(25);
  const [includeFees, setIncludeFees] = useState(true);

  const [generating, setGenerating] = useState(false);

  const financingData = useMemo(() => {
    if (!includeFinancing) return null;
    const downPayment = askingPrice * (downPaymentPct / 100);
    const loanAmount = askingPrice - downPayment;
    if (![askingPrice,downPaymentPct,loanRate,loanDuration].every(Number.isFinite) || askingPrice <= 0 || askingPrice > 1e12 || downPaymentPct < 0 || downPaymentPct > 100 || loanRate < 0 || loanRate > 30 || !Number.isInteger(loanDuration) || loanDuration < 1 || loanDuration > 50) return null;
    const monthlyPayment = calculerMensualite(loanAmount, loanRate / 100, loanDuration);
    return { downPayment, loanAmount, monthlyPayment };
  }, [includeFinancing, askingPrice, downPaymentPct, loanRate, loanDuration]);

  const feesSupported=existing&&['Appartement','Maison','Studio','Penthouse'].includes(propertyType);
  const validProperty=[askingPrice,surface,nbRooms,nbBedrooms,yearBuilt].every(Number.isFinite)&&askingPrice>0&&askingPrice<=1e12&&surface>0&&surface<=1e7&&Number.isInteger(nbRooms)&&nbRooms>=0&&nbRooms<=1000&&Number.isInteger(nbBedrooms)&&nbBedrooms>=0&&nbBedrooms<=nbRooms&&Number.isInteger(yearBuilt)&&yearBuilt>=1000&&yearBuilt<=2100&&(!includeValuation||([estimatedValue,estimationRange].every(Number.isFinite)&&estimatedValue>0&&estimatedValue<=1e12&&estimationRange>=0&&estimationRange<=100));
  const feesData = useMemo(() => {
    if (!includeFees || !feesSupported || !Number.isFinite(askingPrice) || askingPrice<=0 || askingPrice>1e12) return null;
    const r=calculerFraisAcquisition({prixBien:askingPrice,estNeuf:false,residencePrincipale:false,nbAcquereurs:1});
    return {registrationDuties:r.droitsTotal,notaryFees:r.emolumentsNotaire,total:r.droitsTotal+r.emolumentsNotaire};
  }, [includeFees,feesSupported,askingPrice]);

  const handleGenerate = async () => {
    setError('');
    if(!validProperty){setError(audit('invalid'));return;}
    if (includeFinancing && !financingData) { alert(banking('invalid')); return; }
    if (!title.trim() || !address.trim()) {
      alert(t("alertRequired"));
      return;
    }
    setGenerating(true);
    try {
      const features = featuresText.split("\n").filter((l) => l.trim().length > 0);
      const blob = await generatePropertyPresentationPdfBlob({
        locale,labels:Object.fromEntries(['sectionAgency','fieldAgencyName','fieldAgentName','fieldAgentContact','fieldAsking','fieldSurface','sectionProperty','fieldType','fieldNbRooms','fieldNbBedrooms','fieldYearBuilt','fieldParking','fieldEnergy','fieldDesc','fieldFeatures','toggleFinancing','finDownLabel','finLoanLabel','fieldRate','fieldDuration','durationSuffix','finMonthlyLabel','usageTitle','pageTitle'].map(k=>[k,t(k)])),
        auditLabels:Object.fromEntries(['energyNote','unknown','insulation','valuation','valuationNote','lower','upper','feesTotal','feesScope','registration','notary','financeNote','cash','scope','yes','no'].map(k=>[k,audit(k)])),
        agencyName: agencyName || undefined,
        agentName: agentName || undefined,
        agentContact: agentContact || undefined,
        title,
        propertyType: propertyTypeOptions.find(o=>o.value===propertyType)?.label||propertyType,
        address,
        commune,
        surface,
        nbRooms:propertyType==='Terrain'?undefined:nbRooms,
        nbBedrooms:propertyType==='Terrain'?undefined:nbBedrooms,
        energyClass: propertyType==='Terrain'?undefined:energyClass||undefined,
        insulationClass: propertyType==='Terrain'?undefined:insulationClass||undefined,
        parking,
        yearBuilt:propertyType==='Terrain'?undefined:yearBuilt,
        description: description || undefined,
        askingPrice,
        estimatedValue:includeValuation?estimatedValue:undefined,
        estimationLow: includeValuation?estimatedValue * (1 - estimationRange / 100):undefined,
        estimationHigh: includeValuation?estimatedValue * (1 + estimationRange / 100):undefined,
        pricePerSqm: surface > 0 ? askingPrice / surface : undefined,
        downPayment: financingData?.downPayment,
        loanAmount: financingData?.loanAmount,
        loanRate: includeFinancing ? loanRate : undefined,
        loanDuration: includeFinancing ? loanDuration : undefined,
        monthlyPayment: financingData?.monthlyPayment,
        acquisitionFees: feesData?.total,
        registrationDuties: feesData?.registrationDuties,
        notaryFees: feesData?.notaryFees,
        features,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche-bien-${title.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}-${new Date().toLocaleDateString(dateLocale).replace(/\//g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(audit('error'));
    } finally {
      setGenerating(false);
    }
  };

  const propertyTypeOptions = [
    { value: "Appartement", label: t("typeApt") },
    { value: "Maison", label: t("typeMaison") },
    { value: "Studio", label: t("typeStudio") },
    { value: "Penthouse", label: t("typePent") },
    { value: "Terrain", label: t("typeTerrain") },
    { value: "Local commercial", label: t("typeCommercial") },
    { value: "Bureau", label: t("typeBureau") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`${lp}/pro-agences`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitle")}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">{t("sectionAgency")}</h2>
            <div className="grid gap-3">
              <InputField label={t("fieldAgencyName")} type="text" value={agencyName} onChange={setAgencyName} />
              <InputField label={t("fieldAgentName")} type="text" value={agentName} onChange={setAgentName} />
              <InputField label={t("fieldAgentContact")} type="text" value={agentContact} onChange={setAgentContact} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">{t("sectionProperty")}</h2>
            <div className="grid gap-3">
              <InputField label={t("fieldTitle")} type="text" value={title} onChange={setTitle} hint={t("fieldTitleHint")} />
              <InputField
                label={t("fieldType")}
                type="select"
                value={propertyType}
                onChange={setPropertyType}
                options={propertyTypeOptions}
              />
              <InputField label={t("fieldAddress")} type="text" value={address} onChange={setAddress} />
              <InputField label={t("fieldCommune")} type="text" value={commune} onChange={setCommune} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label={t("fieldSurface")} value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label={t("fieldYearBuilt")} value={yearBuilt} onChange={(v) => setYearBuilt(Number(v))} min={1800} max={2030} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label={t("fieldNbRooms")} value={nbRooms} onChange={(v) => setNbRooms(Number(v))} min={1} max={20} />
                <InputField label={t("fieldNbBedrooms")} value={nbBedrooms} onChange={(v) => setNbBedrooms(Number(v))} min={0} max={15} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={t("fieldEnergy")}
                  type="select"
                  value={energyClass}
                  onChange={setEnergyClass}
                  options={['','A+','A','B','C','D','E','F','G','H','I'].map(v=>({value:v,label:v||audit('unknown')}))}
                />
                <InputField label={audit('insulation')} type="select" value={insulationClass} onChange={setInsulationClass} options={['','A+','A','B','C','D','E','F','G','H','I'].map(v=>({value:v,label:v||audit('unknown')}))}/>
                <ToggleField label={t("fieldParking")} checked={parking} onChange={setParking} />
              </div>
            </div>
          </div>

          <p className="text-sm text-muted">{audit('energyNote')}</p>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">{t("sectionDesc")}</h2>
            <label className="block text-xs font-semibold text-slate mb-1">{t("fieldDesc")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("fieldDescPlaceholder")}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <label className="block text-xs font-semibold text-slate mt-3 mb-1">{t("fieldFeatures")}</label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">{t("sectionPrice")}</h2>
            <div className="grid gap-3">
              <InputField label={t("fieldAsking")} value={askingPrice} onChange={(v) => setAskingPrice(Number(v))} suffix="€" />
              <ToggleField label={audit('includeValuation')} checked={includeValuation} onChange={setIncludeValuation}/>
              {includeValuation&&<><InputField label={t("fieldEstimated")} value={estimatedValue} onChange={(v) => setEstimatedValue(Number(v))} suffix="€" hint={t("fieldEstimatedHint")} />
              <InputField label={t("fieldRange")} value={estimationRange} onChange={(v) => setEstimationRange(Number(v))} suffix="%" min={0} max={100} /></>}
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <p className="mb-3 text-sm text-muted">{audit('financeNote')}</p>
            <ToggleField label={t("toggleFinancing")} checked={includeFinancing} onChange={setIncludeFinancing} />
            {includeFinancing && (
              <div className="mt-3 grid gap-3">
                <InputField label={t("fieldDownPct")} value={downPaymentPct} onChange={(v) => setDownPaymentPct(Number(v))} suffix="%" min={0} max={100} />
                <InputField label={t("fieldRate")} value={loanRate} onChange={(v) => setLoanRate(Number(v))} suffix="%" step={0.1} />
                <InputField label={t("fieldDuration")} value={loanDuration} onChange={(v) => setLoanDuration(Number(v))} suffix={t("durationSuffix")} min={5} max={35} />
                {!financingData && <p role="alert" className="text-sm text-red-700">{banking('invalid')}</p>}
                {financingData && (
                  <div className="rounded-lg bg-navy/5 p-3 text-xs">
                    <div className="flex flex-wrap gap-2 justify-between"><span className="text-muted">{t("finDownLabel")}</span><span className="font-mono">{formatEUR(financingData.downPayment)}</span></div>
                    <div className="flex flex-wrap gap-2 justify-between"><span className="text-muted">{t("finLoanLabel")}</span><span className="font-mono">{formatEUR(financingData.loanAmount)}</span></div>
                    <div className="flex flex-wrap gap-2 justify-between font-semibold text-navy"><span>{t("finMonthlyLabel")}</span><span className="font-mono">{formatEUR(financingData.monthlyPayment)}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <ToggleField label={t("toggleFees")} checked={includeFees} onChange={setIncludeFees} />
            {includeFees&&<><div className="mt-3"><ToggleField label={audit('existing')} checked={existing} onChange={setExisting}/></div><p className="mt-3 text-sm text-muted">{audit(feesSupported?'feesScope':'feesUnsupported')}</p><Link className="mt-2 block text-sm underline" href={`${lp}/frais-acquisition`}>{audit('quote')}</Link></>}
            {includeFees && feesData && (
              <div className="mt-3 rounded-lg bg-navy/5 p-3 text-xs">
                <div className="flex flex-wrap gap-2 justify-between"><span className="text-muted">{t("feeRegistration")}</span><span className="font-mono">{formatEUR(feesData.registrationDuties)}</span></div>
                <div className="flex flex-wrap gap-2 justify-between"><span className="text-muted">{t("feeNotary")}</span><span className="font-mono">{formatEUR(feesData.notaryFees)}</span></div>
                <div className="flex flex-wrap gap-2 justify-between font-semibold text-navy pt-1 mt-1 border-t border-navy/10"><span>{t("feeTotal")}</span><span className="font-mono">{formatEUR(feesData.total)}</span></div>
              </div>
            )}
          </div>

          {!validProperty&&<p role="alert" className="text-sm text-red-700">{audit('invalid')}</p>}
          {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating||!validProperty||(includeFinancing&&!financingData)}
            className="w-full rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
          >
            {generating ? t("btnGenerating") : t("btnDownload")}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("usageTitle")}</strong> {t("usageBody")}
      </div>
    </div>
  );
}
