"use client";
import {useState,useMemo,useEffect} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import InputField from '@/components/InputField';
import ResultPanel from '@/components/ResultPanel';
import {calculerDCF} from '@/lib/valuation';
export function DcfScenario({ onValeur }: { onValeur: (v: number) => void }) {
  const t = useTranslations("valorisation");
  const locale=useLocale();
  const formatEUR=(value:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value);
  const [loyerInitial, setLoyerInitial] = useState(36000);
  const [tauxIndex, setTauxIndex] = useState(2.0);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(4500);
  const [progressionCharges, setProgressionCharges] = useState(2.0);
  const [periodeAnalyse, setPeriodeAnalyse] = useState(10);
  const [tauxActu, setTauxActu] = useState(5.5);
  const [tauxCapSortie, setTauxCapSortie] = useState(4.5);
  const [fraisCession, setFraisCession] = useState(7);

  const result = useMemo(() => {
    try {return calculerDCF({
      loyerAnnuelInitial: loyerInitial,
      tauxIndexation: tauxIndex / 100,
      tauxVacance: tauxVacance / 100,
      chargesAnnuelles,
      tauxProgressionCharges: progressionCharges / 100,
      periodeAnalyse,
      tauxActualisation: tauxActu / 100,
      tauxCapSortie: tauxCapSortie / 100,
      fraisCessionPct: fraisCession / 100,
    });
    } catch { return null; }
  }, [loyerInitial, tauxIndex, tauxVacance, chargesAnnuelles, progressionCharges, periodeAnalyse, tauxActu, tauxCapSortie, fraisCession]);

  useEffect(()=>onValeur(result?.valeurDCF??0),[onValeur,result?.valeurDCF]);

  return (
    <div id="dcf-scenario" className="space-y-6 [overflow-wrap:anywhere]">
      <p className="text-sm text-muted">{t("dcfAuditScope")}</p>
      <p className="text-sm text-muted">{t("dcfAuditTerminal")}</p>
      <p className="text-sm text-muted">{t("dcfAuditReturn")}</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("dcfCashFlows")}</h2>
            <div className="space-y-4">
              <InputField label={t("dcfLoyerInitial")} value={Number.isNaN(loyerInitial)?"":loyerInitial} onChange={(v) => setLoyerInitial(v.trim() === "" ? NaN : Number(v))} suffix="€" />
              <InputField label={t("dcfIndexation")} value={Number.isNaN(tauxIndex)?"":tauxIndex} onChange={(v) => setTauxIndex(v.trim() === "" ? NaN : Number(v))} suffix="%" step={0.1} hint={t("dcfIndexationHint")} />
              <InputField label={t("tauxDeVacance")} value={Number.isNaN(tauxVacance)?"":tauxVacance} onChange={(v) => setTauxVacance(v.trim() === "" ? NaN : Number(v))} suffix="%" step={0.5} />
              <InputField label={t("dcfChargesAn1")} value={Number.isNaN(chargesAnnuelles)?"":chargesAnnuelles} onChange={(v) => setChargesAnnuelles(v.trim() === "" ? NaN : Number(v))} suffix="€" />
              <InputField label={t("dcfProgressionCharges")} value={Number.isNaN(progressionCharges)?"":progressionCharges} onChange={(v) => setProgressionCharges(v.trim() === "" ? NaN : Number(v))} suffix="%" step={0.1} />
              <InputField label={t("periodeAnalyse")} value={Number.isNaN(periodeAnalyse)?"":periodeAnalyse} onChange={(v) => setPeriodeAnalyse(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixAns")} min={1} max={50} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("dcfTauxActuSortie")}</h2>
            <div className="space-y-4">
              <InputField
                label={t("tauxActualisation")}
                value={Number.isNaN(tauxActu)?"":tauxActu}
                onChange={(v) => setTauxActu(v.trim() === "" ? NaN : Number(v))}
                suffix="%"
                step={0.1}
                hint={t("tauxActualisationHint")}
              />
              <InputField
                label={t("tauxCapSortie")}
                value={Number.isNaN(tauxCapSortie)?"":tauxCapSortie}
                onChange={(v) => setTauxCapSortie(v.trim() === "" ? NaN : Number(v))}
                suffix="%"
                step={0.1}
                hint={t("tauxCapSortieHint")}
              />
              <InputField label={t("fraisCession")} value={Number.isNaN(fraisCession)?"":fraisCession} onChange={(v) => setFraisCession(v.trim() === "" ? NaN : Number(v))} suffix="%" hint={t("fraisCessionHint")} />
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                {t("dcfTauxNote")}
              </p>
            </div>
          </div>
        </div>

        {result ? <div id="dcf-results" className="space-y-6 min-w-0">
          <ResultPanel
            title={t("dcfValeurTitle")}
            className="border-gold/30"
            lines={[
              { label: t("dcfRevenusNetsActualises"), value: formatEUR(result.totalNOIActualise) },
              { label: t("dcfRevenuNetProjection", { annee: periodeAnalyse + 1 }), value: formatEUR(result.noiTerminal), sub: true },
              { label: t("dcfValeurReventeBrute"), value: formatEUR(result.valeurTerminaleBrute), sub: true },
              { label: t("dcfFraisCessionPct", { pct: fraisCession }), value: `- ${formatEUR(result.fraisCession)}`, sub: true },
              { label: t("dcfValeurReventeNette"), value: formatEUR(result.valeurTerminaleNette), sub: true },
              { label: t("dcfValeurReventeActualisee"), value: formatEUR(result.valeurTerminaleActualisee) },
              { label: t("dcfValeurDCF"), value: formatEUR(result.valeurDCF), highlight: true, large: true },
            ]}
          />

          {/* Matrice de sensibilité DCF */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">{t("dcfSensibiliteTitle")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-2 py-1.5 text-left text-navy">{t("dcfActuVsSortie")}</th>
                    {[...new Set(result.sensibilite.map((s) => s.tauxCapSortie))].map((tc) => (
                      <th key={tc} className="px-2 py-1.5 text-right text-navy">{tc.toFixed(3)}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(result.sensibilite.map((s) => s.tauxActu))].map((ta) => (
                    <tr key={ta} className="border-b border-card-border/50">
                      <td className="px-2 py-1.5 font-medium">{ta.toFixed(3)}%</td>
                      {result.sensibilite.filter((s) => s.tauxActu === ta).map((s) => {
                        const isBase = Math.abs(s.tauxActu - tauxActu) < 0.01 && Math.abs(s.tauxCapSortie - tauxCapSortie) < 0.01;
                        return (
                          <td key={s.tauxCapSortie} className={`px-2 py-1.5 text-right font-mono ${isBase ? "bg-navy/10 font-bold" : ""}`}>
                            {formatEUR(s.valeur)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted">{t("dcfSensibiliteNote")}</p>
          </div>

        </div> : <p id="dcf-invalid" role="status">{t("dcfAuditInvalid")}</p>}
      </div>

      {/* Tableau des cash flows */}
      {result && <div id="dcf-cashflows" className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-3 py-2.5 text-left font-semibold text-navy">{t("dcfThAnnee")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThLoyerBrut")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThVacance")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThCharges")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThRevenuNet")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThFacteurActu")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThRevenuActualise")}</th>
            </tr>
          </thead>
          <tbody>
            {result.cashFlows.map((cf) => (
              <tr key={cf.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-3 py-2 font-medium">{cf.annee}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.loyerBrut)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.vacance)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.charges)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(cf.noi)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{cf.facteurActualisation.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.noiActualise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

