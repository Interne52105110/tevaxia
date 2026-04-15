"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import SEOContent from "@/components/SEOContent";
import { formatEUR, formatEUR2 } from "@/lib/calculations";

// Indice des prix à la consommation (IPC) LU — STATEC
// Valeurs annuelles moyennes (base 100 = 2015). Référence : STATEC E1100.
// Maintenues à jour manuellement lors des publications annuelles.
const IPC_LU: Record<number, number> = {
  2000: 80.3,
  2005: 88.7,
  2010: 97.1,
  2015: 100.0,
  2016: 100.0,
  2017: 101.7,
  2018: 103.5,
  2019: 105.2,
  2020: 105.9,
  2021: 108.4,
  2022: 114.7,
  2023: 118.9,
  2024: 122.6,
  2025: 125.8,
  2026: 128.4,
};

function getIpc(year: number): number {
  if (IPC_LU[year]) return IPC_LU[year];
  const years = Object.keys(IPC_LU).map(Number).sort((a, b) => a - b);
  const nearest = years.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );
  return IPC_LU[nearest];
}

export default function BailCommercial() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const currentYear = new Date().getFullYear();
  const [loyerInitial, setLoyerInitial] = useState(36000);
  const [anneeSignature, setAnneeSignature] = useState(currentYear - 6);
  const [anneeIndexation, setAnneeIndexation] = useState(currentYear);
  const [plafondIndexationPct, setPlafondIndexationPct] = useState(20);
  const [duree, setDuree] = useState<9 | 12 | 15 | 18 | 24 | 99>(9);

  const indexation = useMemo(() => {
    const ipcSignature = getIpc(anneeSignature);
    const ipcCible = getIpc(anneeIndexation);
    const coefficient = ipcCible / ipcSignature;
    const loyerIndexeBrut = loyerInitial * coefficient;
    const plafonne = plafondIndexationPct > 0 ? loyerInitial * (1 + plafondIndexationPct / 100) : Infinity;
    const loyerIndexe = Math.min(loyerIndexeBrut, plafonne);
    const evolutionBrutePct = (coefficient - 1) * 100;
    const indexPlafonne = loyerIndexeBrut > plafonne;

    return {
      ipcSignature,
      ipcCible,
      coefficient,
      loyerIndexeBrut,
      loyerIndexe,
      evolutionBrutePct,
      indexPlafonne,
    };
  }, [loyerInitial, anneeSignature, anneeIndexation, plafondIndexationPct]);

  const dureeLabel: Record<typeof duree, string> = {
    9: "9 ans (durée minimale légale LU)",
    12: "12 ans",
    15: "15 ans",
    18: "18 ans",
    24: "24 ans",
    99: "Durée libre (> 24 ans)",
  };

  return (
    <div className="bg-background py-8 sm:py-12 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Bail commercial LU — indexation &amp; durée</h1>
          <p className="mt-2 text-sm text-muted">
            Calcul de l&apos;indexation du loyer selon l&apos;IPC luxembourgeois (STATEC) et rappel des règles
            applicables au bail commercial (loi du 3 février 2018).
          </p>
        </div>

        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 mb-6 text-xs text-amber-900">
          <strong>⚠ Important :</strong> contrairement au bail d&apos;habitation, la règle des 5 % (plafond légal de loyer)
          <strong> ne s&apos;applique pas</strong> au bail commercial. Le loyer est librement convenu à la signature,
          puis encadré par les clauses d&apos;indexation négociées entre les parties.
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Loyer initial &amp; dates</h2>
              <div className="mt-3 space-y-3">
                <InputField
                  label="Loyer annuel initial (hors charges)"
                  value={loyerInitial}
                  onChange={(v) => setLoyerInitial(Number(v) || 0)}
                  suffix="€"
                  min={1000}
                />
                <InputField
                  label="Année de signature du bail"
                  value={anneeSignature}
                  onChange={(v) => setAnneeSignature(Number(v) || currentYear)}
                  min={2000}
                  max={currentYear}
                />
                <InputField
                  label="Année de l'indexation calculée"
                  value={anneeIndexation}
                  onChange={(v) => setAnneeIndexation(Number(v) || currentYear)}
                  min={anneeSignature}
                  max={currentYear + 3}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Clauses du bail</h2>
              <div className="mt-3 space-y-3">
                <InputField
                  label="Durée du bail"
                  type="select"
                  value={String(duree)}
                  onChange={(v) => setDuree(Number(v) as typeof duree)}
                  options={(Object.keys(dureeLabel) as string[]).map((k) => ({
                    value: k,
                    label: dureeLabel[Number(k) as typeof duree],
                  }))}
                />
                <InputField
                  label="Plafond d'indexation total (% vs loyer initial)"
                  value={plafondIndexationPct}
                  onChange={(v) => setPlafondIndexationPct(Number(v) || 0)}
                  suffix="%"
                  hint="Usuel : 15-25 %. Au-delà, le locataire peut demander la révision judiciaire (art. 1757-4 Code civil)."
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                Loyer indexé à {anneeIndexation}
              </div>
              <div className="mt-2 text-3xl font-bold">{formatEUR(indexation.loyerIndexe)} /an</div>
              <div className="mt-1 text-sm text-white/80">
                Soit {formatEUR(indexation.loyerIndexe / 12)} /mois
              </div>
              <div className="mt-4 text-xs text-white/90 space-y-0.5">
                <div>IPC {anneeSignature} : {formatEUR2(indexation.ipcSignature)}</div>
                <div>IPC {anneeIndexation} : {formatEUR2(indexation.ipcCible)}</div>
                <div>Coefficient : × {indexation.coefficient.toFixed(4)}</div>
                <div>Évolution brute : +{indexation.evolutionBrutePct.toFixed(2)} %</div>
              </div>
              {indexation.indexPlafonne && (
                <div className="mt-3 rounded-lg bg-white/15 p-2 text-xs">
                  Indexation plafonnée : l&apos;IPC aurait donné {formatEUR(indexation.loyerIndexeBrut)},
                  mais votre clause limite à +{plafondIndexationPct} % du loyer initial.
                </div>
              )}
            </div>

            <ResultPanel
              title="Rappels réglementaires — bail commercial LU"
              lines={[
                { label: "Durée minimale légale", value: "9 ans (loi du 03.02.2018)", sub: true },
                { label: "Période triennale", value: "Résiliation possible tous les 3 ans (préavis 6 mois)", sub: true },
                { label: "Renouvellement automatique", value: "Sauf congé donné 6 mois avant terme", sub: true },
                { label: "Indice d'indexation LU", value: "IPC STATEC (pas d'ILC/ILAT équivalent LU)", sub: true },
                { label: "Règle des 5 %", value: "Ne s'applique PAS aux baux commerciaux", highlight: true },
                { label: "Forme", value: "Écrit obligatoire si > 9 ans (art. 1715 Code civil)", sub: true },
              ]}
            />

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
              <strong>Clauses fréquentes à vérifier :</strong> pas-de-porte, dépôt de garantie
              (3-12 mois), charges déductibles, destination des lieux, droit au renouvellement,
              indemnité d&apos;éviction en cas de non-renouvellement.
            </div>
          </div>
        </div>
      </div>

      <SEOContent
        ns="bailCommercial"
        sections={[
          { titleKey: "contextTitle", contentKey: "contextContent" },
          { titleKey: "indexationTitle", contentKey: "indexationContent" },
          { titleKey: "dureeTitle", contentKey: "dureeContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/calculateur-loyer", labelKey: "loyer" },
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/dcf-multi", labelKey: "dcfMulti" },
        ]}
      />
    </div>
  );
}
