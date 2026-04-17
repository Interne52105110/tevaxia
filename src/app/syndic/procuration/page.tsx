"use client";

import { useState } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import { generateProcurationPdfBlob } from "@/components/ProcurationPdf";

export default function ProcurationPage() {
  const [coownershipName, setCoownershipName] = useState("");
  const [coownershipAddress, setCoownershipAddress] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [unitTantiemes, setUnitTantiemes] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [mandataireName, setMandataireName] = useState("");
  const [mandataireAddress, setMandataireAddress] = useState("");
  const [assemblyDate, setAssemblyDate] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [assemblyType, setAssemblyType] = useState<"ordinaire" | "extraordinaire">("ordinaire");
  const [assemblyLocation, setAssemblyLocation] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!coownershipName || !ownerName || !mandataireName || !assemblyLocation) {
      alert("Merci de remplir les champs obligatoires (*).");
      return;
    }
    setGenerating(true);
    try {
      const blob = await generateProcurationPdfBlob({
        coownershipName,
        coownershipAddress: coownershipAddress || undefined,
        unitLabel: unitLabel || undefined,
        unitTantiemes: unitTantiemes || undefined,
        ownerName,
        ownerAddress: ownerAddress || undefined,
        mandataireName,
        mandataireAddress: mandataireAddress || undefined,
        assemblyDate,
        assemblyType,
        assemblyLocation,
        issuedDate: new Date().toISOString().slice(0, 10),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `procuration-AG-${coownershipName.replace(/[^a-z0-9]/gi, "_")}-${assemblyDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/syndic" className="text-xs text-muted hover:text-navy">← Syndic / Copropriété</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Procuration AG — générateur PDF</h1>
      <p className="mt-1 text-sm text-muted">
        Générez une procuration pour représentation à une AG de copropriété conforme à la loi du
        16 mai 1975 (articles 7 et 11). À remettre signée au mandataire désigné.
      </p>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">Mandant (copropriétaire)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nom, prénom *" type="text" value={ownerName} onChange={setOwnerName} />
            <InputField label="Adresse" type="text" value={ownerAddress} onChange={setOwnerAddress} />
            <InputField label="Numéro de lot" type="text" value={unitLabel} onChange={setUnitLabel} hint="ex. A-12 (3e étage gauche)" />
            <InputField label="Tantièmes / millièmes" value={unitTantiemes} onChange={(v) => setUnitTantiemes(Number(v))} min={0} max={10000} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">Mandataire (représentant)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nom, prénom *" type="text" value={mandataireName} onChange={setMandataireName} hint="La personne qui vous représentera à l'AG" />
            <InputField label="Adresse" type="text" value={mandataireAddress} onChange={setMandataireAddress} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">Copropriété</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nom / référence copropriété *" type="text" value={coownershipName} onChange={setCoownershipName} />
            <InputField label="Adresse" type="text" value={coownershipAddress} onChange={setCoownershipAddress} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-base font-semibold text-navy mb-3">Assemblée générale</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Date AG *" type="text" value={assemblyDate} onChange={setAssemblyDate} hint="YYYY-MM-DD" />
            <InputField
              label="Type"
              type="select"
              value={assemblyType}
              onChange={(v) => setAssemblyType(v as "ordinaire" | "extraordinaire")}
              options={[
                { value: "ordinaire", label: "Ordinaire (annuelle)" },
                { value: "extraordinaire", label: "Extraordinaire" },
              ]}
            />
            <InputField label="Lieu *" type="text" value={assemblyLocation} onChange={setAssemblyLocation} hint="ex. Bureau du syndic, 5 rue X, L-2000 Luxembourg" />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
        >
          {generating ? "Génération…" : "📄 Télécharger la procuration PDF"}
        </button>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>⚠ Avant envoi :</strong> vérifiez avec votre règlement de copropriété le nombre maximum
          de tantièmes qu&apos;un mandataire peut représenter (souvent 5 %). Le syndic lui-même ne peut
          généralement pas être mandataire sauf autorisation expresse. La procuration doit être signée et
          datée avant l&apos;assemblée. La mention manuscrite &quot;bon pour pouvoir&quot; est
          recommandée.
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Cadre légal LU :</strong> loi modifiée du 16 mai 1975 sur la copropriété,
          articles 7 (assemblée générale) et 11 (représentation). Le modèle généré ici est indicatif
          et conforme aux pratiques. Pour des cas particuliers (mandataire syndic, pouvoir in blanco,
          copropriétaire mineur/protégé), consultez votre syndic ou notaire.
        </div>
      </div>
    </div>
  );
}
