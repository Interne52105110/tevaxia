"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";

export default function AchatVsLocation() {
  // Purchase
  const [prixBien, setPrixBien] = useState(750000);
  const [apport, setApport] = useState(150000);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [dureeCredit, setDureeCredit] = useState(25);
  const [fraisAcquisitionPct, setFraisAcquisitionPct] = useState(7);
  const [chargesCoproMensuel, setChargesCoproMensuel] = useState(250);
  const [taxeFonciereAn, setTaxeFonciereAn] = useState(200);
  const [entretienAnPct, setEntretienAnPct] = useState(1);
  const [appreciationAn, setAppreciationAn] = useState(2);

  // Rental
  const [loyerMensuel, setLoyerMensuel] = useState(2000);
  const [indexationLoyer, setIndexationLoyer] = useState(2);

  // Alternative investment (if renting, the down payment is invested)
  const [rendementPlacement, setRendementPlacement] = useState(4);

  // Horizon
  const [horizon, setHorizon] = useState(15);

  const result = useMemo(() => {
    const montantCredit = prixBien - apport;
    const fraisAcquisition = prixBien * (fraisAcquisitionPct / 100);
    const tauxMensuel = tauxCredit / 100 / 12;
    const nbMois = dureeCredit * 12;

    // Monthly mortgage payment
    const mensualiteCredit = tauxMensuel > 0
      ? montantCredit * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1)
      : montantCredit / nbMois;

    // Year-by-year tables
    const annees: {
      annee: number;
      // Purchase
      coutAchatCumule: number;
      capitalRembourse: number;
      capitalRestant: number;
      valeurBien: number;
      patrimoineNetAchat: number;
      // Rental
      coutLocationCumule: number;
      placementCapital: number;
      patrimoineNetLocation: number;
    }[] = [];

    let coutAchatCumule = apport + fraisAcquisition;
    let capitalRestant = montantCredit;
    let coutLocationCumule = 0;
    let placementCapital = apport + fraisAcquisition; // If renting, keep the down payment + fees
    let loyerAnnuel = loyerMensuel * 12;

    for (let a = 1; a <= horizon; a++) {
      // PURCHASE
      const valeurBien = prixBien * Math.pow(1 + appreciationAn / 100, a);
      const interetsAnnuels = capitalRestant * (tauxCredit / 100);
      const capitalAnnuel = Math.min(mensualiteCredit * 12 - interetsAnnuels, capitalRestant);
      capitalRestant = Math.max(0, capitalRestant - capitalAnnuel);

      const coutAchatAnnuel = mensualiteCredit * 12 + chargesCoproMensuel * 12 + taxeFonciereAn + prixBien * (entretienAnPct / 100);
      coutAchatCumule += coutAchatAnnuel;

      const patrimoineNetAchat = valeurBien - capitalRestant;

      // RENTAL
      coutLocationCumule += loyerAnnuel;
      const economieMensuelle = (mensualiteCredit + chargesCoproMensuel + taxeFonciereAn / 12 + prixBien * (entretienAnPct / 100) / 12) - loyerMensuel * Math.pow(1 + indexationLoyer / 100, a - 1);
      if (economieMensuelle > 0) {
        placementCapital += economieMensuelle * 12;
      }
      placementCapital *= (1 + rendementPlacement / 100);
      loyerAnnuel *= (1 + indexationLoyer / 100);

      annees.push({
        annee: a,
        coutAchatCumule,
        capitalRembourse: montantCredit - capitalRestant,
        capitalRestant,
        valeurBien,
        patrimoineNetAchat,
        coutLocationCumule,
        placementCapital,
        patrimoineNetLocation: placementCapital,
      });
    }

    // Crossover point: when buying becomes more advantageous
    const croisement = annees.find((a) => a.patrimoineNetAchat > a.patrimoineNetLocation);

    return {
      mensualiteCredit,
      fraisAcquisition,
      montantCredit,
      annees,
      croisement,
      derniere: annees[annees.length - 1],
    };
  }, [prixBien, apport, tauxCredit, dureeCredit, fraisAcquisitionPct, chargesCoproMensuel, taxeFonciereAn, entretienAnPct, appreciationAn, loyerMensuel, indexationLoyer, rendementPlacement, horizon]);

  const coutMensuelTotal = result.mensualiteCredit + chargesCoproMensuel + taxeFonciereAn / 12 + prixBien * (entretienAnPct / 100) / 12;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Buy or Rent?</h1>
          <p className="mt-2 text-muted">Compare the total cost and the wealth accumulated over time</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Purchase</h2>
              <div className="space-y-4">
                <InputField label="Property price" value={prixBien} onChange={(v) => setPrixBien(Number(v))} suffix="€" />
                <InputField label="Down payment" value={apport} onChange={(v) => setApport(Number(v))} suffix="€" />
                <InputField label="Mortgage rate" value={tauxCredit} onChange={(v) => setTauxCredit(Number(v))} suffix="%" step={0.1} />
                <InputField label="Mortgage term" value={dureeCredit} onChange={(v) => setDureeCredit(Number(v))} suffix="years" />
                <InputField label="Acquisition fees" value={fraisAcquisitionPct} onChange={(v) => setFraisAcquisitionPct(Number(v))} suffix="%" hint="Registration 7% - Bellegen Akt. Use the simulator for details." />
                <InputField label="Condominium charges" value={chargesCoproMensuel} onChange={(v) => setChargesCoproMensuel(Number(v))} suffix="€/month" />
                <InputField label="Property tax" value={taxeFonciereAn} onChange={(v) => setTaxeFonciereAn(Number(v))} suffix="€/year" hint="Very low in Luxembourg" />
                <InputField label="Annual maintenance" value={entretienAnPct} onChange={(v) => setEntretienAnPct(Number(v))} suffix="% price" hint="Adjustable — typically 0.5-1.5%" step={0.1} />
                <InputField label="Annual property appreciation" value={appreciationAn} onChange={(v) => setAppreciationAn(Number(v))} suffix="%" step={0.1} hint="Adjustable — historical LU ~3-5%/year, recent ~2%" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Rental</h2>
              <div className="space-y-4">
                <InputField label="Monthly rent" value={loyerMensuel} onChange={(v) => setLoyerMensuel(Number(v))} suffix="€" />
                <InputField label="Annual rent indexation" value={indexationLoyer} onChange={(v) => setIndexationLoyer(Number(v))} suffix="%" step={0.1} hint="Max increase 10% / 2 years (2024 reform)" />
                <InputField label="Alternative investment return" value={rendementPlacement} onChange={(v) => setRendementPlacement(Number(v))} suffix="%" step={0.1} hint="Adjustable — if renting, the down payment is invested elsewhere" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Horizon</h2>
              <InputField label="Comparison period" value={horizon} onChange={(v) => setHorizon(Number(v))} suffix="years" min={1} max={35} />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict */}
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${
              result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                ? "bg-gradient-to-br from-navy to-navy-light"
                : "bg-gradient-to-br from-teal to-teal-light"
            }`}>
              <div className="text-sm text-white/60">
                {result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                  ? `Buying is more advantageous over ${horizon} years`
                  : `Renting is more advantageous over ${horizon} years`}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-white/50">Net wealth if buying</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetAchat)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Capital if renting + investing</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetLocation)}</div>
                </div>
              </div>
              {result.croisement && (
                <div className="mt-4 text-sm text-white/70">
                  Buying becomes more advantageous from year {result.croisement.annee}
                </div>
              )}
            </div>

            {/* Compared monthly costs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultPanel
                title="Monthly cost — Purchase"
                lines={[
                  { label: "Mortgage payment", value: formatEUR2(result.mensualiteCredit) },
                  { label: "Condominium charges", value: formatEUR2(chargesCoproMensuel), sub: true },
                  { label: "Property tax", value: formatEUR2(taxeFonciereAn / 12), sub: true },
                  { label: "Maintenance", value: formatEUR2(prixBien * entretienAnPct / 100 / 12), sub: true },
                  { label: "Total monthly purchase cost", value: formatEUR2(coutMensuelTotal), highlight: true },
                ]}
              />
              <ResultPanel
                title="Monthly cost — Rental"
                lines={[
                  { label: "Rent (year 1)", value: formatEUR2(loyerMensuel) },
                  { label: `Rent (year ${horizon})`, value: formatEUR2(loyerMensuel * Math.pow(1 + indexationLoyer / 100, horizon - 1)), sub: true },
                  { label: "Monthly difference (yr 1)", value: formatEUR2(coutMensuelTotal - loyerMensuel), highlight: true },
                ]}
              />
            </div>

            {/* Year-by-year table */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Year</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Property value</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Outstanding balance</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Purchase wealth</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Investment capital</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.annees.filter((a) => a.annee % (horizon > 15 ? 3 : horizon > 10 ? 2 : 1) === 0 || a.annee === 1 || a.annee === horizon).map((a) => {
                    const diff = a.patrimoineNetAchat - a.patrimoineNetLocation;
                    return (
                      <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                        <td className="px-3 py-1.5 font-medium">{a.annee}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.valeurBien)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(a.capitalRestant)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(a.patrimoineNetAchat)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.patrimoineNetLocation)}</td>
                        <td className={`px-3 py-1.5 text-right font-mono font-semibold ${diff > 0 ? "text-navy" : "text-teal"}`}>
                          {diff > 0 ? "Buy" : "Rent"} {formatEUR(Math.abs(diff))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Adjustable assumptions:</strong> The result depends heavily on property appreciation
                ({appreciationAn}%/year) and alternative investment return ({rendementPlacement}%/year).
                Modify these parameters to test different scenarios. Acquisition fees in Luxembourg (Bellegen Akt)
                make buying more attractive than in France thanks to the tax credit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
