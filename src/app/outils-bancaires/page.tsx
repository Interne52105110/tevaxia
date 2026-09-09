"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { OAT_10Y, TAUX_HYPOTHECAIRE, TAUX_DIRECTEUR_BCE, INFLATION } from "@/lib/macro-data";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import RelatedTools from "@/components/RelatedTools";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import {
  calculerLTV,
  calculerMensualite,
  calculerCapaciteEmprunt,
  genererTableauAmortissement,
  calculerDSCR,
  simulerRemboursementAnticipe,
  formatEUR,
  formatEUR2,
  formatPct,
} from "@/lib/calculations";
import { PdfButton } from "@/components/PdfButton";
const _lazy_generateBancairePdfBlob = async (...args: Parameters<typeof import("@/components/ToolsPdf")["generateBancairePdfBlob"]>): Promise<Blob> => (await import("@/components/ToolsPdf")).generateBancairePdfBlob(...args);
import LoanOffers, {LoanRateSources} from "@/components/LoanOffers";
import MortgageConditions from "@/components/MortgageConditions";

type ActiveTab = "ltv" | "capacite" | "amortissement" | "dscr" | "cpe" | "remboursement" | "comparateur";

function TabLTV() {
  const t = useTranslations("outilsBancaires");
  const [valeurBien, setValeurBien] = useState(750000);
  const [montantPret, setMontantPret] = useState(600000);

  const ltv = calculerLTV({ valeurBien, montantPret });
  const ltvColor = ltv > 0.9 ? "text-error" : ltv > 0.8 ? "text-warning" : "text-success";
  const ltvLabel =
    ltv > 0.9 ? t("ltvHigh") : ltv > 0.8 ? t("ltvAcceptable") : t("ltvHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("ltvParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("propertyValue")} value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
            <InputField label={t("loanAmount")} value={montantPret} onChange={(v) => setMontantPret(Number(v))} suffix="€" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("ltvRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${ltvColor}`}>
            {(ltv * 100).toFixed(1)} %
          </div>
          <div className={`mt-2 text-sm font-medium ${ltvColor}`}>{ltvLabel}</div>
          <div className="mt-4 text-xs text-muted">{t("deposit")} : {formatEUR(valeurBien - montantPret)} ({formatPct(1 - ltv)})</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("ltvThresholdsTitle")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
              <span className="shrink-0 rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-white">≤ 80%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStandard")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStandardDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <span className="shrink-0 rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-white">≤ 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvFirstBuyer")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvFirstBuyerDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
              <span className="shrink-0 rounded-full bg-error px-2.5 py-0.5 text-xs font-bold text-white">&gt; 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStateGuarantee")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStateGuaranteeDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("prudentValueTitle")}</h3>
          <p className="text-xs text-muted leading-relaxed mb-3">
            {t.rich("prudentValueIntro", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}
          </p>
          <div className="space-y-2 text-xs text-muted">
            <p>{t.rich("prudentValueMethod", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueLegal", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueCalculate", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
              link: (chunks) => <a href="/valorisation" className="text-navy font-medium hover:underline">{chunks}</a>,
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCapacite() {
  const t = useTranslations("outilsBancaires");
  const [revenuNet, setRevenuNet] = useState(5000);
  const [charges, setCharges] = useState(500);
  const [tauxEndettement, setTauxEndettement] = useState(40);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [duree, setDuree] = useState(25);
  const [tauxAssurance, setTauxAssurance] = useState(0.30); // % du capital

  const result = useMemo(
    () =>
      calculerCapaciteEmprunt({
        revenuNetMensuel: revenuNet,
        chargesMensuelles: charges,
        tauxEndettementMax: tauxEndettement / 100,
        tauxInteret: tauxInteret / 100,
        dureeAnnees: duree,
      }),
    [revenuNet, charges, tauxEndettement, tauxInteret, duree]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">{t("incomeAndCharges")}</h2>
        <div className="space-y-4">
          <InputField label={t("netMonthlyIncome")} value={revenuNet} onChange={(v) => setRevenuNet(Number(v))} suffix="€" />
          <InputField label={t("existingMonthlyCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("existingMonthlyChargesHint")} />
          <InputField label={t("maxDebtRatio")} value={tauxEndettement} onChange={(v) => setTauxEndettement(Number(v))} suffix="%" min={10} max={50} />
          <InputField label={t("interestRate")} value={tauxInteret} onChange={(v) => setTauxInteret(Number(v))} suffix="%" step={0.1} />
          <InputField label={t("loanDuration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          <InputField label={t("remainingBalanceInsurance")} value={tauxAssurance} onChange={(v) => setTauxAssurance(Number(v))} suffix={t("pctCapital")} step={0.05} hint={t("remainingBalanceInsuranceHint")} />
        </div>
        <LoanRateSources />
      </div>
      <div className="space-y-6">
        <ResultPanel
          title={t("results")}
          lines={[
            { label: t("maxMonthlyPayment"), value: formatEUR2(result.mensualiteMax) },
            { label: t("ofWhichInsurance", { pct: tauxAssurance }), value: formatEUR2(result.capaciteEmprunt * tauxAssurance / 100 / 12), sub: true },
            { label: t("borrowingCapacity"), value: formatEUR(result.capaciteEmprunt), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("withDeposit")}
          lines={[
            { label: t("plusDeposit", { amount: "50 000" }), value: formatEUR(result.capaciteEmprunt + 50000), sub: true },
            { label: t("plusDeposit", { amount: "100 000" }), value: formatEUR(result.capaciteEmprunt + 100000), sub: true },
            { label: t("plusDeposit", { amount: "150 000" }), value: formatEUR(result.capaciteEmprunt + 150000), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabAmortissement() {
  const t = useTranslations("outilsBancaires");
  const [capital, setCapital] = useState(600000);
  const [taux, setTaux] = useState(3.5);
  const [duree, setDuree] = useState(25);

  const mensualite = useMemo(() => calculerMensualite(capital, taux / 100, duree), [capital, taux, duree]);
  const tableau = useMemo(() => genererTableauAmortissement(capital, taux / 100, duree), [capital, taux, duree]);
  const totalInterets = useMemo(() => tableau.reduce((sum, l) => sum + l.interets, 0), [tableau]);

  // Show yearly summary
  const annuel = useMemo(() => {
    const years: { annee: number; capital: number; interets: number; restant: number }[] = [];
    for (let i = 0; i < tableau.length; i += 12) {
      const slice = tableau.slice(i, i + 12);
      years.push({
        annee: Math.floor(i / 12) + 1,
        capital: slice.reduce((s, l) => s + l.capital, 0),
        interets: slice.reduce((s, l) => s + l.interets, 0),
        restant: slice[slice.length - 1]?.capitalRestant || 0,
      });
    }
    return years;
  }, [tableau]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("loanParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("borrowedCapital")} value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label={t("annualInterestRate")} value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label={t("duration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          </div>
          <LoanRateSources />
        </div>
        <ResultPanel
          title={t("summary")}
          lines={[
            { label: t("monthlyPayment"), value: formatEUR2(mensualite), highlight: true, large: true },
            { label: t("totalInterest"), value: formatEUR(totalInterets) },
            { label: t("totalCreditCost"), value: formatEUR(capital + totalInterets) },
            { label: t("interestCapitalRatio"), value: formatPct(totalInterets / capital), sub: true },
          ]}
        />
        <div className="flex justify-end">
          <PdfButton
            label="PDF"
            filename={`simulation-bancaire-${new Date().toLocaleDateString("fr-FR")}.pdf`}
            generateBlob={() => {
              const prixBien = Math.round(capital / 0.8);
              const apport = prixBien - capital;
              return _lazy_generateBancairePdfBlob({
                prixBien,
                apport,
                montantCredit: capital,
                dureeAns: duree,
                tauxNominal: taux,
                mensualite,
                coutTotal: capital + totalInterets,
                coutInterets: totalInterets,
                ltv: 80,
                tauxEndettement: 0,
              });
            }}
          />
        </div>
      </div>

      {/* Tableau annuel */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">{t("year")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("capitalRepaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("interestPaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("remainingCapital")}</th>
            </tr>
          </thead>
          <tbody>
            {annuel.map((a) => (
              <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-4 py-2 font-medium">{a.annee}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.capital)}</td>
                <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(a.interets)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.restant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabDSCR() {
  const t = useTranslations("outilsBancaires");
  const [revenuLocatif, setRevenuLocatif] = useState(36000);
  const [charges, setCharges] = useState(6000);
  const [serviceDette, setServiceDette] = useState(24000);

  const dscr = calculerDSCR({
    revenuLocatifAnnuel: revenuLocatif,
    chargesAnnuelles: charges,
    serviceDetteAnnuel: serviceDette,
  });

  const dscrColor = dscr < 1.0 ? "text-error" : dscr < 1.2 ? "text-warning" : "text-success";
  const dscrLabel =
    dscr < 1.0 ? t("dscrInsufficient") : dscr < 1.2 ? t("dscrLimit") : t("dscrHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">{t("dscrParams")}</h2>
        <div className="space-y-4">
          <InputField label={t("grossRentalIncome")} value={revenuLocatif} onChange={(v) => setRevenuLocatif(Number(v))} suffix="€" />
          <InputField label={t("annualOperatingCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("annualOperatingChargesHint")} />
          <InputField label={t("annualDebtService")} value={serviceDette} onChange={(v) => setServiceDette(Number(v))} suffix="€" hint={t("annualDebtServiceHint")} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("dscrRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${dscrColor}`}>{dscr.toFixed(2)}</div>
          <div className={`mt-2 text-sm font-medium ${dscrColor}`}>{dscrLabel}</div>
        </div>
        <ResultPanel
          title={t("detail")}
          lines={[
            { label: t("grossRentalIncomeShort"), value: formatEUR(revenuLocatif) },
            { label: t("operatingCharges"), value: `- ${formatEUR(charges)}` },
            { label: t("noi"), value: formatEUR(revenuLocatif - charges), highlight: true },
            { label: t("debtService"), value: formatEUR(serviceDette) },
            { label: t("dscrFormula"), value: dscr.toFixed(2), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("referenceThresholds")}
          lines={[
            { label: t("dscrBelow1"), value: t("dscrBelow1Desc"), sub: true, warning: true },
            { label: t("dscr1to1_2"), value: t("dscr1to1_2Desc"), sub: true },
            { label: t("dscrAbove1_2"), value: t("dscrAbove1_2Desc"), sub: true },
            { label: t("dscrAbove1_5"), value: t("dscrAbove1_5Desc"), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabRemboursement() {
  const t = useTranslations("outilsBancaires");
  const [capital, setCapital] = useState(600000);
  const [taux, setTaux] = useState(3.5);
  const [duree, setDuree] = useState(25);
  const [moisPrepaiement, setMoisPrepaiement] = useState(60);
  const [montantRembourse, setMontantRembourse] = useState(100000);
  const [penaliteMois, setPenaliteMois] = useState(6);
  const [strategie, setStrategie] = useState<"reduire_duree" | "reduire_mensualite">("reduire_duree");

  const res = useMemo(
    () =>
      simulerRemboursementAnticipe({
        capital,
        tauxAnnuel: taux / 100,
        dureeAnnees: duree,
        moisPrepaiement,
        montantRembourse,
        penaliteMoisInterets: penaliteMois,
        strategie,
      }),
    [capital, taux, duree, moisPrepaiement, montantRembourse, penaliteMois, strategie]
  );

  const gainColor = res.gainNet > 0 ? "text-success" : res.gainNet < 0 ? "text-error" : "text-muted";
  const anneesApres = Math.floor(res.nouvelleDureeMois / 12);
  const moisApres = res.nouvelleDureeMois % 12;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("remboursLoanParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("borrowedCapital")} value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label={t("annualInterestRate")} value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label={t("duration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          </div>
          <LoanRateSources />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("remboursPrepayParams")}</h2>
          <div className="space-y-4">
            <InputField
              label={t("remboursMonth")}
              value={moisPrepaiement}
              onChange={(v) => setMoisPrepaiement(Number(v))}
              min={1}
              max={duree * 12}
              hint={t("remboursMonthHint", { max: duree * 12 })}
            />
            <InputField
              label={t("remboursAmount")}
              value={montantRembourse}
              onChange={(v) => setMontantRembourse(Number(v))}
              suffix="€"
              hint={t("remboursAmountHint")}
            />
            <InputField
              label={t("remboursPenalty")}
              value={penaliteMois}
              onChange={(v) => setPenaliteMois(Number(v))}
              suffix={t("remboursPenaltyUnit")}
              step={0.5}
              min={0}
              max={12}
              hint={t("remboursPenaltyHint")}
            />
            <div>
              <label className="block text-sm font-medium text-slate mb-1.5">{t("remboursStrategy")}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStrategie("reduire_duree")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    strategie === "reduire_duree"
                      ? "border-navy bg-navy text-white"
                      : "border-card-border bg-card text-slate hover:bg-background"
                  }`}
                >
                  {t("remboursReduceDuration")}
                </button>
                <button
                  type="button"
                  onClick={() => setStrategie("reduire_mensualite")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    strategie === "reduire_mensualite"
                      ? "border-navy bg-navy text-white"
                      : "border-card-border bg-card text-slate hover:bg-background"
                  }`}
                >
                  {t("remboursReduceMonthly")}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">{t("remboursStrategyHint")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-2">{t("remboursLegalTitle")}</h3>
          <p className="text-xs text-muted leading-relaxed">
            {t("remboursLegalBody")}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-br ${res.gainNet > 0 ? "from-emerald-600 to-emerald-800" : res.gainNet < 0 ? "from-red-600 to-red-800" : "from-gray-500 to-gray-700"} p-8 text-center text-white shadow-lg`}>
          <div className="text-sm text-white/70">{t("remboursNetGain")}</div>
          <div className="mt-2 text-5xl font-bold">
            {res.gainNet > 0 ? "+" : ""}{formatEUR(res.gainNet)}
          </div>
          <div className="mt-2 text-xs text-white/70">
            {t("remboursNetGainDetail", {
              gain: formatEUR(res.gainInterets),
              penalty: formatEUR(res.penalite),
            })}
          </div>
        </div>

        <ResultPanel
          title={t("remboursResult")}
          lines={[
            { label: t("remboursInitialMonthly"), value: formatEUR2(res.mensualiteInitiale) },
            { label: t("remboursRemainingBefore"), value: formatEUR(res.capitalRestantAvant) },
            { label: t("remboursRemainingAfter"), value: formatEUR(res.capitalRestantApres), highlight: true },
            { label: t("remboursNewMonthly"), value: formatEUR2(res.nouvelleMensualite) },
            {
              label: t("remboursNewDuration"),
              value: anneesApres > 0
                ? t("remboursYearsMonths", { years: anneesApres, months: moisApres })
                : t("remboursMonthsOnly", { months: res.nouvelleDureeMois }),
              highlight: true,
            },
          ]}
        />

        <ResultPanel
          title={t("remboursComparison")}
          lines={[
            { label: t("remboursInterestWithout"), value: formatEUR(res.interetsRestantsAvant) },
            { label: t("remboursInterestWith"), value: formatEUR(res.interetsRestantsApres) },
            { label: t("remboursInterestSaved"), value: formatEUR(res.gainInterets), highlight: true },
            { label: t("remboursPenaltyPaid"), value: formatEUR(res.penalite) },
            { label: t("remboursNetGain"), value: formatEUR(res.gainNet), highlight: true, large: true },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-2">{t("remboursRecommendation")}</h3>
          <p className={`text-sm font-medium ${gainColor}`}>
            {res.gainNet > 0
              ? t("remboursRecoPositive", { amount: formatEUR(res.gainNet) })
              : res.gainNet < 0
                ? t("remboursRecoNegative", { amount: formatEUR(-res.gainNet) })
                : t("remboursRecoNeutral")}
          </p>
          {res.breakEvenMois !== null && res.penalite > 0 && (
            <p className="mt-2 text-xs text-muted">
              {t("remboursBreakEven", { months: res.breakEvenMois })}
            </p>
          )}
          {res.breakEvenMois === null && res.penalite > 0 && (
            <p className="mt-2 text-xs text-muted">{t("remboursBreakEvenNever")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RatesHistoryChart() {
  const t = useTranslations("outilsBancaires");
  // On garde les 8 dernières années pour garder le graphique lisible
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 7;
  const data: { year: number; bce: number | null; oat: number | null; hypo: number | null; inflation: number | null }[] = [];
  for (let y = minYear; y <= currentYear; y++) {
    const bce = TAUX_DIRECTEUR_BCE.find((d) => d.year === y)?.value ?? null;
    const oat = OAT_10Y.find((d) => d.year === y)?.value ?? null;
    const hypo = TAUX_HYPOTHECAIRE.find((d) => d.year === y)?.value ?? null;
    const inflation = INFLATION.find((d) => d.year === y)?.value ?? null;
    data.push({ year: y, bce, oat, hypo, inflation });
  }

  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-navy">{t("ratesHistoryTitle")}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{t("ratesHistorySubtitle")}</p>
        </div>
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] text-emerald-800 font-semibold">
          {t("ratesHistoryPublicData")}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(1)} %`} />
          <RechartsTooltip
            formatter={(v: unknown) => typeof v === "number" ? `${v.toFixed(2)} %` : "—"}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="bce" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 2 }} name={t("rateBCE")} />
          <Line type="monotone" dataKey="oat" stroke="#b8860b" strokeWidth={2} dot={{ r: 2 }} name={t("rateOAT")} />
          <Line type="monotone" dataKey="hypo" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name={t("rateHypo")} />
          <Line type="monotone" dataKey="inflation" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} name={t("rateInflation")} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-[10px] text-muted">{t("ratesHistoryNote")}</p>
    </div>
  );
}

export default function OutilsBancaires() {
  const t = useTranslations("outilsBancaires");
  const [activeTab, setActiveTab] = useState<ActiveTab>("ltv");

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "ltv", label: t("tabLtv") },
    { id: "capacite", label: t("tabCapacite") },
    { id: "amortissement", label: t("tabAmortissement") },
    { id: "dscr", label: t("tabDscr") },
    { id: "cpe", label: t("tabCpe") },
    { id: "remboursement", label: t("tabRemboursement") },
    { id: "comparateur", label: t("tabComparateur") },
  ];

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "ltv" && <TabLTV />}
        {activeTab === "capacite" && <TabCapacite />}
        {activeTab === "amortissement" && <TabAmortissement />}
        {activeTab === "dscr" && <TabDSCR />}
        {activeTab === "cpe" && <MortgageConditions />}
        {activeTab === "remboursement" && <TabRemboursement />}
        {activeTab === "comparateur" && <LoanOffers />}

        {/* Historique taux BCE / OAT / hypothécaire */}
        <RatesHistoryChart />

        <RelatedTools keys={["achatLocation", "frais", "aides", "estimation"]} />
      </div>


    </div>
  );
}
