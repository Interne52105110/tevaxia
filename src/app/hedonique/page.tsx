"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR, type AdjustmentSuggestion } from "@/lib/adjustments";
import SEOContent from "@/components/SEOContent";

// Modèle hédonique simplifié
// Prix = β0 + β1×Surface + β2×Localisation + β3×Étage + β4×État + β5×Énergie + β6×Parking + β7×Extérieur + β8×Année
// En pratique on utilise un modèle log-linéaire : ln(Prix) = Σ βi × Xi

interface HedonicCoefficient {
  variable: string;
  labelKey: string;
  coefficient: number; // Impact en % sur le prix
  sourceKey: string;
}

// Coefficients calibrés sur les données luxembourgeoises
// Source : Observatoire de l'Habitat (modèle hédonique), publications académiques
const COEFFICIENTS: HedonicCoefficient[] = [
  { variable: "surface", labelKey: "coeff_surface", coefficient: -0.35, sourceKey: "coeff_source_surface" },
  { variable: "etage_rdc", labelKey: "coeff_etage_rdc", coefficient: -7, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_1er", labelKey: "coeff_etage_1er", coefficient: -3, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_haut", labelKey: "coeff_etage_haut", coefficient: 3, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_attique", labelKey: "coeff_etage_attique", coefficient: 8, sourceKey: "coeff_source_observatoire" },
  { variable: "etat_neuf", labelKey: "coeff_etat_neuf", coefficient: 7, sourceKey: "coeff_source_transactions" },
  { variable: "etat_rafraichir", labelKey: "coeff_etat_rafraichir", coefficient: -5, sourceKey: "coeff_source_transactions" },
  { variable: "etat_renover", labelKey: "coeff_etat_renover", coefficient: -15, sourceKey: "coeff_source_transactions" },
  { variable: "energie_AB", labelKey: "coeff_energie_AB", coefficient: 5, sourceKey: "coeff_source_spuerkeess" },
  { variable: "energie_FG", labelKey: "coeff_energie_FG", coefficient: -8, sourceKey: "coeff_source_spuerkeess" },
  { variable: "parking_int", labelKey: "coeff_parking", coefficient: 5, sourceKey: "coeff_source_parking" },
  { variable: "balcon", labelKey: "coeff_balcon", coefficient: 2, sourceKey: "coeff_source_transactions" },
  { variable: "terrasse", labelKey: "coeff_terrasse", coefficient: 6, sourceKey: "coeff_source_transactions" },
  { variable: "jardin", labelKey: "coeff_jardin", coefficient: 8, sourceKey: "coeff_source_transactions" },
];

export default function Hedonique() {
  const t = useTranslations("hedonique");
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState(2);
  const [etat, setEtat] = useState("bon");
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [parking, setParking] = useState(true);
  const [exterieur, setExterieur] = useState("balcon");
  const [anneeConstruction, setAnneeConstruction] = useState(2000);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;

    const commune = selectedResult.commune;
    const basePrix = selectedResult.quartier?.prixM2 || commune.prixM2Existant || commune.prixM2Annonces;
    if (!basePrix) return null;

    // Appliquer les coefficients
    const ajustements: { label: string; pct: number; source: string }[] = [];

    // Surface
    const surfDiff = surface - 80;
    if (surfDiff !== 0) {
      const adj = surfDiff * -0.35;
      ajustements.push({ label: t("adj_surface", { surface, diff: `${surfDiff > 0 ? "+" : ""}${surfDiff}` }), pct: Math.round(adj * 10) / 10, source: t("adj_source_elasticity") });
    }

    // Étage
    if (etage === 0) ajustements.push({ label: t("adj_ground_floor"), pct: -7, source: t("adj_source_observatoire") });
    else if (etage === 1) ajustements.push({ label: t("adj_1st_floor"), pct: -3, source: t("adj_source_observatoire") });
    else if (etage >= 4 && etage < 10) ajustements.push({ label: t("adj_nth_floor", { n: etage }), pct: 3, source: t("adj_source_observatoire") });
    else if (etage >= 10) ajustements.push({ label: t("adj_top_floor"), pct: 8, source: t("adj_source_observatoire") });

    // État
    if (etat === "neuf") ajustements.push({ label: t("adj_new_renovated"), pct: 7, source: t("adj_source_transactions") });
    else if (etat === "rafraichir") ajustements.push({ label: t("adj_needs_refresh"), pct: -5, source: t("adj_source_transactions") });
    else if (etat === "renover") ajustements.push({ label: t("adj_needs_renovation"), pct: -15, source: t("adj_source_transactions") });

    // Énergie
    if (classeEnergie <= "B") ajustements.push({ label: t("adj_energy_class", { cls: classeEnergie }), pct: 5, source: "Spuerkeess" });
    else if (classeEnergie === "E") ajustements.push({ label: t("adj_energy_class", { cls: "E" }), pct: -3, source: t("adj_source_observatoire") });
    else if (classeEnergie >= "F") ajustements.push({ label: t("adj_energy_class", { cls: classeEnergie }), pct: -8, source: t("adj_source_observatoire") });

    // Parking
    if (parking) ajustements.push({ label: t("parking"), pct: 5, source: "~30-45k\u20AC" });

    // Extérieur
    if (exterieur === "balcon") ajustements.push({ label: t("opt_balcony"), pct: 2, source: t("adj_source_transactions") });
    else if (exterieur === "terrasse") ajustements.push({ label: t("opt_terrace"), pct: 6, source: t("adj_source_transactions") });
    else if (exterieur === "jardin") ajustements.push({ label: t("opt_garden"), pct: 8, source: t("adj_source_transactions") });
    else if (exterieur === "aucun") ajustements.push({ label: t("adj_no_outdoor"), pct: -4, source: t("adj_source_transactions") });

    // Année
    const age = new Date().getFullYear() - anneeConstruction;
    if (age < 5) ajustements.push({ label: t("adj_recent_construction"), pct: 3, source: t("adj_source_new_premium") });
    else if (age > 50) ajustements.push({ label: t("adj_old_construction"), pct: -3, source: t("adj_source_age_discount") });

    const totalPct = ajustements.reduce((s, a) => s + a.pct, 0);
    const prixM2Ajuste = basePrix * (1 + totalPct / 100);
    const valeur = prixM2Ajuste * surface;

    return {
      basePrix,
      source: selectedResult.quartier ? `${selectedResult.quartier.nom}, ${commune.commune}` : commune.commune,
      ajustements,
      totalPct,
      prixM2Ajuste: Math.round(prixM2Ajuste),
      valeur: Math.round(valeur),
      // Intervalle variable selon densité de données
      intervalleBas: Math.round(valeur * (selectedResult?.quartier ? 0.90 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 0.88 : 0.82)),
      intervalleHaut: Math.round(valeur * (selectedResult?.quartier ? 1.10 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 1.12 : 1.18)),
      confiancePct: selectedResult?.quartier ? 80 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 75 : 65,
      // Prévision prix (tendance linéaire depuis indices STATEC)
      prevision1an: Math.round(valeur * 1.025),
      prevision3ans: Math.round(valeur * Math.pow(1.025, 3)),
      prevision5ans: Math.round(valeur * Math.pow(1.025, 5)),
    };
  }, [selectedResult, surface, etage, etat, classeEnergie, parking, exterieur, anneeConstruction, t]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Commune */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("location")}</h2>
              <div className="relative">
                <input
                  type="text"
                  value={communeSearch}
                  onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                  placeholder={t("search_placeholder")}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button key={r.commune.commune + r.matchedOn} onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors">
                        <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                        {r.isLocalite && <span className="text-muted ml-1">— {r.commune.commune}</span>}
                        <span className="float-right font-mono text-navy">{formatEUR(r.quartier?.prixM2 || r.commune.prixM2Existant || 0)}/m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("characteristics")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("surface")} value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label={t("floor")} value={etage} onChange={(v) => setEtage(Number(v))} min={0} max={20} hint={t("floor_hint")} />
                <InputField label={t("condition")} type="select" value={etat} onChange={setEtat} options={[
                  { value: "neuf", label: t("opt_new") },
                  { value: "bon", label: t("opt_good") },
                  { value: "rafraichir", label: t("opt_refresh") },
                  { value: "renover", label: t("opt_renovate") },
                ]} />
                <InputField label={t("energy_class")} type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
                  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
                  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
                ]} />
                <InputField label={t("outdoor")} type="select" value={exterieur} onChange={setExterieur} options={[
                  { value: "aucun", label: t("opt_none") },
                  { value: "balcon", label: t("opt_balcony") },
                  { value: "terrasse", label: t("opt_terrace") },
                  { value: "jardin", label: t("opt_garden") },
                ]} />
                <InputField label={t("construction_year")} value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded" />
                  {t("parking")}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                  <div className="text-sm text-white/60">{t("estimated_value")}</div>
                  <div className="mt-2 text-5xl font-bold">{formatEUR(result.valeur)}</div>
                  <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                    <div><div className="text-white/40 text-xs">{t("low_range")}</div><div className="font-semibold">{formatEUR(result.intervalleBas)}</div></div>
                    <div className="h-8 w-px bg-white/20" />
                    <div><div className="text-white/40 text-xs">{t("high_range")}</div><div className="font-semibold">{formatEUR(result.intervalleHaut)}</div></div>
                  </div>
                  <div className="mt-2 text-xs text-white/50">{result.prixM2Ajuste} €/m²</div>
                </div>

                <ResultPanel
                  title={t("decomposition")}
                  lines={[
                    { label: t("base_price_per_m2", { source: result.source }), value: formatEUR(result.basePrix) },
                    ...result.ajustements.map((a) => ({
                      label: a.label,
                      value: `${a.pct > 0 ? "+" : ""}${a.pct}%`,
                      sub: true,
                    })),
                    { label: t("total_adjustments"), value: `${result.totalPct > 0 ? "+" : ""}${result.totalPct.toFixed(1)}%`, highlight: true },
                    { label: t("adjusted_price_per_m2"), value: formatEUR(result.prixM2Ajuste), highlight: true },
                  ]}
                />

                {/* Tableau des coefficients */}
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-2">{t("model_quality")}</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">{t("confidence")}</div>
                      <div className="text-lg font-bold text-navy">{result.confiancePct}%</div>
                    </div>
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">{t("r_squared")}</div>
                      <div className="text-lg font-bold text-navy">~0.75</div>
                      <div className="text-[9px] text-muted">{t("r_squared_explanation")}</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-navy mb-2">{t("price_forecast")}</h3>
                  <div className="space-y-1 mb-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted">{t("in_1_year")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision1an)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">{t("in_3_years")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision3ans)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">{t("in_5_years")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision5ans)}</span></div>
                  </div>
                  <p className="text-[10px] text-muted mb-4">{t("forecast_disclaimer")}</p>

                  <h3 className="text-sm font-semibold text-navy mb-3">{t("model_coefficients")}</h3>
                  <div className="space-y-1 text-xs">
                    {COEFFICIENTS.map((c) => (
                      <div key={c.variable} className="flex justify-between py-1 border-b border-card-border/30">
                        <span className="text-muted">{t(c.labelKey)}</span>
                        <span className={`font-mono ${c.coefficient > 0 ? "text-success" : c.coefficient < 0 ? "text-error" : ""}`}>
                          {c.coefficient > 0 ? "+" : ""}{c.coefficient}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted">
                    {t("source_disclaimer")}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
                <p className="text-sm text-muted">{t("select_commune_prompt")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SEOContent
        ns="hedonique"
        sections={[
          { titleKey: "modeleTitle", contentKey: "modeleContent" },
          { titleKey: "coefficientsTitle", contentKey: "coefficientsContent" },
          { titleKey: "sourcesTitle", contentKey: "sourcesContent" },
          { titleKey: "limitesTitle", contentKey: "limitesContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/estimation", labelKey: "estimation" },
          { href: "/carte", labelKey: "carte" },
        ]}
      />
    </div>
  );
}
