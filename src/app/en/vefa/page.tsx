"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerEmolumentsNotaire, formatEUR, formatPct } from "@/lib/calculations";

// ── Luxembourg VEFA milestones ──────────────────────────────
interface Milestone {
  label: string;
  pct: number;
  monthsAfterStart: number;
}

const MILESTONES: Milestone[] = [
  { label: "Contract signing",            pct: 0.05,  monthsAfterStart: 0 },
  { label: "Foundations complete",         pct: 0.15,  monthsAfterStart: 4 },
  { label: "Walls complete (hors d'eau)", pct: 0.20,  monthsAfterStart: 10 },
  { label: "Roof complete (hors d'air)",  pct: 0.20,  monthsAfterStart: 14 },
  { label: "Interior partitions",         pct: 0.15,  monthsAfterStart: 18 },
  { label: "Finishing works",             pct: 0.15,  monthsAfterStart: 22 },
  { label: "Delivery (keys handover)",    pct: 0.10,  monthsAfterStart: 26 },
];

// ── VAT / duties constants ──────────────────────────────────
const TVA_NORMAL = 0.17;
const TVA_REDUIT = 0.03;
const TVA_FAVEUR_PLAFOND = 50_000;
const TAUX_DROITS = 0.07;

export default function VefaCalculator() {
  // ── Inputs ──────────────────────────────────────────────────
  const [prixTotal, setPrixTotal] = useState(650000);
  const [partTerrain, setPartTerrain] = useState(195000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(520000);
  const [moisDebut, setMoisDebut] = useState("2026-06");

  const partConstruction = Math.max(0, prixTotal - partTerrain);

  // ── Calculations ────────────────────────────────────────────
  const calc = useMemo(() => {
    // -- Registration duties (land only) --
    const droitsBruts = partTerrain * TAUX_DROITS;
    const bellegenAktMax = nbAcquereurs * 40_000;
    const bellegenAkt = residencePrincipale ? Math.min(bellegenAktMax, droitsBruts) : 0;
    const droitsNets = Math.max(0, droitsBruts - bellegenAkt);

    // -- VAT on construction --
    let tvaMontant: number;
    let faveurFiscale = 0;
    let tauxEffectif: number;

    if (residencePrincipale) {
      const tvaNormale = partConstruction * TVA_NORMAL;
      const tvaReduite = partConstruction * TVA_REDUIT;
      faveurFiscale = Math.min(TVA_FAVEUR_PLAFOND, tvaNormale - tvaReduite);
      tvaMontant = tvaNormale - faveurFiscale;
      tauxEffectif = partConstruction > 0 ? tvaMontant / partConstruction : TVA_REDUIT;
    } else {
      tvaMontant = partConstruction * TVA_NORMAL;
      tauxEffectif = TVA_NORMAL;
    }

    // -- Notary fees --
    const emolumentsNotaire = calculerEmolumentsNotaire(prixTotal);

    // -- Mortgage costs --
    const droitsHypotheque = montantHypotheque * 0.005;
    const fraisHypotheque = droitsHypotheque + calculerEmolumentsNotaire(montantHypotheque) * 0.5;

    // -- Totals --
    const totalFrais = droitsNets + tvaMontant + emolumentsNotaire + fraisHypotheque;
    const coutTotal = prixTotal + totalFrais;

    // -- Milestone schedule --
    const [startYear, startMonth] = moisDebut.split("-").map(Number);
    const milestoneRows = MILESTONES.map((m) => {
      const montant = prixTotal * m.pct;
      const totalMonths = (startYear * 12 + (startMonth - 1)) + m.monthsAfterStart;
      const year = Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;
      const dateStr = `${String(month).padStart(2, "0")}/${year}`;
      return { ...m, montant, dateStr };
    });

    let cumul = 0;
    const milestoneWithCumul = milestoneRows.map((row) => {
      cumul += row.montant;
      return { ...row, cumul };
    });

    return {
      partConstruction,
      droitsBruts,
      bellegenAkt,
      droitsNets,
      tvaMontant,
      faveurFiscale,
      tauxEffectif,
      emolumentsNotaire,
      fraisHypotheque,
      totalFrais,
      coutTotal,
      milestones: milestoneWithCumul,
    };
  }, [prixTotal, partTerrain, residencePrincipale, nbAcquereurs, montantHypotheque, moisDebut, partConstruction]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            VEFA Calculator
          </h1>
          <p className="mt-2 text-muted">
            Off-plan purchase (Vente en Etat Futur d'Achevement) — payment schedule, VAT, registration duties, completion guarantee
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left column: Inputs ─────────────────────────── */}
          <div className="space-y-6">
            {/* Property */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">VEFA property</h2>
              <div className="space-y-4">
                <InputField
                  label="Total purchase price (incl. developer margin)"
                  value={prixTotal}
                  onChange={(v) => setPrixTotal(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint="Contractual price excluding acquisition fees"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Land portion"
                    value={partTerrain}
                    onChange={(v) => setPartTerrain(Number(v))}
                    suffix="EUR"
                    min={0}
                    hint="Subject to 7% registration duties"
                  />
                  <InputField
                    label="Construction portion"
                    value={partConstruction}
                    onChange={() => {}}
                    suffix="EUR"
                    hint="= Price - Land (subject to VAT)"
                  />
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Buyer</h2>
              <div className="space-y-4">
                <ToggleField
                  label="Primary residence"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint="Qualifies for 3% reduced VAT and Bellegen Akt tax credit"
                />
                <InputField
                  label="Number of buyers"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 person (EUR 40,000 Bellegen Akt)" },
                    { value: "2", label: "2 persons / couple (EUR 80,000 Bellegen Akt)" },
                  ]}
                />
              </div>
            </div>

            {/* Financing */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financing</h2>
              <InputField
                label="Mortgage amount"
                value={montantHypotheque}
                onChange={(v) => setMontantHypotheque(Number(v))}
                suffix="EUR"
                min={0}
                hint="Used to calculate mortgage registration fees"
              />
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Estimated timeline</h2>
              <InputField
                label="Planned signing month"
                type="text"
                value={moisDebut}
                onChange={setMoisDebut}
                hint="Format YYYY-MM (e.g. 2026-06)"
              />
            </div>
          </div>

          {/* ── Right column: Results ───────────────────────── */}
          <div className="space-y-6">
            {/* Milestone schedule */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                Payment schedule (appels de fonds)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">Milestone</th>
                      <th className="pb-2 pr-2 text-right">%</th>
                      <th className="pb-2 pr-2 text-right">Amount</th>
                      <th className="pb-2 pr-2 text-right">Cumulative</th>
                      <th className="pb-2 text-right">Est. date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/50">
                    {calc.milestones.map((m, i) => (
                      <tr key={i} className={i === calc.milestones.length - 1 ? "font-semibold text-navy" : "text-foreground"}>
                        <td className="py-2 pr-2">{m.label}</td>
                        <td className="py-2 pr-2 text-right font-mono">{(m.pct * 100).toFixed(0)}%</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.montant)}</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.cumul)}</td>
                        <td className="py-2 text-right font-mono text-muted">{m.dateStr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">
                Indicative schedule based on construction progress. Payment calls are issued by the developer upon certification of each milestone by an independent architect.
              </p>
            </div>

            {/* Registration duties */}
            <ResultPanel
              title="Registration duties (land)"
              lines={[
                { label: "Land portion", value: formatEUR(partTerrain), sub: true },
                { label: "Gross duties (7%)", value: formatEUR(calc.droitsBruts) },
                ...(calc.bellegenAkt > 0
                  ? [{ label: `Bellegen Akt (${nbAcquereurs} x EUR 40,000)`, value: `- ${formatEUR(calc.bellegenAkt)}` }]
                  : []),
                { label: "Net duties payable", value: formatEUR(calc.droitsNets), highlight: true },
              ]}
            />

            {/* VAT */}
            <ResultPanel
              title="VAT (construction)"
              lines={[
                { label: "VAT base (construction)", value: formatEUR(calc.partConstruction), sub: true },
                {
                  label: "Rate applied",
                  value: residencePrincipale ? "3% (reduced)" : "17% (standard)",
                },
                { label: "VAT amount", value: formatEUR(calc.tvaMontant) },
                ...(calc.faveurFiscale > 0
                  ? [
                      { label: "Tax benefit (3% VAT)", value: formatEUR(calc.faveurFiscale), sub: true },
                      {
                        label: "Benefit cap",
                        value: `${formatEUR(TVA_FAVEUR_PLAFOND)}`,
                        sub: true,
                        warning: calc.faveurFiscale >= TVA_FAVEUR_PLAFOND,
                      },
                    ]
                  : []),
              ]}
            />

            {/* Other fees */}
            <ResultPanel
              title="Other fees"
              lines={[
                { label: "Notary fees", value: formatEUR(calc.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [{ label: "Mortgage registration fees", value: formatEUR(calc.fraisHypotheque) }]
                  : []),
              ]}
            />

            {/* Grand total */}
            <ResultPanel
              title="Total VEFA acquisition cost"
              className="border-gold/30"
              lines={[
                { label: "Property price", value: formatEUR(prixTotal) },
                { label: "Net registration duties", value: formatEUR(calc.droitsNets), sub: true },
                { label: "VAT", value: formatEUR(calc.tvaMontant), sub: true },
                { label: "Notary + mortgage", value: formatEUR(calc.emolumentsNotaire + calc.fraisHypotheque), sub: true },
                {
                  label: `Total fees (${formatPct(prixTotal > 0 ? calc.totalFrais / prixTotal : 0)})`,
                  value: formatEUR(calc.totalFrais),
                },
                {
                  label: "Total acquisition cost",
                  value: formatEUR(calc.coutTotal),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Progress bar visualization */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">Payment breakdown</h3>
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                {MILESTONES.map((m, i) => {
                  const colors = [
                    "bg-navy",
                    "bg-blue-600",
                    "bg-blue-500",
                    "bg-blue-400",
                    "bg-sky-400",
                    "bg-sky-300",
                    "bg-emerald-400",
                  ];
                  return (
                    <div
                      key={i}
                      className={`${colors[i]} flex items-center justify-center text-xs font-semibold text-white`}
                      style={{ width: `${m.pct * 100}%` }}
                      title={`${m.label}: ${(m.pct * 100).toFixed(0)}%`}
                    >
                      {m.pct >= 0.10 ? `${(m.pct * 100).toFixed(0)}%` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted sm:grid-cols-4">
                {MILESTONES.map((m, i) => {
                  const colors = [
                    "bg-navy",
                    "bg-blue-600",
                    "bg-blue-500",
                    "bg-blue-400",
                    "bg-sky-400",
                    "bg-sky-300",
                    "bg-emerald-400",
                  ];
                  return (
                    <div key={i} className="flex items-center gap-1">
                      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${colors[i]}`} />
                      <span>{(m.pct * 100).toFixed(0)}% {m.label.length > 20 ? m.label.slice(0, 20) + "..." : m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion guarantee */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Completion guarantee (garantie d'achevement)</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Legal requirement</strong> — The developer must provide a
                  completion guarantee (garantie extrinseque) issued by an approved Luxembourg financial
                  institution. This guarantees the property will be completed even if the developer defaults.
                </p>
                <p>
                  <strong className="text-slate">Buyer protection</strong> — In VEFA transactions, buyer
                  payments are legally protected. The notarial deed must reference the guarantee and its
                  conditions. Payment calls cannot exceed the statutory percentages tied to actual construction
                  progress.
                </p>
                <p>
                  <strong className="text-slate">Handover and defects</strong> — At delivery, the buyer can
                  note defects (reserves). The developer must remedy them within a set timeframe. The
                  10-year structural guarantee (garantie decennale) covers major structural defects.
                </p>
              </div>
            </div>

            {/* Good to know */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Good to know</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">3% VAT for primary residence</strong> — The tax benefit is
                  capped at {formatEUR(TVA_FAVEUR_PLAFOND)}. Beyond this threshold, the remaining VAT is
                  charged at 17%. This benefit is granted once per lifetime per buyer and must be applied for
                  with the Registration Duties and VAT Authority (AED).
                </p>
                <p>
                  <strong className="text-slate">Land vs. construction split</strong> — In a VEFA purchase,
                  the land portion is subject to 7% registration duties while the construction portion is
                  subject to VAT. The split is defined in the notarial deed.
                </p>
                <p>
                  <strong className="text-slate">Bellegen Akt</strong> — Tax credit of EUR 40,000 per buyer
                  (EUR 80,000 for a couple) on registration duties. Only available for primary residences and
                  first-time use.
                </p>
                <p>
                  <strong className="text-slate">Construction timeline</strong> — Expect an average of 24 to
                  30 months from signing to delivery. The schedule depends on project size, weather conditions,
                  and contractor availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
