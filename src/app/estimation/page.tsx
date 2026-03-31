"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { estimer } from "@/lib/estimation";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "@/lib/adjustments";
import { formatEUR } from "@/lib/calculations";
import ConfidenceGauge from "@/components/ConfidenceGauge";
import { estimerCoutsRenovation } from "@/lib/renovation-costs";
import { calculerDecoteEmphyteose } from "@/lib/emphyteose";
import { PriceEvolutionChart } from "@/components/PriceChart";
import { updateUrlHash, readUrlHash } from "@/lib/url-state";
import { sauvegarderEvaluation } from "@/lib/storage";

export default function Estimation() {
  const [linkCopied, setLinkCopied] = useState(false);
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState("2ème–3ème étage (réf.)");
  const [etat, setEtat] = useState("Bon état (réf.)");
  const [exterieur, setExterieur] = useState("Balcon standard (réf.)");
  const [parking, setParking] = useState(true);
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [estNeuf, setEstNeuf] = useState(false);
  const [bailEmphyteotique, setBailEmphyteotique] = useState(false);
  const [dureeRestanteEmph, setDureeRestanteEmph] = useState(85);
  const [canonAnnuel, setCanonAnnuel] = useState(1200);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;
    return estimer({
      commune: selectedResult.commune.commune,
      quartier: selectedResult.quartier?.nom,
      surface,
      nbChambres,
      etage,
      etat,
      exterieur,
      parking,
      classeEnergie,
      typeBien: "appartement",
      estNeuf,
    });
  }, [selectedResult, surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf]);

  const confianceColor = result?.confiance === "forte" ? "text-success" : result?.confiance === "moyenne" ? "text-warning" : "text-error";
  const confianceBg = result?.confiance === "forte" ? "bg-green-50 border-green-200" : result?.confiance === "moyenne" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Estimation immobilière
          </h1>
          <p className="mt-2 text-muted">
            Estimation guidée par les données publiques luxembourgeoises
          </p>
        </div>

        {/* Formulaire */}
        <div className="space-y-6">
          {/* Commune */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Localisation</h2>
            <div className="relative">
              <input
                type="text"
                value={communeSearch}
                onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                placeholder="Commune, localité ou quartier..."
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-3 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
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
                        <><span className="font-medium">{r.matchedOn}</span><span className="text-muted ml-1">— {r.quartier ? "quartier" : "commune"} de {r.commune.commune}</span></>
                      ) : (
                        <><span className="font-medium">{r.commune.commune}</span><span className="text-muted ml-2">({r.commune.canton})</span></>
                      )}
                      <span className="float-right font-mono text-navy">
                        {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedResult && (
              <div className="mt-2 text-xs text-muted">
                {selectedResult.quartier
                  ? `${selectedResult.quartier.nom} — ${selectedResult.quartier.note}`
                  : `${selectedResult.commune.commune} (${selectedResult.commune.canton})`
                }
              </div>
            )}
          </div>

          {/* Caractéristiques */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Caractéristiques du bien</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Surface habitable" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" min={10} max={500} />
              <InputField label="Nombre de chambres" value={nbChambres} onChange={(v) => setNbChambres(Number(v))} min={0} max={10} />
              <InputField
                label="Étage"
                type="select"
                value={etage}
                onChange={setEtage}
                options={AJUST_ETAGE.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="État du bien"
                type="select"
                value={etat}
                onChange={setEtat}
                options={AJUST_ETAT.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="Extérieur"
                type="select"
                value={exterieur}
                onChange={setExterieur}
                options={AJUST_EXTERIEUR.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="Classe énergie (CPE)"
                type="select"
                value={classeEnergie}
                onChange={setClasseEnergie}
                options={[
                  { value: "A", label: "A — Très performant (+5%)" },
                  { value: "B", label: "B — Performant (+3%)" },
                  { value: "C", label: "C — Assez performant (+1%)" },
                  { value: "D", label: "D — Moyen (réf.)" },
                  { value: "E", label: "E — Peu performant (-3%)" },
                  { value: "F", label: "F — Très peu performant (-6%)" },
                  { value: "G", label: "G — Extrêmement peu performant (-10%)" },
                ]}
              />
            </div>
            <div className="mt-4 space-y-3">
              <ToggleField label="Parking inclus" checked={parking} onChange={setParking} hint="+4% en moyenne" />
              <ToggleField label="Bien neuf (VEFA)" checked={estNeuf} onChange={setEstNeuf} hint="Prix de référence VEFA au lieu d'existant" />
              <ToggleField label="Bail emphytéotique" checked={bailEmphyteotique} onChange={setBailEmphyteotique} hint="Bien en droit de superficie / emphytéose (pas pleine propriété)" />
              {bailEmphyteotique && (
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  <InputField label="Durée restante" value={dureeRestanteEmph} onChange={(v) => setDureeRestanteEmph(Number(v))} suffix="ans" min={1} max={99} />
                  <InputField label="Canon annuel" value={canonAnnuel} onChange={(v) => setCanonAnnuel(Number(v))} suffix="€/an" hint="Redevance annuelle au propriétaire du terrain" />
                </div>
              )}
            </div>
          </div>

          {/* Résultat */}
          {result && (
            <div className="space-y-4">
              {/* Estimation principale */}
              <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                <div className="text-sm text-white/60">Estimation centrale</div>
                <div className="mt-2 text-5xl font-bold">{formatEUR(result.estimationCentrale)}</div>
                <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                  <div>
                    <div className="text-white/40 text-xs">Basse</div>
                    <div className="font-semibold">{formatEUR(result.estimationBasse)}</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <div className="text-white/40 text-xs">Haute</div>
                    <div className="font-semibold">{formatEUR(result.estimationHaute)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  {result.prixM2Ajuste} €/m² × {surface} m²
                </div>
              </div>

              {/* Double modèle : transactions vs annonces */}
              {result.estimationTransactions != null && result.estimationAnnonces != null && (
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-3">Comparaison des sources de prix</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                      <div className="text-xs text-blue-600 font-medium">Estimation transactions</div>
                      <div className="text-xs text-blue-400 mb-1">Actes notariés</div>
                      <div className="text-lg font-bold text-blue-800">{formatEUR(result.estimationTransactions)}</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center">
                      <div className="text-xs text-purple-600 font-medium">Estimation annonces</div>
                      <div className="text-xs text-purple-400 mb-1">Prix affichés</div>
                      <div className="text-lg font-bold text-purple-800">{formatEUR(result.estimationAnnonces)}</div>
                    </div>
                  </div>
                  {result.ecartPct != null && (
                    <div className="mt-3 text-center">
                      <span className="text-xs text-muted">
                        Écart : <span className={`font-semibold ${result.ecartPct > 0 ? "text-amber-600" : "text-green-600"}`}>{result.ecartPct > 0 ? "+" : ""}{result.ecartPct}%</span>
                        {" "}— Estimation centrale (moyenne) : <span className="font-semibold text-navy">{formatEUR(Math.round((result.estimationTransactions + result.estimationAnnonces) / 2))}</span>
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-muted">
                    Les transactions reflètent les prix réellement payés (actes notariés). Les annonces reflètent les prix demandés (souvent plus élevés). L'écart est un indicateur de la marge de négociation.
                  </p>
                </div>
              )}

              {/* Emphytéose */}
              {bailEmphyteotique && result && (() => {
                const emph = calculerDecoteEmphyteose({
                  valeurPleinePropriete: result.estimationCentrale,
                  dureeRestante: dureeRestanteEmph,
                  canonAnnuel,
                  tauxActualisation: 3.5,
                });
                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">Bail emphytéotique — Décote</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-amber-700">Valeur pleine propriété</span><span className="font-mono">{formatEUR(result.estimationCentrale)}</span></div>
                      <div className="flex justify-between"><span className="text-amber-700">Décote emphytéotique ({emph.decotePct.toFixed(1)}%)</span><span className="font-mono text-error">- {formatEUR(emph.decote)}</span></div>
                      <div className="flex justify-between font-semibold border-t border-amber-200 pt-1"><span className="text-amber-900">Valeur en emphytéose</span><span className="font-mono text-navy">{formatEUR(emph.valeurEmphyteose)}</span></div>
                    </div>
                    <p className="mt-2 text-xs text-amber-700">{emph.explication}</p>
                  </div>
                );
              })()}

              {/* Confiance */}
              <ConfidenceGauge level={result.confiance} note={result.confianceNote} />

              {/* Estimation rénovation si classe énergie faible */}
              {classeEnergie >= "E" && (() => {
                const reno = estimerCoutsRenovation(classeEnergie, "B", surface);
                if (reno.postes.length === 0) return null;
                return (
                  <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-2">Estimation de rénovation énergétique ({classeEnergie} → B)</h3>
                    <div className="space-y-1 text-xs">
                      {reno.postes.map((p) => (
                        <div key={p.label} className="flex justify-between">
                          <span className="text-muted">{p.label}</span>
                          <span className="font-mono">{formatEUR(p.coutMin)} – {formatEUR(p.coutMax)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold border-t border-card-border pt-1 mt-1">
                        <span>Total estimé (travaux + honoraires)</span>
                        <span className="font-mono">{formatEUR(reno.totalAvecHonoraires)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted">Fourchettes indicatives — marché luxembourgeois. Éligible Klimabonus (jusqu'à 62,5%).</p>
                  </div>
                );
              })()}

              {/* Graphique évolution prix */}
              <PriceEvolutionChart />

              {/* Détail */}
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-navy">Détail de l'estimation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Prix de base /m²</span>
                    <span className="font-mono font-semibold">{formatEUR(result.prixM2Base)}</span>
                  </div>
                  <div className="text-xs text-muted pl-2">{result.sourceBase} — {selectedResult?.commune.periode}</div>

                  {result.ajustements.length > 0 && (
                    <div className="border-t border-card-border pt-2 mt-2 space-y-1">
                      {result.ajustements.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted">{a.label}</span>
                          <span className={`font-mono ${a.pct > 0 ? "text-success" : a.pct < 0 ? "text-error" : "text-muted"}`}>
                            {a.pct > 0 ? "+" : ""}{a.pct}%
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1">
                        <span>Total ajustements</span>
                        <span className={result.totalAjustements > 0 ? "text-success" : result.totalAjustements < 0 ? "text-error" : ""}>
                          {result.totalAjustements > 0 ? "+" : ""}{result.totalAjustements}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold border-t border-card-border pt-2 mt-2">
                    <span className="text-navy">Prix ajusté /m²</span>
                    <span className="text-navy font-mono">{formatEUR(result.prixM2Ajuste)}</span>
                  </div>
                </div>
              </div>

              {/* Partager */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    updateUrlHash({ c: communeSearch, s: surface, ch: nbChambres, et: etage, ea: etat, ex: exterieur, p: parking, e: classeEnergie, n: estNeuf });
                    navigator.clipboard.writeText(window.location.href);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="rounded-lg border border-card-border px-4 py-2 text-xs font-medium text-muted hover:bg-background transition-colors"
                >
                  {linkCopied ? "Lien copié !" : "Copier le lien"}
                </button>
                <button
                  onClick={() => {
                    sauvegarderEvaluation({
                      nom: `${selectedResult?.commune.commune || communeSearch} — ${surface} m²`,
                      type: "estimation",
                      commune: selectedResult?.commune.commune,
                      valeurPrincipale: result.estimationCentrale,
                      data: { communeSearch, surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf },
                    });
                    alert("Évaluation sauvegardée !");
                  }}
                  className="rounded-lg border border-card-border px-4 py-2 text-xs font-medium text-muted hover:bg-background transition-colors"
                >
                  Sauvegarder
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted text-center leading-relaxed">
                Estimation indicative basée sur les données publiques de l'Observatoire de l'Habitat
                et les coefficients d'ajustement statistiques. Ne constitue pas une évaluation professionnelle.
                Pour une expertise conforme EVS 2025, utilisez le{" "}
                <a href="/valorisation" className="text-navy font-medium hover:underline">module de valorisation</a>.
              </p>
            </div>
          )}

          {!selectedResult && (
            <div className="text-center py-8 text-muted text-sm">
              Sélectionnez une commune pour obtenir une estimation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
