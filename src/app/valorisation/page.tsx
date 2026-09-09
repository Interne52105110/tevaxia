"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { formatEUR } from "@/lib/calculations";
import {
  reconcilier,
  calculerComparaisonDocumentee,
  type Comparable,
} from "@/lib/valuation";
import {ComparisonEvidence as TabComparaison} from "@/components/ComparisonEvidence";
import {ReconciliationPanel,type ReconciliationWeights} from "@/components/ReconciliationPanel";
import {CapitalisationScenario} from "@/components/CapitalisationScenario";
import {PrudentialValue} from "@/components/PrudentialValue";
import {DcfScenario} from "@/components/DcfScenario";
import { EsgDossier } from "@/components/EsgDossier";
import SEOContent from "@/components/SEOContent";
import {
  rechercherCommune,
  type SearchResult,
} from "@/lib/market-data";
import {
  ASSET_TYPES,
  EVS_VALUE_TYPES,
  getAssetTypeConfig,
  type AssetType,
  type EVSValueType,
} from "@/lib/asset-types";
const _lazy_generateReportBlob = async (...args: Parameters<typeof import("@/components/ValuationReport")["generateReportBlob"]>): Promise<Blob> => (await import("@/components/ValuationReport")).generateReportBlob(...args);
import { PdfButton } from "@/components/PdfButton";
import { downloadDocxReport } from "@/components/ValuationDocx";
import { getProfile } from "@/lib/profile";
import { RenovationResidual } from "@/components/RenovationResidual";
import { TermReversion } from "@/components/TermReversion";
import { evaluerChecklist, scoreChecklist } from "@/lib/evs-checklist";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import ShareLinkButton from "@/components/ShareLinkButton";
import SignReportButton from "@/components/SignReportButton";
import ReportModeEVS from "@/components/ReportModeEVS";

type ActiveTab = "comparaison" | "capitalisation" | "terme_reversion" | "dcf" | "esg" | "energie" | "mlv" | "reconciliation";

// ============================================================
// TAB 1 — COMPARAISON
// ============================================================

// ============================================================
// TAB 2 — CAPITALISATION DIRECTE
// ============================================================

function TabCapitalisation({onValeur}:{onValeur:(value:number)=>void}) {return <CapitalisationScenario onValeur={onValeur}/>;}

// ============================================================
// TAB 3 — DCF
// ============================================================

function TabDCF({onValeur}:{onValeur:(value:number)=>void}) {return <DcfScenario onValeur={onValeur}/>;}

// ============================================================
// TAB — TERME & RÉVERSION
// ============================================================

function TabTermeReversion({ onValeur }: { onValeur: (v:number)=>void }) { return <TermReversion onValue={onValeur} />; }

// ============================================================
// TAB — ESG / DURABILITÉ
// ============================================================

function TabESG() { return <EsgDossier />; }

// ============================================================
// TAB — RÉSIDUELLE ÉNERGÉTIQUE
// ============================================================

function TabEnergie() { return <RenovationResidual />; }

// ============================================================
// TAB 5 — MLV / CRR
// ============================================================

function TabMLV({valeurMarche}:{valeurMarche:number}) {return <PrudentialValue value={valeurMarche}/>;}

// ============================================================
// TAB 5 — RÉCONCILIATION
// ============================================================

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function Valorisation() {
  const t = useTranslations("valorisation");
  const [viewMode, setViewMode] = useState<"calculateur" | "rapport">("calculateur");
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparaison");
  const [surfaceBien, setSurfaceBien] = useState(80);
  const [assetType, setAssetType] = useState<AssetType>("residential_apartment");
  const [evsValueType, setEvsValueType] = useState<EVSValueType>("market_value");

  // Recherche commune — état global (persiste entre onglets)
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedCommune = selectedResult?.commune ?? null;

  // Comparables — état global (persiste entre onglets)
  const [comparables, setComparables] = useState<Comparable[]>([]);

  const assetConfig = useMemo(() => getAssetTypeConfig(assetType), [assetType]);
  const evsInfo = useMemo(() => EVS_VALUE_TYPES.find((e) => e.id === evsValueType)!, [evsValueType]);

  // Valeurs remontées par chaque onglet
  const comparisonResult=useMemo(()=>{try{return calculerComparaisonDocumentee(comparables,surfaceBien)}catch{return null}},[comparables,surfaceBien]);
  const valeurComparaison=comparisonResult?.valeurEstimeePonderee??0;
  const [valeurCapitalisation, setValeurCapitalisation] = useState(0);
  const [valeurDCF, setValeurDCF] = useState(0);

  // Template de rapport PDF + commissionnaire (banque / juge / notaire)
  const [reportTemplate, setReportTemplate] = useState<"standard" | "bancaire" | "judiciaire" | "succession">("standard");
  const [commissionnaire, setCommissionnaire] = useState("");
  const [signature, setSignature] = useState<{ hash: string; url: string; date: string; payload: string } | null>(null);

  // Stable callback refs
  const onValeurCap = useCallback((v: number) => setValeurCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  const [reconciliationWeights,setReconciliationWeights]=useState<ReconciliationWeights>({comparison:50,capitalisation:25,dcf:25});
  const reconciliation=useMemo(()=>{try{return reconcilier({valeurComparaison,poidsComparaison:reconciliationWeights.comparison,valeurCapitalisation,poidsCapitalisation:reconciliationWeights.capitalisation,valeurDCF,poidsDCF:reconciliationWeights.dcf})}catch{return null}},[valeurComparaison,valeurCapitalisation,valeurDCF,reconciliationWeights]);
  const valeurMarchePourMLV=reconciliation?.valeurReconciliee??0;

  const signaturePayload={comparables,commune:selectedCommune?.commune,assetType:assetConfig.id,evsType:evsInfo.id,surface:surfaceBien,prixM2Commune:selectedCommune?.prixM2Existant,valeurComparaison,valeurCapitalisation,valeurDCF,valeurReconciliee:valeurMarchePourMLV,reconciliationWeights};
  const currentSignature=signature?.payload===JSON.stringify(signaturePayload)?signature:null;

  // Tab labels inside component to use t()
  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "comparaison", label: t("tabComparaison") },
    { id: "capitalisation", label: t("tabCapitalisation") },
    { id: "terme_reversion", label: t("tabTermeReversion") },
    { id: "dcf", label: t("tabDCF") },
    { id: "esg", label: t("tabESG") },
    { id: "energie", label: t("tabEnergie") },
    { id: "mlv", label: t("tabMLV") },
    { id: "reconciliation", label: t("tabReconciliation") },
  ];

  // Reset complet
  const handleReset = useCallback(() => {
    setCommuneSearch("");
    setSelectedResult(null);
    setComparables([]);
    setValeurCapitalisation(0);
    setValeurDCF(0);
    setReconciliationWeights({comparison:50,capitalisation:25,dcf:25});
  }, []);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 [overflow-wrap:anywhere]">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <span className="rounded-full bg-navy/10 px-3 py-0.5 text-xs font-semibold text-navy">
              EVS 2025
            </span>
          </div>
          <p className="mt-2 text-muted">
            {t("pageSubtitle")}
          </p>
        </div>

        {/* Toggle: Mode calculateur / Mode rapport EVS */}
        <div className="mb-6 flex items-center gap-1 rounded-xl bg-card border border-card-border p-1 shadow-sm w-fit">
          <button
            onClick={() => setViewMode("calculateur")}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === "calculateur"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t("modeCalculateur")}
          </button>
          <button
            onClick={() => setViewMode("rapport")}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === "rapport"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t("modeRapportEVS")}
          </button>
        </div>

        {/* Type d'actif + Base de valeur EVS + Surface */}
        <div className="mb-6 space-y-4">
          {/* Asset type selector */}
          <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {ASSET_TYPES.map((at) => (
                <button
                  key={at.id}
                  onClick={() => setAssetType(at.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    assetType === at.id
                      ? "bg-navy text-white shadow-sm"
                      : "bg-background text-muted hover:bg-navy/5 hover:text-navy"
                  }`}
                >
                  {t(at.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* EVS value type + asset context */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label={t("baseDeValeur")}
                type="select"
                value={evsValueType}
                onChange={(v) => setEvsValueType(v as EVSValueType)}
                options={EVS_VALUE_TYPES.map((e) => ({ value: e.id, label: `${e.evs} — ${t(e.labelKey)}` }))}
              />
              <p className="mt-2 text-xs text-muted leading-relaxed">{t(evsInfo.descriptionKey)}</p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label={t("surfaceDuBien")}
                value={surfaceBien}
                onChange={(v) => setSurfaceBien(Number(v))}
                suffix="m²"
              />
              <div className="mt-3 text-xs text-muted">
                <div className="font-medium text-slate mb-1">{t("methodesRecommandees")} :</div>
                {assetConfig.recommendedMethodKeys.map((mk, i) => (
                  <div key={i}>• {t(mk)}</div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-slate mb-2">{t("parametresReference")} — {t(assetConfig.labelKey)}</div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between"><span>{t("tauxDeCapitalisation")}</span><span className="font-mono">{assetConfig.defaults.capRateMin}–{assetConfig.defaults.capRateMax}%</span></div>
                <div className="flex justify-between"><span>{t("tauxDeVacance")}</span><span className="font-mono">{assetConfig.defaults.vacancyRate}%</span></div>
                <div className="flex justify-between"><span>{t("tauxActualisation")}</span><span className="font-mono">{assetConfig.defaults.discountRateDefault}%</span></div>
                <div className="flex justify-between"><span>{t("tauxSortieRevente")}</span><span className="font-mono">{assetConfig.defaults.exitCapDefault}%</span></div>
                <div className="flex justify-between"><span>{t("decotesMLV")}</span><span className="font-mono">{assetConfig.defaults.mlvConjoncturelleDefault + assetConfig.defaults.mlvCommercialisationDefault + assetConfig.defaults.mlvSpecifiqueDefault}%</span></div>
              </div>
              {assetConfig.specificMetricKeys.length > 0 && (
                <div className="mt-2 pt-2 border-t border-card-border text-xs text-muted">
                  <span className="font-medium text-slate">{t("metriquesCles")} : </span>
                  {assetConfig.specificMetricKeys.map((mk) => t(mk)).join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Asset type notes */}
          <div className="rounded-lg bg-navy/5 border border-navy/10 px-4 py-3">
            <p className="text-xs text-slate leading-relaxed">{t(assetConfig.notesKey)}</p>
          </div>

          {/* Résumé persistant : commune + valeurs + reset */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {selectedCommune && (
              <div className="rounded-lg bg-navy/5 border border-navy/10 px-3 py-2">
                <span className="text-muted">{t("commune")} :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
                {selectedResult?.isLocalite && <span className="text-muted"> ({selectedResult.matchedOn})</span>}
                {selectedCommune.prixM2Existant && <span className="ml-2 font-mono text-xs text-muted">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>}
              </div>
            )}
            {valeurComparaison > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">{t("tabComparaison")} :</span> <span className="font-semibold text-navy">{formatEUR(valeurComparaison)}</span></div>
            )}
            {valeurCapitalisation > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">{t("tabCapitalisation")} :</span> <span className="font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span></div>
            )}
            {valeurDCF > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">DCF :</span> <span className="font-semibold text-navy">{formatEUR(valeurDCF)}</span></div>
            )}
            {valeurMarchePourMLV > 0 && (<>
              <div className="w-full flex flex-wrap items-center gap-2 rounded-lg border border-navy/15 bg-navy/5 px-3 py-2">
                <label className="text-xs font-semibold text-navy">{t("reportTemplateLabel")}</label>
                <select
                  value={reportTemplate}
                  onChange={(e) => setReportTemplate(e.target.value as typeof reportTemplate)}
                  className="rounded-md border border-navy/20 bg-white px-2 py-1 text-xs"
                >
                  <option value="standard">{t("templateStandard")}</option>
                  <option value="bancaire">{t("templateBancaire")}</option>
                  <option value="judiciaire">{t("templateJudiciaire")}</option>
                  <option value="succession">{t("templateSuccession")}</option>
                </select>
                <input
                  type="text"
                  value={commissionnaire}
                  onChange={(e) => setCommissionnaire(e.target.value)}
                  placeholder={t("commissionnairePlaceholder")}
                  className="flex-1 min-w-[180px] rounded-md border border-navy/20 bg-white px-2 py-1 text-xs"
                />
              </div>
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("pageTitle")} — ${selectedCommune?.commune || "?"} — ${surfaceBien} m²`,
                    type: "valorisation",
                    commune: selectedCommune?.commune,
                    valeurPrincipale: valeurMarchePourMLV,
                    data: { surfaceBien, assetType, evsValueType, commune: selectedCommune?.commune, valeurComparaison, valeurCapitalisation, valeurDCF, valeurReconciliee:valeurMarchePourMLV, reconciliationWeights, comparables },
                  });
                }}
                label={t("sauvegarder")}
                successLabel={t("sauvegarde")}
              />
              <PdfButton
                generateBlob={() => {
                  const prof = getProfile();
                  return _lazy_generateReportBlob({
                    dateRapport: new Date().toISOString().split("T")[0],
                    commune: selectedCommune?.commune,
                    assetType: t(assetConfig.labelKey),
                    evsType: t(evsInfo.labelKey),
                    surface: surfaceBien,
                    valeurComparaison: valeurComparaison || undefined,
                    valeurCapitalisation: valeurCapitalisation || undefined,
                    valeurDCF: valeurDCF || undefined,
                    valeurRéconciliee: valeurMarchePourMLV,
                    reconciliation: reconciliation?.methodes,
                    prixM2Commune: selectedCommune?.prixM2Existant || undefined,
                    transactionsCommune: selectedCommune?.nbTransactions || undefined,
                    comparables: (comparisonResult?comparables:[]).map(c => {
                      const totalAjust = (c.ajustLocalisation || 0) + (c.ajustEtat || 0) + (c.ajustEtage || 0) + (c.ajustExterieur || 0) + (c.ajustParking || 0) + (c.ajustDate || 0) + (c.ajustAutre || 0);
                      const prixM2 = c.surface > 0 ? c.prixVente / c.surface : 0;
                      return {
                        adresse: [c.adresse,c.dateVente,c.source,c.justification].filter(Boolean).join(" — "),
                        prixVente: c.prixVente,
                        surface: c.surface,
                        prixM2,
                        ajustement: totalAjust,
                        prixAjuste: prixM2 * (1 + totalAjust / 100),
                      };
                    }),
                    classeEnergie: undefined,
                    expertNom: prof.nomComplet || undefined,
                    expertSociete: prof.societe || undefined,
                    expertQualifications: prof.qualifications || undefined,
                    logoUrl: prof.logoUrl || undefined,
                    reportTemplate,
                    commissionnaire: commissionnaire.trim() || undefined,
                    signatureHash: currentSignature?.hash,
                    signatureUrl: currentSignature?.url,
                    signatureDate: currentSignature?.date,
                  });
                }}
                filename={`tevaxia-rapport-${reportTemplate}-${new Date().toISOString().split("T")[0]}.pdf`}
                label="PDF"
              />
              <button
                onClick={() => downloadDocxReport({
                  dateRapport: new Date().toISOString().split("T")[0],
                  commune: selectedCommune?.commune,
                  assetType: t(assetConfig.labelKey),
                  evsType: t(evsInfo.labelKey),
                  surface: surfaceBien,
                  valeurComparaison: valeurComparaison || undefined,
                  valeurCapitalisation: valeurCapitalisation || undefined,
                  valeurDCF: valeurDCF || undefined,
                  valeurReconciliee: valeurMarchePourMLV,
                  reconciliation: reconciliation?.methodes,
                  comparables: comparisonResult?comparables:[],
                })}
                className="rounded-lg border border-gold px-3 py-2 text-xs font-medium text-gold-dark hover:bg-gold/10 transition-colors"
              >
                DOCX
              </button>
              <ShareLinkButton
                toolType="valorisation"
                defaultTitle={`Valorisation ${selectedCommune?.commune ?? ""} — ${surfaceBien} m²`}
                payload={{
                  inputs: {
                    commune: selectedCommune?.commune,
                    assetType: t(assetConfig.labelKey),
                    evsType: t(evsInfo.labelKey),
                    surface: surfaceBien,
                    prixM2Commune: selectedCommune?.prixM2Existant,
                  },
                  results: {
                    valeurComparaison: valeurComparaison || undefined,
                    valeurCapitalisation: valeurCapitalisation || undefined,
                    valeurDCF: valeurDCF || undefined,
                    valeurRetenue: valeurMarchePourMLV,
                    reconciliation: reconciliation?.methodes,
                  },
                }}
              />
              <SignReportButton
                reportTitle={`Valorisation ${selectedCommune?.commune ?? ""} — ${surfaceBien} m²`}
                payload={signaturePayload}
                onSigned={(hash, url, date) => setSignature({ hash, url, date, payload:JSON.stringify(signaturePayload) })}
              />
            </>)}
            {(selectedCommune || comparables.length > 0 || valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
              >
                {t("reinitialiser")}
              </button>
            )}
          </div>
        </div>

        {/* MODE CALCULATEUR */}
        {viewMode === "calculateur" && (<>
        {/* Checklist EVS */}
        {(() => {
          const check = evaluerChecklist({
            communeSelectionnee: !!selectedCommune,
            surfaceRenseignee: surfaceBien > 0,
            assetTypeSelectionne: true,
            evsTypeSelectionne: true,
            comparaisonFaite: valeurComparaison > 0,
            nbComparables: comparables.length,
            capitalisationFaite: valeurCapitalisation > 0,
            dcfFait: valeurDCF > 0,
            esgEvalue: false,
            classeEnergieRenseignee: false,
            donnesMarcheConsultees: !!selectedCommune,
            reconciliationFaite: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            scenariosAnalyses: false,
            narrativeGeneree: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            mlvCalculee: false,
          });
          const score = scoreChecklist(check);
          if (score.remplis === 0) return null;
          return (
            <div className="mb-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-navy">{t("conformiteEVS")}</div>
                <div className={`text-xs font-bold ${score.pctCompletion >= 80 ? "text-success" : score.pctCompletion >= 50 ? "text-warning" : "text-error"}`}>
                  {score.remplis}/{score.total} ({score.pctCompletion.toFixed(0)}%)
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${score.pctCompletion >= 80 ? "bg-success" : score.pctCompletion >= 50 ? "bg-warning" : "bg-error"}`}
                  style={{ width: `${score.pctCompletion}%` }}
                />
              </div>
              {score.obligatoiresManquants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {score.obligatoiresManquants.map((item) => (
                    <span key={item.id} className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700">{t(item.labelKey)}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="sticky top-16 z-30 mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1 shadow-sm">
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

        {activeTab === "comparaison" && (
          <TabComparaison
            surfaceBien={surfaceBien}
            result={comparisonResult}
            communeSearch={communeSearch}
            setCommuneSearch={setCommuneSearch}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            searchResults={searchResults}
            comparables={comparables}
            setComparables={setComparables}
          />
        )}
        {activeTab === "capitalisation" && <TabCapitalisation onValeur={onValeurCap} />}
        {activeTab === "terme_reversion" && <TabTermeReversion onValeur={onValeurCap} />}
        {activeTab === "dcf" && <TabDCF onValeur={onValeurDCF} />}
        {activeTab === "esg" && <TabESG />}
        {activeTab === "energie" && <TabEnergie />}
        {activeTab === "mlv" && <TabMLV valeurMarche={valeurMarchePourMLV} />}
        {activeTab === "reconciliation" && (
          <ReconciliationPanel values={{comparison:valeurComparaison,capitalisation:valeurCapitalisation,dcf:valeurDCF}} weights={reconciliationWeights} onWeights={setReconciliationWeights} result={reconciliation}/>

        )}
        </>)}

        {/* MODE RAPPORT EVS */}
        {viewMode === "rapport" && (
          <ReportModeEVS
            surfaceBien={surfaceBien}
            assetType={t(assetConfig.labelKey)}
            evsValueType={evsValueType}
            selectedCommune={selectedCommune}
            valeurComparaison={valeurComparaison}
            valeurCapitalisation={valeurCapitalisation}
            valeurDCF={valeurDCF}
            valeurMarchePourMLV={valeurMarchePourMLV}
          />
        )}

        <RelatedTools keys={["hedonique", "comparer", "dcfMulti", "indices", "marche", "estimation"]} />
      </div>

      <SEOContent
        ns="valorisation"
        sections={[
          { titleKey: "evs2025Title", contentKey: "evs2025Content" },
          { titleKey: "methodesTitle", contentKey: "methodesContent" },
          { titleKey: "reconciliationTitle", contentKey: "reconciliationContent" },
          { titleKey: "rapportTitle", contentKey: "rapportContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
          { questionKey: "faq5Q", answerKey: "faq5A" },
        ]}
        relatedLinks={[
          { href: "/hedonique", labelKey: "hedonique" },
          { href: "/dcf-multi", labelKey: "dcfMulti" },
          { href: "/estimation", labelKey: "estimation" },
        ]}
      />
    </div>
  );
}
