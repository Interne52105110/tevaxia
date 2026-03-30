"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";

export default function BilanPromoteur() {
  // Revenue
  const [surfaceVendable, setSurfaceVendable] = useState(2000);
  const [prixVenteM2, setPrixVenteM2] = useState(8500);
  const [nbParkings, setNbParkings] = useState(30);
  const [prixParking, setPrixParking] = useState(35000);

  // Construction costs
  const [coutConstructionM2, setCoutConstructionM2] = useState(2800);
  const [surfaceBrute, setSurfaceBrute] = useState(2800); // Gross area > sellable (common areas)
  const [voirie, setVoirie] = useState(200000);
  const [honorairesArchitecte, setHonorairesArchitecte] = useState(8); // % construction costs
  const [honorairesBET, setHonorairesBET] = useState(4);
  const [etudesAutres, setEtudesAutres] = useState(50000);

  // Developer fees
  const [fraisCommerciaux, setFraisCommerciaux] = useState(3); // % revenue
  const [fraisFinanciers, setFraisFinanciers] = useState(3); // % total cost
  const [assurances, setAssurances] = useState(1.5); // % construction costs
  const [fraisGestion, setFraisGestion] = useState(2); // % revenue
  const [aleas, setAleas] = useState(5); // % construction costs

  // Margin
  const [margePromoteur, setMargePromoteur] = useState(15); // % revenue

  const result = useMemo(() => {
    // REVENUE
    const caLogements = surfaceVendable * prixVenteM2;
    const caParkings = nbParkings * prixParking;
    const caTotal = caLogements + caParkings;

    // CONSTRUCTION COSTS
    const coutsConstruction = surfaceBrute * coutConstructionM2;
    const coutsVoirie = voirie;
    const coutsArchitecte = coutsConstruction * (honorairesArchitecte / 100);
    const coutsBET = coutsConstruction * (honorairesBET / 100);
    const coutsEtudes = etudesAutres;
    const coutsAleas = coutsConstruction * (aleas / 100);
    const totalConstruction = coutsConstruction + coutsVoirie + coutsArchitecte + coutsBET + coutsEtudes + coutsAleas;

    // DEVELOPER FEES
    const fCommerciaux = caTotal * (fraisCommerciaux / 100);
    const fFinanciers = (totalConstruction + caTotal * margePromoteur / 100) * (fraisFinanciers / 100); // On committed cost
    const fAssurances = coutsConstruction * (assurances / 100);
    const fGestion = caTotal * (fraisGestion / 100);
    const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;

    // MARGIN
    const margeMontant = caTotal * (margePromoteur / 100);

    // RESIDUAL LAND CHARGE = Revenue - Construction - Fees - Margin
    const chargeFonciere = caTotal - totalConstruction - totalFrais - margeMontant;
    const chargeFonciereM2Terrain = surfaceVendable > 0 ? chargeFonciere / surfaceVendable : 0;

    // Ratios
    const ratioFoncierCA = caTotal > 0 ? chargeFonciere / caTotal : 0;
    const ratioConstructionCA = caTotal > 0 ? totalConstruction / caTotal : 0;
    const ratioFraisCA = caTotal > 0 ? totalFrais / caTotal : 0;
    const margeEffective = caTotal > 0 ? margeMontant / caTotal : 0;

    // Return on equity (estimate)
    const fondsPropreEstimes = chargeFonciere + caTotal * 0.10; // ~10% of revenue as equity
    const rentaFP = fondsPropreEstimes > 0 ? margeMontant / fondsPropreEstimes : 0;

    return {
      caLogements, caParkings, caTotal,
      coutsConstruction, coutsVoirie, coutsArchitecte, coutsBET, coutsEtudes, coutsAleas, totalConstruction,
      fCommerciaux, fFinanciers, fAssurances, fGestion, totalFrais,
      margeMontant,
      chargeFonciere, chargeFonciereM2Terrain,
      ratioFoncierCA, ratioConstructionCA, ratioFraisCA, margeEffective, rentaFP,
    };
  }, [surfaceVendable, prixVenteM2, nbParkings, prixParking, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, fraisCommerciaux, fraisFinanciers, assurances, fraisGestion, aleas, margePromoteur]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Developer Feasibility Study</h1>
          <p className="mt-2 text-muted">
            Residual method — Determine the maximum land charge from the sale price
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Projected revenue</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Sellable area" value={surfaceVendable} onChange={(v) => setSurfaceVendable(Number(v))} suffix="m²" hint="Total sellable living area" />
                <InputField label="Sale price /m²" value={prixVenteM2} onChange={(v) => setPrixVenteM2(Number(v))} suffix="€" hint="Average exit price incl. VAT" />
                <InputField label="Number of parking spaces" value={nbParkings} onChange={(v) => setNbParkings(Number(v))} />
                <InputField label="Price per parking space" value={prixParking} onChange={(v) => setPrixParking(Number(v))} suffix="€" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Construction costs</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Gross area (SHOB)" value={surfaceBrute} onChange={(v) => setSurfaceBrute(Number(v))} suffix="m²" hint="Including common areas, parking" />
                <InputField label="Construction cost /m² gross" value={coutConstructionM2} onChange={(v) => setCoutConstructionM2(Number(v))} suffix="€" hint="Adjustable — LU: 2,500-3,500 €/m²" />
                <InputField label="Roads & utilities" value={voirie} onChange={(v) => setVoirie(Number(v))} suffix="€" />
                <InputField label="Miscellaneous studies" value={etudesAutres} onChange={(v) => setEtudesAutres(Number(v))} suffix="€" hint="Surveyor, soil, environmental..." />
                <InputField label="Architect fees" value={honorairesArchitecte} onChange={(v) => setHonorairesArchitecte(Number(v))} suffix="% constr." hint="Adjustable — typically 7-10%" step={0.5} />
                <InputField label="Engineering fees" value={honorairesBET} onChange={(v) => setHonorairesBET(Number(v))} suffix="% constr." hint="Technical engineering consultancy" step={0.5} />
                <InputField label="Contingencies" value={aleas} onChange={(v) => setAleas(Number(v))} suffix="% constr." hint="Adjustable — 3 to 8%" step={0.5} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Development fees</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Sales & marketing" value={fraisCommerciaux} onChange={(v) => setFraisCommerciaux(Number(v))} suffix="% rev." hint="Sales, advertising" step={0.5} />
                <InputField label="Finance costs" value={fraisFinanciers} onChange={(v) => setFraisFinanciers(Number(v))} suffix="% costs" hint="Interim interest" step={0.5} />
                <InputField label="Insurance" value={assurances} onChange={(v) => setAssurances(Number(v))} suffix="% constr." step={0.5} />
                <InputField label="Management fees" value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix="% rev." hint="Programme management" step={0.5} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Developer margin</h2>
              <InputField label="Margin on revenue" value={margePromoteur} onChange={(v) => setMargePromoteur(Number(v))} suffix="%" hint="Adjustable — typically 10-20% of revenue" step={1} />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Residual land charge */}
            <div className={`rounded-2xl p-8 text-center shadow-lg ${
              result.chargeFonciere > 0
                ? "bg-gradient-to-br from-navy to-navy-light text-white"
                : "bg-gradient-to-br from-error to-red-600 text-white"
            }`}>
              <div className="text-sm text-white/60">Maximum land charge (residual land value)</div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.chargeFonciere)}</div>
              <div className="mt-2 text-sm text-white/60">
                i.e. {formatEUR(result.chargeFonciereM2Terrain)} /m² sellable
              </div>
              {result.chargeFonciere <= 0 && (
                <div className="mt-3 text-sm text-white/80">
                  The project is not viable with these parameters — the land charge is negative
                </div>
              )}
            </div>

            <ResultPanel
              title="Residual calculation"
              lines={[
                { label: "Housing revenue", value: formatEUR(result.caLogements) },
                { label: "Parking revenue", value: formatEUR(result.caParkings), sub: true },
                { label: "Total revenue", value: formatEUR(result.caTotal), highlight: true },
                { label: `Construction (${formatPct(result.ratioConstructionCA)})`, value: `- ${formatEUR(result.totalConstruction)}` },
                { label: `Development fees (${formatPct(result.ratioFraisCA)})`, value: `- ${formatEUR(result.totalFrais)}` },
                { label: `Developer margin (${margePromoteur}%)`, value: `- ${formatEUR(result.margeMontant)}` },
                { label: "= Residual land charge", value: formatEUR(result.chargeFonciere), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Cost breakdown"
              lines={[
                { label: `Gross construction (${surfaceBrute} m² x ${formatEUR(coutConstructionM2)})`, value: formatEUR(result.coutsConstruction) },
                { label: "Roads & utilities", value: formatEUR(result.coutsVoirie), sub: true },
                { label: `Architect (${honorairesArchitecte}%)`, value: formatEUR(result.coutsArchitecte), sub: true },
                { label: `Engineering (${honorairesBET}%)`, value: formatEUR(result.coutsBET), sub: true },
                { label: "Miscellaneous studies", value: formatEUR(result.coutsEtudes), sub: true },
                { label: `Contingencies (${aleas}%)`, value: formatEUR(result.coutsAleas), sub: true },
                { label: "Total construction", value: formatEUR(result.totalConstruction), highlight: true },
                { label: `Sales & marketing (${fraisCommerciaux}% rev.)`, value: formatEUR(result.fCommerciaux), sub: true },
                { label: `Finance costs (${fraisFinanciers}%)`, value: formatEUR(result.fFinanciers), sub: true },
                { label: `Insurance (${assurances}%)`, value: formatEUR(result.fAssurances), sub: true },
                { label: `Management (${fraisGestion}% rev.)`, value: formatEUR(result.fGestion), sub: true },
                { label: "Total fees", value: formatEUR(result.totalFrais), highlight: true },
              ]}
            />

            <ResultPanel
              title="Ratios"
              lines={[
                { label: "Land charge / Revenue", value: formatPct(result.ratioFoncierCA), warning: result.ratioFoncierCA < 0.10 },
                { label: "Construction / Revenue", value: formatPct(result.ratioConstructionCA) },
                { label: "Fees / Revenue", value: formatPct(result.ratioFraisCA) },
                { label: "Margin / Revenue", value: formatPct(result.margeEffective) },
                { label: "Return on equity (est.)", value: formatPct(result.rentaFP), sub: true },
              ]}
            />

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Residual method:</strong> Sale price - Construction costs - Fees - Margin
                = Maximum land charge the developer can pay for the plot.
                In Luxembourg, construction costs are among the highest in Europe (2,500-3,500 €/m²).
                The land charge / revenue ratio typically ranges between 15% and 30% depending on location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
