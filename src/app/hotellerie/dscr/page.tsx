"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import ShareLinkButton from "@/components/ShareLinkButton";
import SEOContent from "@/components/SEOContent";
import { computeHotelDscr } from "@/lib/hotellerie/dscr";

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const DIAG_COLOR: Record<string, string> = {
  critique: "from-rose-500 to-rose-700",
  limite: "from-amber-500 to-amber-700",
  sain: "from-emerald-500 to-emerald-700",
  fort: "from-emerald-600 to-emerald-800",
};

export default function DscrHotelPage() {
  const locale = useLocale();
  const t = useTranslations("hotellerieToolPages");
  const tc = useTranslations("hotellerieCalc");
  const tcd = useTranslations("hotellerieCalc.dscr");
  const tl = useTranslations("hotellerieCalc.dscr.labels");
  const tr = useTranslations("hotellerieCalc.dscr.results");
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [ebitdaStabilise, setEbitdaStabilise] = useState(450000);
  const [prixAcquisition, setPrixAcquisition] = useState(4500000);
  const [travaux, setTravaux] = useState(300000);
  const [apport, setApport] = useState(1500000);
  const [tauxInteret, setTauxInteret] = useState(0.045);
  const [dureeAns, setDureeAns] = useState(20);
  const [dscrCible, setDscrCible] = useState(1.30);

  const result = useMemo(() => {
    try {
      return computeHotelDscr({
        ebitdaStabilise,
        prixAcquisition,
        travaux,
        apport,
        tauxInteretAnnuel: tauxInteret,
        dureeAns,
        dscrCible,
      });
    } catch {
      return null;
    }
  }, [ebitdaStabilise, prixAcquisition, travaux, apport, tauxInteret, dureeAns, dscrCible]);

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`${lp}/hotellerie`}
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToHub")}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t("dscrTitle")}</h1>
          <p className="mt-2 text-lg text-white/70">{t("dscrSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcd("financialData")}</h2>
              <div className="mt-4 grid gap-4">
                <InputField
                  label={tr("labelEbitda")}
                  value={ebitdaStabilise}
                  onChange={(v) => setEbitdaStabilise(Number(v) || 0)}
                  suffix="€"
                  hint={tr("hintEbitda")}
                  min={0}
                />
                <InputField
                  label={tr("labelPrixAcquisition")}
                  value={prixAcquisition}
                  onChange={(v) => setPrixAcquisition(Number(v) || 0)}
                  suffix="€"
                  min={0}
                />
                <InputField
                  label={tr("labelTravaux")}
                  value={travaux}
                  onChange={(v) => setTravaux(Number(v) || 0)}
                  suffix="€"
                  hint={tr("hintTravaux")}
                  min={0}
                />
                <InputField
                  label={tr("labelApport")}
                  value={apport}
                  onChange={(v) => setApport(Number(v) || 0)}
                  suffix="€"
                  min={0}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcd("loanConditions")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label={tr("labelTauxInteret")}
                  value={(tauxInteret * 100).toFixed(2)}
                  onChange={(v) => setTauxInteret(Math.max(0, Math.min(20, Number(v) || 0)) / 100)}
                  suffix="%"
                  hint={tr("hintTaux")}
                />
                <InputField
                  label={tl("dureePret")}
                  value={dureeAns}
                  onChange={(v) => setDureeAns(Math.max(1, Math.min(40, Number(v) || 0)))}
                  suffix={tr("suffixAns")}
                />
                <InputField
                  label={tr("labelDscrCible")}
                  value={dscrCible.toFixed(2)}
                  onChange={(v) => setDscrCible(Math.max(1, Math.min(3, Number(v) || 0)))}
                  hint={tr("hintDscrCible")}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                <div className={`rounded-xl bg-gradient-to-br ${DIAG_COLOR[result.diagnostic]} p-6 text-white shadow-lg`}>
                  <div className="text-sm uppercase tracking-wider text-white/80 font-semibold">
                    {tcd("centralBox")}
                  </div>
                  <div className="mt-2 text-4xl font-bold">{result.dscrCentral.toFixed(2)}</div>
                  <div className="mt-1 text-sm text-white/90">{result.diagnosticLabel}</div>
                </div>

                <ResultPanel
                  title={tcd("stressTest")}
                  lines={[
                    { label: tr("central"), value: `DSCR ${result.dscrCentral.toFixed(2)}`, highlight: true },
                    { label: tr("stressOcc"), value: `DSCR ${result.dscrStressOccupation.toFixed(2)}`, warning: result.dscrStressOccupation < 1 },
                    { label: tr("stressAdr"), value: `DSCR ${result.dscrStressADR.toFixed(2)}`, warning: result.dscrStressADR < 1 },
                    { label: tr("stressDouble"), value: `DSCR ${result.dscrStressDouble.toFixed(2)}`, warning: result.dscrStressDouble < 1 },
                  ]}
                />

                <ResultPanel
                  title={tcd("financingStructure")}
                  lines={[
                    { label: tr("totalProjet"), value: formatEUR(prixAcquisition + travaux) },
                    { label: tr("apportPersonnel"), value: formatEUR(apport), sub: true },
                    { label: tr("montantEmprunter"), value: formatEUR(result.montantDette), highlight: true },
                    { label: tr("ltv"), value: `${(result.ltv * 100).toFixed(1)} %`, warning: result.ltv > 0.75 },
                    { label: tr("mensualite"), value: formatEUR(result.mensualite) },
                    { label: tr("serviceDette"), value: formatEUR(result.serviceDetteAnnuel), sub: true },
                  ]}
                />

                <ResultPanel
                  title={tcd("borrowingCapacity")}
                  lines={[
                    { label: tr("maxEmpruntDscr", { dscr: dscrCible.toFixed(2) }), value: formatEUR(result.maxEmpruntable), highlight: true, large: true },
                    {
                      label: tr("vsEmpruntActuel"),
                      value: result.maxEmpruntable >= result.montantDette ? tcd("okMargin") : `${tcd("overborrow")} ${formatEUR(result.montantDette - result.maxEmpruntable)}`,
                      warning: result.maxEmpruntable < result.montantDette,
                    },
                  ]}
                />

                <ResultPanel
                  title={tcd("creditCost")}
                  lines={[
                    { label: tr("capitalEmprunte"), value: formatEUR(result.montantDette) },
                    { label: tr("totalInterets"), value: formatEUR(result.totalInterets), sub: true },
                    { label: tr("coutTotalCredit"), value: formatEUR(result.coutTotalCredit), highlight: true },
                  ]}
                />

                <ShareLinkButton
                  toolType="hotel-dscr"
                  defaultTitle={tr("shareTitle", { amount: formatEUR(prixAcquisition + travaux) })}
                  payload={{
                    inputs: { ebitdaStabilise, prixAcquisition, travaux, apport, tauxInteret, dureeAns, dscrCible },
                    results: result,
                  }}
                />

                {result.amortissement.length > 0 && (
                  <div className="rounded-xl border border-card-border bg-card p-6">
                    <h3 className="mb-4 text-base font-semibold text-navy">{tcd("annualAmortization")}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-card-border text-muted">
                            <th className="px-2 py-2 text-left font-medium">{tr("thAnnee")}</th>
                            <th className="px-2 py-2 text-right font-medium">{tr("thCapitalRembourse")}</th>
                            <th className="px-2 py-2 text-right font-medium">{tr("thInterets")}</th>
                            <th className="px-2 py-2 text-right font-medium">{tr("thCapitalRestant")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border/50">
                          {result.amortissement.map((line) => (
                            <tr key={line.annee}>
                              <td className="px-2 py-2 text-navy font-medium">{line.annee}</td>
                              <td className="px-2 py-2 text-right text-navy">{formatEUR(line.capitalRembourse)}</td>
                              <td className="px-2 py-2 text-right text-muted">{formatEUR(line.interets)}</td>
                              <td className="px-2 py-2 text-right text-navy">{formatEUR(line.capitalRestant)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                {tc("checkInputs")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
          {tcd("methodNote")}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-card-border bg-card p-5">
          <div>
            <div className="text-sm font-semibold text-navy">{tcd("ctaTitle")}</div>
            <p className="mt-1 text-xs text-muted">{tcd("ctaDesc")}</p>
          </div>
          <Link
            href={`${lp}/hotellerie/score-e2`}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
          >
            {tcd("ctaCta")}
          </Link>
        </div>
      </div>

      <SEOContent
        ns="hotellerieDscr"
        sections={[
          { titleKey: "definitionTitle", contentKey: "definitionContent" },
          { titleKey: "stressTitle", contentKey: "stressContent" },
          { titleKey: "ltvTitle", contentKey: "ltvContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
        ]}
        relatedLinks={[
          { href: "/hotellerie/valorisation", labelKey: "hotelValorisation" },
          { href: "/outils-bancaires", labelKey: "bancaire" },
        ]}
      />
    </div>
  );
}
