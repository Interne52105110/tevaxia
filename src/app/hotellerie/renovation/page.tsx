"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";

import { computeRenovationHotel } from "@/lib/hotellerie/renovation";

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n === 0 ? 0 : n);
}

export default function RenovationHotelPage() {
  const locale = useLocale();
  const t = useTranslations("hotellerieToolPages");
  const tc = useTranslations("hotellerieCalc");
  const audit = useTranslations("hotelRenovationAudit");
  const tcr = useTranslations("hotellerieCalc.renovation");
  const tl = useTranslations("hotellerieCalc.renovation.labels");
  const tr = useTranslations("hotellerieCalc.renovation.results");
  const lp = locale === "fr" ? "" : `/${locale}`;

  function formatYears(n: number): string {
    if (!isFinite(n) || n > 999) return "—";
    return tr("unitYears", { n: n.toFixed(1) });
  }

  const [surfaceChauffeeM2, setSurfaceChauffeeM2] = useState(2500);
  const [nbChambres, setNbChambres] = useState(40);
  const [consoActuelleKwhM2, setConsoActuelleKwhM2] = useState(280);
  const [consoCibleKwhM2, setConsoCibleKwhM2] = useState(0);
  const [prixKwhMoyen, setPrixKwhMoyen] = useState(0.20);
  const [travauxIsolation, setIsolation] = useState(true);
  const [travauxCVC, setCVC] = useState(true);
  const [travauxECS, setECS] = useState(false);
  const [travauxLED, setLED] = useState(true);
  const [travauxFenetres, setFenetres] = useState(false);
  const [adr, setAdr] = useState(120);
  const [occupancy, setOccupancy] = useState(0.65);
  const [gainRevparPctViaLabel, setGainLabel] = useState(0);
  const [aidesConfirmees,setAides]=useState(0);
  const [coutSaisi,setCoutSaisi]=useState('');
  const [margeRecettesSupplementaires,setMarge]=useState(.5);
  const [entretienAnnuelSupplementaire,setEntretien]=useState(0);

  const result = useMemo(() => {
    try {
      return computeRenovationHotel({
        surfaceChauffeeM2, nbChambres, consoActuelleKwhM2, consoCibleKwhM2, prixKwhMoyen,
        travauxIsolation, travauxCVC, travauxECS, travauxLED, travauxFenetres,
        adr, occupancy, gainRevparPctViaLabel, aidesConfirmees, coutTravauxSaisi:coutSaisi === "" ? undefined : Number(coutSaisi), margeRecettesSupplementaires, entretienAnnuelSupplementaire,
      });
    } catch { return null; }
  }, [surfaceChauffeeM2, nbChambres, consoActuelleKwhM2, consoCibleKwhM2, prixKwhMoyen, travauxIsolation, travauxCVC, travauxECS, travauxLED, travauxFenetres, adr, occupancy, gainRevparPctViaLabel, aidesConfirmees, coutSaisi, margeRecettesSupplementaires, entretienAnnuelSupplementaire]);

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href={`${lp}/hotellerie`} className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToHub")}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t("renovationTitle")}</h1>
          <p className="mt-2 text-lg text-white/70">{audit("intro")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("building")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label={tl("surfaceChauffee")} value={surfaceChauffeeM2} onChange={(v) => setSurfaceChauffeeM2(Number(v) || 0)} suffix="m²" />
                <InputField label={tl("nbChambres")} value={nbChambres} onChange={(v) => setNbChambres(Number(v) || 0)} />
                <InputField label={tl("consoActuelle")} value={consoActuelleKwhM2} onChange={(v) => setConsoActuelleKwhM2(Number(v) || 0)} suffix="kWh/m²/an" hint={audit("finalEnergy")} />
                <InputField label={tl("consoCible")} value={consoCibleKwhM2} onChange={(v) => setConsoCibleKwhM2(Number(v) || 0)} suffix="kWh/m²/an" hint={audit("autoConso")} />
                <InputField label={tl("prixKwh")} value={prixKwhMoyen.toFixed(3)} onChange={(v) => setPrixKwhMoyen(Number(v) || 0)} suffix="€" className="sm:col-span-2" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("worksPlanned")}</h2>
              <div className="mt-4 space-y-2">
                {[
                  { v: travauxIsolation, set: setIsolation, label: tl("isolation") },
                  { v: travauxCVC, set: setCVC, label: tl("cvc") },
                  { v: travauxECS, set: setECS, label: tl("ecs") },
                  { v: travauxLED, set: setLED, label: tl("led") },
                  { v: travauxFenetres, set: setFenetres, label: tl("fenetres") },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-3 cursor-pointer rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm">
                    <input type="checkbox" checked={item.v} onChange={(e) => item.set(e.target.checked)} className="h-4 w-4 rounded border-input-border" />
                    <span className="text-navy">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcr("hotelPerf")}</h2>
              <div className="mt-4 space-y-4">
                <InputField label={audit("quote")} value={coutSaisi} onChange={setCoutSaisi} min={0} suffix="€" hint={audit("quoteHint")} />
                <InputField label={audit("aid")} value={aidesConfirmees} onChange={v=>setAides(Number(v))} min={0} suffix="€" />
                <InputField label={audit("maintenance")} value={entretienAnnuelSupplementaire} onChange={v=>setEntretien(Number(v))} min={0} suffix="€" />
                <InputField label={audit("margin")} value={margeRecettesSupplementaires*100} onChange={v=>setMarge(Number(v)/100)} min={0} max={100} suffix="%" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label={tl("adr")} value={adr} onChange={(v) => setAdr(Number(v) || 0)} suffix="€" />
                <InputField label={tl("occupation")} value={Math.round(occupancy * 100)} onChange={(v) => setOccupancy(Math.max(0, Math.min(100, Number(v) || 0)) / 100)} suffix="%" />
                <InputField label={tl("gainRevpar")} value={gainRevparPctViaLabel} onChange={(v) => setGainLabel(Math.max(0, Math.min(15, Number(v) || 0)))} suffix="%" hint={audit("labelHint")} className="sm:col-span-2" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6">
                  <div className="text-sm uppercase tracking-wider text-green-700 font-semibold">{tcr("investmentNet")}</div>
                  <div className="mt-2 text-3xl font-bold text-navy">{formatEUR(result.coutNetTotal)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">{tr("brutBadge", { amount: formatEUR(result.coutBrutTotal) })}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">{audit("aid")}: {formatEUR(result.aideKlimabonusTotal)}</span>
                  </div>
                </div>

                <ResultPanel
                  title={tcr("annualBenefits")}
                  lines={[
                    { label: tr("economiesEnergie"), value: formatEUR(result.economiesAnnuelles), highlight: true },
                    { label: audit("netContribution"), value: formatEUR(result.gainRevparAnnuel), highlight: true },
                    { label: audit("maintenance"), value: formatEUR(result.lines.some(l=>l.retenu) ? -entretienAnnuelSupplementaire : 0) },
                    { label: tr("totalAnnuel"), value: formatEUR(result.economiesAnnuelles + result.gainRevparAnnuel - (result.lines.some(l=>l.retenu) ? entretienAnnuelSupplementaire : 0)), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title={tcr("paybackVAN")}
                  lines={[
                    { label: tr("paybackSansLabel"), value: formatYears(result.paybackSansLabel) },
                    { label: tr("paybackAvecLabel"), value: formatYears(result.paybackAvecLabel), highlight: true },
                    { label: tr("vanDixAns"), value: formatEUR(result.vanDixAns), highlight: true, warning: result.vanDixAns < 0 },
                  ]}
                />

                <ResultPanel
                  title={tcr("energyImpact")}
                  lines={[
                    { label: tr("consoAvant"), value: tr("unitMwhAn", { n: (result.consoAvantKwh / 1000).toFixed(0) }) },
                    { label: tr("consoApres"), value: tr("unitMwhAn", { n: (result.consoApresKwh / 1000).toFixed(0) }) },
                    { label: tr("reduction"), value: `${tr("unitMwhAn", { n: (result.reductionKwh / 1000).toFixed(0) })} (${result.consoAvantKwh > 0 ? ((result.reductionKwh / result.consoAvantKwh) * 100).toFixed(0) : 0} %)`, highlight: true },
                  ]}
                />

                <div className="rounded-xl border border-card-border bg-card p-6">
                  <h3 className="mb-4 text-base font-semibold text-navy">{tcr("perPostDetail")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border text-muted">
                          <th className="px-2 py-2 text-left font-medium">{tr("thPoste")}</th>
                          <th className="px-2 py-2 text-right font-medium">{tr("thBrut")}</th>
                          <th className="px-2 py-2 text-right font-medium">{tr("thAide")}</th>
                          <th className="px-2 py-2 text-right font-medium">{tr("thNet")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {result.lines.map((line, index) => (
                          <tr key={line.poste} className={!line.retenu ? "opacity-40" : ""}>
                            <td className="px-2 py-2 text-navy">{tl(["isolation","cvc","ecs","led","fenetres"][index])}</td>
                            <td className="px-2 py-2 text-right">{formatEUR(line.coutBrut)}</td>
                            <td className="px-2 py-2 text-right text-emerald-700">{formatEUR(line.aide)}</td>
                            <td className="px-2 py-2 text-right font-semibold text-navy">{formatEUR(line.coutNet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{tc("checkInputs")}</div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {audit("method")}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-10 space-y-3"><h2 className="text-lg font-semibold text-navy">{audit("aidTitle")}</h2><p className="text-sm text-muted">{audit("aidScope")}</p><a className="block text-navy underline" href="https://guichet.public.lu/fr/entreprises/financement-aides/aides-environnement/industrie-services/aide-protec-environnement.html">{audit("official")}</a><Link className="block text-navy underline" href={`${lp}/energy/renovation`}>{audit("detailed")}</Link></section>
    </div>
  );
}
