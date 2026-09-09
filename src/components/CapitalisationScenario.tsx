"use client";
import {useState,useMemo,useEffect} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import InputField from '@/components/InputField';
import ResultPanel from '@/components/ResultPanel';
import {calculerCapitalisation} from '@/lib/valuation';
export function CapitalisationScenario({ onValeur }: { onValeur: (v: number) => void }) {
  const t = useTranslations("valorisation"),locale=useLocale();
  const formatEUR=(v:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'currency',currency:'EUR'}).format(v);
  const formatPct=(v:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{style:'percent',maximumFractionDigits:4}).format(v);
  const [loyerBrut, setLoyerBrut] = useState(36000);
  const [chargesNonRecup, setChargesNonRecup] = useState(1800);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [provisionEntretien, setProvisionEntretien] = useState(3);
  const [assurancePNO, setAssurancePNO] = useState(400);
  const [fraisGestion, setFraisGestion] = useState(5);
  const [taxeFonciere, setTaxeFonciere] = useState(200);
  const [tauxCap, setTauxCap] = useState(4.0);
  const [ervAnnuel, setErvAnnuel] = useState(NaN);

  const result = useMemo(() => {
    try {return calculerCapitalisation({
      loyerBrutAnnuel: loyerBrut,
      chargesNonRecuperables: chargesNonRecup,
      tauxVacance: tauxVacance / 100,
      provisionGrosEntretien: provisionEntretien / 100,
      assurancePNO,
      fraisGestion: fraisGestion / 100,
      taxeFonciere,
      tauxCapitalisation: tauxCap / 100,
      ervAnnuel: Number.isNaN(ervAnnuel) ? undefined : ervAnnuel,
    });
    } catch {return null;}
  }, [loyerBrut, chargesNonRecup, tauxVacance, provisionEntretien, assurancePNO, fraisGestion, taxeFonciere, tauxCap, ervAnnuel]);

  useEffect(()=>onValeur(result?.valeur??0),[onValeur,result?.valeur]);

  return (
    <div id="capitalisation-scenario" className="space-y-5 [overflow-wrap:anywhere]"><p className="text-sm text-muted">{t("capAuditScope")}</p><p className="text-sm text-muted">{t("capAuditCharges")}</p><div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capRevenus")}</h2>
          <div className="space-y-4">
            <InputField label={t("loyerBrutAnnuel")} value={Number.isNaN(loyerBrut)?"":loyerBrut} onChange={(v) => setLoyerBrut(v.trim() === "" ? NaN : Number(v))} suffix="€" hint={Number.isFinite(loyerBrut)?`${formatEUR(loyerBrut / 12)} /${t("suffixMois")}`:undefined} />
            <InputField label={t("tauxDeVacance")} value={Number.isNaN(tauxVacance)?"":tauxVacance} onChange={(v) => setTauxVacance(v.trim() === "" ? NaN : Number(v))} suffix="%" step={0.5} hint={t("tauxVacanceHint")} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capChargesProprietaire")}</h2>
          <div className="space-y-4">
            <InputField label={t("chargesNonRecup")} value={Number.isNaN(chargesNonRecup)?"":chargesNonRecup} onChange={(v) => setChargesNonRecup(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixEurAn")} />
            <InputField label={t("provisionEntretien")} value={Number.isNaN(provisionEntretien)?"":provisionEntretien} onChange={(v) => setProvisionEntretien(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixPctLoyer")} step={0.5} />
            <InputField label={t("assurancePNO")} value={Number.isNaN(assurancePNO)?"":assurancePNO} onChange={(v) => setAssurancePNO(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixEurAn")} />
            <InputField label={t("fraisGestion")} value={Number.isNaN(fraisGestion)?"":fraisGestion} onChange={(v) => setFraisGestion(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixPctLoyer")} step={0.5} />
            <InputField label={t("impotFoncier")} value={Number.isNaN(taxeFonciere)?"":taxeFonciere} onChange={(v) => setTaxeFonciere(v.trim() === "" ? NaN : Number(v))} suffix={t("suffixEurAn")} hint={t("impotFoncierHint")} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capERVTitle")}</h2>
          <InputField
            label={t("loyerMarcheERV")}
            value={Number.isNaN(ervAnnuel)?"":ervAnnuel}
            onChange={(v) => setErvAnnuel(v.trim() === "" ? NaN : Number(v))}
            suffix="€"
            hint={t("capAuditErvOptional")}
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capTauxCap")}</h2>
          <InputField
            label={t("tauxDeCapitalisation")}
            value={Number.isNaN(tauxCap)?"":tauxCap}
            onChange={(v) => setTauxCap(v.trim() === "" ? NaN : Number(v))}
            suffix="%"
            step={0.1}
            hint={t("tauxCapHint")}
          />
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("capTauxCapNote")}
            </p>
          </div>
        </div>
      </div>

      {result ? <div id="capitalisation-results" className="space-y-6 min-w-0">
        <ResultPanel
          title={t("capResultNOI")}
          lines={[
            { label: t("loyerBrutAnnuel"), value: formatEUR(loyerBrut) },
            { label: t("capVacanceLine", { pct: tauxVacance }), value: `- ${formatEUR(loyerBrut * tauxVacance / 100)}`, sub: true },
            { label: t("capLoyerBrutEffectif"), value: formatEUR(result.loyerBrutEffectif) },
            { label: t("capChargesProprietaireLine"), value: `- ${formatEUR(result.totalCharges)}` },
            { label: t("capNOI"), value: formatEUR(result.noi), highlight: true, large: true },
          ]}
        />

        <ResultPanel
          title={t("valeurParCapitalisation")}
          className="border-gold/30"
          lines={[
            { label: t("capNOIDivTaux", { noi: formatEUR(result.noi), taux: tauxCap }), value: `${formatEUR(result.noi)} / ${tauxCap}%`, sub: true },
            { label: t("valeurEstimee"), value: formatEUR(result.valeur), highlight: true, large: true },
            { label: t("rendementBrut"), value: formatPct(result.rendementBrut), sub: true },
            { label: t("rendementNet"), value: formatPct(result.rendementNet), sub: true },
            ...(result.rendementReversionnaire !== undefined ? [
              { label: t("capAuditErvRatio"), value: formatPct(result.rendementReversionnaire) },
              { label: t("capAuditGap"), value: `${result.potentielReversion?.toFixed(2)} %` },
            ] : []),
          ]}
        />

        {/* Sensibilité au taux de capitalisation */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">{t("capSensibiliteTauxCap")}</h3>
          <div className="space-y-1">
            {result.sensibilite.map((s) => {
              const isActive = Math.abs(s.tauxCap - tauxCap) < 0.01;
              return (
                <div key={s.tauxCap} className={`flex justify-between py-1.5 px-2 rounded text-sm ${isActive ? "bg-navy/5 font-semibold" : ""}`}>
                  <span className="text-muted">{t("taux")} {s.tauxCap.toFixed(2)}%</span>
                  <span className="font-mono">{formatEUR(s.valeur)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div> : <p id="capitalisation-invalid" role="status">{t("capAuditInvalid")}</p>}
    </div></div>
  );
}

