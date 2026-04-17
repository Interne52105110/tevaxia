"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { generatePropertyPresentationPdfBlob } from "@/components/PropertyPresentationPdf";
import { formatEUR, calculerMensualite } from "@/lib/calculations";

export default function FicheBienPage() {
  // Agency
  const [agencyName, setAgencyName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentContact, setAgentContact] = useState("");
  // Property
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Appartement");
  const [address, setAddress] = useState("");
  const [commune, setCommune] = useState("");
  const [surface, setSurface] = useState(85);
  const [nbRooms, setNbRooms] = useState(3);
  const [nbBedrooms, setNbBedrooms] = useState(2);
  const [energyClass, setEnergyClass] = useState("C");
  const [parking, setParking] = useState(true);
  const [yearBuilt, setYearBuilt] = useState(2010);
  const [description, setDescription] = useState("");
  const [featuresText, setFeaturesText] = useState("Lumineux et traversant\nBalcon orientation sud\nParking privatif sous-sol\nProche transports en commun");
  // Price
  const [askingPrice, setAskingPrice] = useState(750000);
  const [estimatedValue, setEstimatedValue] = useState(730000);
  const [estimationRange, setEstimationRange] = useState(10);
  // Financing
  const [includeFinancing, setIncludeFinancing] = useState(true);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(3.3);
  const [loanDuration, setLoanDuration] = useState(25);
  // Fees (estimation simplifiée)
  const [includeFees, setIncludeFees] = useState(true);

  const [generating, setGenerating] = useState(false);

  const financingData = useMemo(() => {
    if (!includeFinancing) return null;
    const downPayment = askingPrice * (downPaymentPct / 100);
    const loanAmount = askingPrice - downPayment;
    const monthlyPayment = calculerMensualite(loanAmount, loanRate / 100, loanDuration);
    return { downPayment, loanAmount, monthlyPayment };
  }, [includeFinancing, askingPrice, downPaymentPct, loanRate, loanDuration]);

  const feesData = useMemo(() => {
    if (!includeFees) return null;
    const droitsEnregistrement = askingPrice * 0.07;
    const notaryFees = askingPrice * 0.013 + 500; // forfait notaire simplifié
    const total = droitsEnregistrement + notaryFees;
    return { registrationDuties: droitsEnregistrement, notaryFees, total };
  }, [includeFees, askingPrice]);

  const handleGenerate = async () => {
    if (!title.trim() || !address.trim()) {
      alert("Titre et adresse requis.");
      return;
    }
    setGenerating(true);
    try {
      const features = featuresText.split("\n").filter((l) => l.trim().length > 0);
      const blob = await generatePropertyPresentationPdfBlob({
        agencyName: agencyName || undefined,
        agentName: agentName || undefined,
        agentContact: agentContact || undefined,
        title,
        propertyType,
        address,
        commune,
        surface,
        nbRooms,
        nbBedrooms,
        energyClass: energyClass || undefined,
        parking,
        yearBuilt,
        description: description || undefined,
        askingPrice,
        estimatedValue,
        estimationLow: estimatedValue * (1 - estimationRange / 100),
        estimationHigh: estimatedValue * (1 + estimationRange / 100),
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
      a.download = `fiche-bien-${title.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}-${new Date().toLocaleDateString("fr-LU").replace(/\//g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/pro-agences" className="text-xs text-muted hover:text-navy">← Pro agences</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Fiche bien — présentation complète PDF</h1>
      <p className="mt-1 text-sm text-muted">
        Générez une fiche de présentation complète pour un bien : caractéristiques, estimation
        indépendante, budget acquisition et plan de financement. Co-brandable agence.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">Agence (optionnel)</h2>
            <div className="grid gap-3">
              <InputField label="Nom agence" type="text" value={agencyName} onChange={setAgencyName} />
              <InputField label="Agent responsable" type="text" value={agentName} onChange={setAgentName} />
              <InputField label="Email / téléphone" type="text" value={agentContact} onChange={setAgentContact} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">Bien</h2>
            <div className="grid gap-3">
              <InputField label="Titre annonce *" type="text" value={title} onChange={setTitle} hint="ex. Bel appartement 3 pièces Luxembourg-Belair" />
              <InputField
                label="Type"
                type="select"
                value={propertyType}
                onChange={setPropertyType}
                options={["Appartement","Maison","Studio","Penthouse","Terrain","Local commercial","Bureau"].map((v) => ({ value: v, label: v }))}
              />
              <InputField label="Adresse *" type="text" value={address} onChange={setAddress} />
              <InputField label="Commune" type="text" value={commune} onChange={setCommune} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Surface" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label="Année construction" value={yearBuilt} onChange={(v) => setYearBuilt(Number(v))} min={1800} max={2030} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Nb pièces" value={nbRooms} onChange={(v) => setNbRooms(Number(v))} min={1} max={20} />
                <InputField label="Nb chambres" value={nbBedrooms} onChange={(v) => setNbBedrooms(Number(v))} min={0} max={15} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Classe énergie"
                  type="select"
                  value={energyClass}
                  onChange={setEnergyClass}
                  options={["A","B","C","D","E","F","G","H","I"].map((v) => ({ value: v, label: v }))}
                />
                <ToggleField label="Parking inclus" checked={parking} onChange={setParking} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy mb-3">Description & points forts</h2>
            <label className="block text-xs font-semibold text-slate mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descriptif commercial du bien"
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            />
            <label className="block text-xs font-semibold text-slate mt-3 mb-1">Points forts (1 par ligne)</label>
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
            <h2 className="text-base font-semibold text-navy mb-3">Prix & estimation</h2>
            <div className="grid gap-3">
              <InputField label="Prix demandé" value={askingPrice} onChange={(v) => setAskingPrice(Number(v))} suffix="€" />
              <InputField label="Estimation centrale tevaxia" value={estimatedValue} onChange={(v) => setEstimatedValue(Number(v))} suffix="€" hint="Valeur centrale du modèle hédonique" />
              <InputField label="Fourchette ± (%)" value={estimationRange} onChange={(v) => setEstimationRange(Number(v))} suffix="%" min={0} max={30} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <ToggleField label="Inclure plan de financement" checked={includeFinancing} onChange={setIncludeFinancing} />
            {includeFinancing && (
              <div className="mt-3 grid gap-3">
                <InputField label="Apport %" value={downPaymentPct} onChange={(v) => setDownPaymentPct(Number(v))} suffix="%" min={0} max={100} />
                <InputField label="Taux annuel" value={loanRate} onChange={(v) => setLoanRate(Number(v))} suffix="%" step={0.1} />
                <InputField label="Durée" value={loanDuration} onChange={(v) => setLoanDuration(Number(v))} suffix="ans" min={5} max={35} />
                {financingData && (
                  <div className="rounded-lg bg-navy/5 p-3 text-xs">
                    <div className="flex justify-between"><span className="text-muted">Apport</span><span className="font-mono">{formatEUR(financingData.downPayment)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Prêt</span><span className="font-mono">{formatEUR(financingData.loanAmount)}</span></div>
                    <div className="flex justify-between font-semibold text-navy"><span>Mensualité</span><span className="font-mono">{formatEUR(financingData.monthlyPayment)}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5">
            <ToggleField label="Inclure estimation frais d'acquisition" checked={includeFees} onChange={setIncludeFees} />
            {includeFees && feesData && (
              <div className="mt-3 rounded-lg bg-navy/5 p-3 text-xs">
                <div className="flex justify-between"><span className="text-muted">Droits enregistrement (7 %)</span><span className="font-mono">{formatEUR(feesData.registrationDuties)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Émoluments notaire</span><span className="font-mono">{formatEUR(feesData.notaryFees)}</span></div>
                <div className="flex justify-between font-semibold text-navy pt-1 mt-1 border-t border-navy/10"><span>Total frais</span><span className="font-mono">{formatEUR(feesData.total)}</span></div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
          >
            {generating ? "Génération PDF…" : "📄 Télécharger la fiche bien PDF"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Utilisation :</strong> envoyez cette fiche à vos prospects acquéreurs par email.
        Elle réunit sur une page A4 les caractéristiques, l&apos;estimation indépendante tevaxia,
        le budget acquisition et le plan de financement. Version PDF portable, pas de dépendance
        site tiers.
      </div>
    </div>
  );
}
