"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import {
  calculerComparaison,
  reconcilier,
  type Comparable,
} from "@/lib/valuation";
import {ReconciliationPanel,type ReconciliationWeights} from "@/components/ReconciliationPanel";
import {CapitalisationScenario} from "@/components/CapitalisationScenario";
import {PrudentialValue} from "@/components/PrudentialValue";
import {DcfScenario} from "@/components/DcfScenario";
import { EsgDossier } from "@/components/EsgDossier";
import SEOContent from "@/components/SEOContent";
import {
  rechercherCommune,
  DATA_SOURCES,
  type MarketDataCommune,
  type SearchResult,
} from "@/lib/market-data";
import {
  ASSET_TYPES,
  EVS_VALUE_TYPES,
  getAssetTypeConfig,
  type AssetType,
  type EVSValueType,
} from "@/lib/asset-types";
import AdjustmentGuidePanel from "@/components/AdjustmentGuide";
import MarketDataPanel from "@/components/MarketDataPanel";
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

function TabComparaison({
  surfaceBien,
  onValeur,
  assetType,
  communeSearch,
  setCommuneSearch,
  selectedResult,
  setSelectedResult,
  searchResults,
  selectedCommune,
  comparables,
  setComparables,
}: {
  surfaceBien: number;
  onValeur: (v: number) => void;
  assetType: AssetType;
  communeSearch: string;
  setCommuneSearch: (v: string) => void;
  selectedResult: SearchResult | null;
  setSelectedResult: (v: SearchResult | null) => void;
  searchResults: SearchResult[];
  selectedCommune: MarketDataCommune | null;
  comparables: Comparable[];
  setComparables: React.Dispatch<React.SetStateAction<Comparable[]>>;
}) {
  const t = useTranslations("valorisation");

  const result = useMemo(() => {
    if (comparables.length === 0) {
      onValeur(0);
      return null;
    }
    const r = calculerComparaison(comparables, surfaceBien);
    onValeur(r.valeurEstimeePonderee);
    return r;
  }, [comparables, surfaceBien, onValeur]);

  const updateComp = (index: number, field: keyof Comparable, value: string | number) => {
    setComparables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addComp = () => {
    // Pré-remplir avec le prix moyen communal si disponible
    const prixM2Ref = selectedCommune?.prixM2Existant || 0;
    setComparables((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        adresse: selectedCommune ? `${t("compVirtuelLabel")} — ${selectedCommune.commune}` : "",
        prixVente: prixM2Ref > 0 ? prixM2Ref * surfaceBien : 0,
        surface: surfaceBien,
        dateVente: new Date().toISOString().slice(0, 7),
        ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0,
        ajustExterieur: 0, ajustParking: 0, ajustDate: 0, ajustAutre: 0,
        poids: 33,
      },
    ]);
  };

  const removeComp = (index: number) => {
    setComparables((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Références de marché — données publiques */}
      <div className="rounded-xl border-2 border-navy/20 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-1">{t("refMarcheParCommune")}</h2>
        <p className="text-xs text-muted mb-4">{t("refMarcheSource")}</p>

        <div className="relative">
          <input
            type="text"
            value={communeSearch}
            onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.commune.commune + r.matchedOn}
                  onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                >
                  {r.isLocalite ? (
                    <>
                      <span className="font-medium">{r.matchedOn}</span>
                      <span className="text-muted ml-1">— {r.quartier ? t("quartierDe") : t("communeDe")} {r.commune.commune}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{r.commune.commune}</span>
                      <span className="text-muted ml-2">({r.commune.canton})</span>
                    </>
                  )}
                  <span className="float-right font-mono text-navy">
                    {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCommune && (
          <div className="mt-4">
            {selectedResult?.isLocalite && (
              <p className="text-xs text-muted mb-2">
                <span className="font-medium text-slate">{selectedResult.matchedOn}</span> — {selectedResult.quartier ? t("quartierDe") : t("communeDe")} <span className="font-medium text-slate">{selectedCommune.commune}</span> ({selectedCommune.canton}).
                {selectedResult.quartier && (
                  <span className="ml-1 text-slate">{selectedResult.quartier.note}</span>
                )}
              </p>
            )}

            {/* Prix quartier spécifique si dispo */}
            {selectedResult?.quartier && (
              <div className="mb-3 rounded-lg border-2 border-navy/20 bg-navy/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-navy">{selectedResult.quartier.nom}</div>
                    <div className="text-xs text-muted">{selectedResult.quartier.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-navy">{formatEUR(selectedResult.quartier.prixM2)}/m²</div>
                    {selectedResult.quartier.loyerM2 && (
                      <div className="text-xs text-muted">{t("loyer")} : {selectedResult.quartier.loyerM2.toFixed(1)} €/m²/{t("suffixMois")}</div>
                    )}
                    <div className={`text-xs font-medium ${selectedResult.quartier.tendance === "hausse" ? "text-success" : selectedResult.quartier.tendance === "baisse" ? "text-error" : "text-muted"}`}>
                      {t("tendance")} : {selectedResult.quartier.tendance}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2Transactions")}</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
              <div className="text-[10px] text-muted">{t("existantActes")}</div>
            </div>
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2VEFA")}</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
              <div className="text-[10px] text-muted">{t("neufActes")}</div>
            </div>
            <div className="rounded-lg bg-gold/10 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2Annonces")}</div>
              <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
              <div className="text-[10px] text-muted">{t("annoncesDonnees")}</div>
            </div>
            <div className="rounded-lg bg-teal/10 p-3 text-center">
              <div className="text-xs text-muted">{t("loyerM2Mois")}</div>
              <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
              <div className="text-[10px] text-muted">{t("annoncesDonnees")}</div>
            </div>
            </div>
          </div>
        )}

        {selectedCommune && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{t("nbTransactions", { nb: selectedCommune.nbTransactions ?? 0, periode: selectedCommune.periode ?? "" })}</span>
            <span>{selectedCommune.source}</span>
          </div>
        )}

        {/* Grille quartiers si disponible */}
        {selectedCommune?.quartiers && selectedCommune.quartiers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-navy mb-2">{t("prixParQuartier", { commune: selectedCommune.commune })}</h3>
            <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("thQuartier")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">€/m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thLoyerM2")}</th>
                    <th className="px-3 py-2 text-center font-semibold text-navy">{t("tendance")}</th>
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("thCaracteristique")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCommune.quartiers
                    .sort((a, b) => b.prixM2 - a.prixM2)
                    .map((qr) => (
                    <tr key={qr.nom} className={`border-b border-card-border/50 hover:bg-background/50 ${selectedResult?.quartier?.nom === qr.nom ? "bg-navy/5" : ""}`}>
                      <td className="px-3 py-1.5 font-medium">{qr.nom}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(qr.prixM2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{qr.loyerM2 ? `${qr.loyerM2.toFixed(1)} €` : "—"}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          qr.tendance === "hausse" ? "bg-green-100 text-green-700" :
                          qr.tendance === "baisse" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{qr.tendance}</span>
                      </td>
                      <td className="px-3 py-1.5 text-muted">{qr.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-muted">{t("quartiersSourceNote")}</p>
          </div>
        )}
      </div>

      {/* Données marché par segment (non-résidentiel) */}
      {assetType !== "residential_apartment" && (
        <MarketDataPanel assetType={assetType} />
      )}

      {/* Sources de données */}
      <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-2">{t("sourcesOuvertes")}</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <a href={DATA_SOURCES.prixTransactionsParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixTransactionsParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixTransactionsParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAffinesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAffinesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAffinesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAnnoncesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAnnoncesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAnnoncesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.indicePrixSTATEC.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">SDMX</span>
            <span className="text-slate">{DATA_SOURCES.indicePrixSTATEC.label}</span>
          </a>
        </div>
      </div>

      {/* Évaluation rapide par ajustement du prix communal */}
      {selectedCommune && selectedCommune.prixM2Existant && (
        <div className="rounded-xl border-2 border-gold/30 bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-1">{t("evalParAjustement")}</h2>
          <p className="text-xs text-muted mb-4">
            {t("prixDeBase")} : <strong className="text-navy">{formatEUR(selectedCommune.prixM2Existant)}/m²</strong> ({selectedCommune.commune})
            {selectedResult?.quartier && <> — {t("thQuartier").toLowerCase()} {selectedResult.quartier.nom} : <strong className="text-navy">{formatEUR(selectedResult.quartier.prixM2)}/m²</strong></>}
            . {t("ajustezCaracteristiques")}
          </p>

          {/* Ajustements inline — sans avoir à créer de comparable */}
          {comparables.length === 0 && (
            <div>
              <button
                onClick={addComp}
                className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors"
              >
                {t("commencerEvaluation", { commune: selectedCommune.commune })}
              </button>
              <p className="mt-2 text-xs text-muted text-center">
                {t("compCreePrixMoyen")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comparables */}
      {comparables.length > 0 && (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <div className="rounded-lg bg-navy/5 border border-navy/10 p-4 mb-4">
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="text-navy">{t("compGuideTitle")}</strong>{" "}
            {t("compGuideText")}
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy">{t("comparablesTitle", { count: comparables.length })}</h2>
            <p className="text-xs text-muted">{t("comparablesSub")}</p>
          </div>
          <button
            onClick={addComp}
            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors"
          >
            {t("ajouterComparable")}
          </button>
        </div>

        <div className="space-y-4">
          {comparables.map((comp, i) => (
            <div key={comp.id} className="rounded-lg border border-card-border bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy">{t("comparableN", { n: i + 1 })}</span>
                <button onClick={() => removeComp(i)} className="text-xs text-error hover:underline">
                  {t("supprimer")}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label={t("adresse")} type="text" value={comp.adresse} onChange={(v) => updateComp(i, "adresse", v)} className="sm:col-span-3" />
                <InputField label={t("prixDeVente")} value={comp.prixVente} onChange={(v) => updateComp(i, "prixVente", v)} suffix="€" />
                <InputField label={t("surface")} value={comp.surface} onChange={(v) => updateComp(i, "surface", v)} suffix="m²" />
                <InputField label={t("dateVente")} type="text" value={comp.dateVente} onChange={(v) => updateComp(i, "dateVente", v)} hint={t("dateHintAAAAMM")} />
              </div>

              {/* Ajustements avec guides statistiques */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-navy">{t("ajustementsTitle")}</span>
                  <span className="text-[10px] text-muted">{t("ajustementsHint")}</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Localisation */}
                  <div className="flex gap-2">
                    <InputField label={t("localisation")} value={comp.ajustLocalisation} onChange={(v) => updateComp(i, "ajustLocalisation", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="localisation" currentValue={comp.ajustLocalisation} onApply={(v) => updateComp(i, "ajustLocalisation", v)} />
                  </div>

                  {/* État */}
                  <div className="flex gap-2">
                    <InputField label={t("etat")} value={comp.ajustEtat} onChange={(v) => updateComp(i, "ajustEtat", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etat" currentValue={comp.ajustEtat} onApply={(v) => updateComp(i, "ajustEtat", v)} />
                  </div>

                  {/* Étage */}
                  <div className="flex gap-2">
                    <InputField label={t("etageVue")} value={comp.ajustEtage} onChange={(v) => updateComp(i, "ajustEtage", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etage" currentValue={comp.ajustEtage} onApply={(v) => updateComp(i, "ajustEtage", v)} />
                  </div>

                  {/* Extérieur */}
                  <div className="flex gap-2">
                    <InputField label={t("exterieur")} value={comp.ajustExterieur} onChange={(v) => updateComp(i, "ajustExterieur", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="exterieur" currentValue={comp.ajustExterieur} onApply={(v) => updateComp(i, "ajustExterieur", v)} />
                  </div>

                  {/* Parking */}
                  <div className="flex gap-2">
                    <InputField label={t("parking")} value={comp.ajustParking} onChange={(v) => updateComp(i, "ajustParking", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="parking" currentValue={comp.ajustParking} onApply={(v) => updateComp(i, "ajustParking", v)} />
                  </div>

                  {/* Date — avec auto-calcul STATEC */}
                  <div className="flex gap-2">
                    <InputField label={t("dateIndex")} value={comp.ajustDate} onChange={(v) => updateComp(i, "ajustDate", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="date" currentValue={comp.ajustDate} onApply={(v) => updateComp(i, "ajustDate", v)} dateVente={comp.dateVente} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <InputField label={t("autreAjustement")} value={comp.ajustAutre} onChange={(v) => updateComp(i, "ajustAutre", v)} suffix="%" step={0.5} hint={t("autreAjustementHint")} />
                  <InputField label={t("poids")} value={comp.poids} onChange={(v) => updateComp(i, "poids", v)} suffix="%" min={0} max={100} hint={t("poidsHint")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {!selectedCommune && comparables.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center">
          <p className="text-sm text-muted">{t("selectCommuneStart")}</p>
        </div>
      )}

      {/* Résultats — seulement si des comparables sont saisis */}
      {result && result.comparables.length > 0 && (
        <>
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-3 py-2.5 text-left font-semibold text-navy">{t("thComp")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thEurM2Brut")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thAjustTotal")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thEurM2Ajuste")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("poids")}</th>
                </tr>
              </thead>
              <tbody>
                {result.comparables.map((c, i) => (
                  <tr key={c.id} className="border-b border-card-border/50">
                    <td className="px-3 py-2 font-medium">{c.adresse || `${t("thComp")} ${i + 1}`}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatEUR(c.prixM2Brut)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.totalAjustements > 0 ? "+" : ""}{c.totalAjustements.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(c.prixM2Ajuste)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.poids}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ResultPanel
            title={t("valeurParComparaison")}
            lines={[
              { label: t("prixMoyenAjusteM2"), value: formatEUR(result.prixM2Moyen), sub: true },
              { label: t("prixMoyenPondereM2"), value: formatEUR(result.prixM2MoyenPondere) },
              { label: t("surfaceDuBien"), value: `${surfaceBien} m²`, sub: true },
              { label: t("valeurEstimeePonderee"), value: formatEUR(result.valeurEstimeePonderee), highlight: true, large: true },
            ]}
          />
        </>
      )}
    </div>
  );
}

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
  const [valeurComparaison, setValeurComparaison] = useState(0);
  const [valeurCapitalisation, setValeurCapitalisation] = useState(0);
  const [valeurDCF, setValeurDCF] = useState(0);

  // Template de rapport PDF + commissionnaire (banque / juge / notaire)
  const [reportTemplate, setReportTemplate] = useState<"standard" | "bancaire" | "judiciaire" | "succession">("standard");
  const [commissionnaire, setCommissionnaire] = useState("");
  const [signature, setSignature] = useState<{ hash: string; url: string; date: string; payload: string } | null>(null);

  // Stable callback refs
  const onValeurComp = useCallback((v: number) => setValeurComparaison(v), []);
  const onValeurCap = useCallback((v: number) => setValeurCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  const [reconciliationWeights,setReconciliationWeights]=useState<ReconciliationWeights>({comparison:50,capitalisation:25,dcf:25});
  const reconciliation=useMemo(()=>{try{return reconcilier({valeurComparaison,poidsComparaison:reconciliationWeights.comparison,valeurCapitalisation,poidsCapitalisation:reconciliationWeights.capitalisation,valeurDCF,poidsDCF:reconciliationWeights.dcf})}catch{return null}},[valeurComparaison,valeurCapitalisation,valeurDCF,reconciliationWeights]);
  const valeurMarchePourMLV=reconciliation?.valeurReconciliee??0;

  const signaturePayload={commune:selectedCommune?.commune,assetType:assetConfig.id,evsType:evsInfo.id,surface:surfaceBien,prixM2Commune:selectedCommune?.prixM2Existant,valeurComparaison,valeurCapitalisation,valeurDCF,valeurReconciliee:valeurMarchePourMLV,reconciliationWeights};
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
    setValeurComparaison(0);
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
                    data: { surfaceBien, assetType, evsValueType, commune: selectedCommune?.commune, valeurComparaison, valeurCapitalisation, valeurDCF, valeurReconciliee:valeurMarchePourMLV, reconciliationWeights },
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
                    comparables: comparables.filter(c => c.prixVente > 0).map(c => {
                      const totalAjust = (c.ajustLocalisation || 0) + (c.ajustEtat || 0) + (c.ajustEtage || 0) + (c.ajustExterieur || 0) + (c.ajustParking || 0) + (c.ajustDate || 0) + (c.ajustAutre || 0);
                      const prixM2 = c.surface > 0 ? Math.round(c.prixVente / c.surface) : 0;
                      return {
                        adresse: c.adresse,
                        prixVente: c.prixVente,
                        surface: c.surface,
                        prixM2,
                        ajustement: Math.round(totalAjust * 10) / 10,
                        prixAjuste: Math.round(prixM2 * (1 + totalAjust / 100)),
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
            onValeur={onValeurComp}
            assetType={assetType}
            communeSearch={communeSearch}
            setCommuneSearch={setCommuneSearch}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            searchResults={searchResults}
            selectedCommune={selectedCommune}
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
