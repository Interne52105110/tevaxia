"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { ZONES_PAG, PAP_TYPES } from "@/lib/pag-pap";
import dynamic from "next/dynamic";
import { COMMUNE_COORDS } from "@/lib/communes-coords";

const PAGMap = dynamic(() => import("@/components/PAGMap"), { ssr: false });

// Liens Geoportail par commune (PAG consultable en ligne)
function getGeoportailUrl(commune: string): string {
  return `https://map.geoportail.lu/theme/main?lang=fr&layers=302&bgLayer=basemap_2015_global&zoom=17&search=${encodeURIComponent(commune)}`;
}

export default function PagPap() {
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [selectedZoneCode, setSelectedZoneCode] = useState("HAB-2");
  const [surfaceTerrain, setSurfaceTerrain] = useState(500);
  const [activeTab, setActiveTab] = useState<"recherche" | "zones" | "pap" | "servitudes">("recherche");

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedZone = ZONES_PAG.find((z) => z.code === selectedZoneCode);

  // Calculateur COS/CMU
  const cosMin = selectedZone?.cosTypique?.split(" - ")[0] || "0";
  const cosMax = selectedZone?.cosTypique?.split(" - ")[1] || cosMin;
  const cmuMin = selectedZone?.cmuTypique?.split(" - ")[0] || "0";
  const cmuMax = selectedZone?.cmuTypique?.split(" - ")[1] || cmuMin;
  const surfaceAuSolMin = surfaceTerrain * parseFloat(cosMin);
  const surfaceAuSolMax = surfaceTerrain * parseFloat(cosMax);
  const surfaceBruteMin = surfaceTerrain * parseFloat(cmuMin);
  const surfaceBruteMax = surfaceTerrain * parseFloat(cmuMax);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Urbanisme — PAG / PAP</h1>
          <p className="mt-2 text-muted">Recherche par commune, zones, constructibilité, procédures</p>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {[
            { id: "recherche" as const, label: "Recherche commune" },
            { id: "zones" as const, label: "Zones PAG" },
            { id: "pap" as const, label: "PAP (NQ / QE)" },
            { id: "servitudes" as const, label: "Servitudes & Délais" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-navy text-white shadow-sm" : "text-muted hover:bg-background hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "recherche" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              {/* Recherche commune */}
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-navy">Rechercher une commune</h2>
                <div className="relative">
                  <input type="text" value={communeSearch}
                    onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                    placeholder="Commune ou localité..."
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button key={r.commune.commune + r.matchedOn}
                          onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors">
                          <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                          {r.isLocalite && <span className="text-muted ml-1">— {r.commune.commune}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedResult && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-navy/5 p-4">
                      <h3 className="text-sm font-semibold text-navy">{selectedResult.commune.commune}</h3>
                      <p className="text-xs text-muted mt-1">Canton de {selectedResult.commune.canton}</p>
                      {selectedResult.commune.prixM2Existant && (
                        <p className="text-xs text-muted mt-1">Prix moyen : {formatEUR(selectedResult.commune.prixM2Existant)}/m²</p>
                      )}
                    </div>
                    <a href={getGeoportailUrl(selectedResult.commune.commune)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      Voir sur Geoportail.lu (détail parcellaire)
                    </a>

                    {/* Carte PAG embarquée */}
                    <PAGMap
                      commune={selectedResult.commune.commune}
                      center={COMMUNE_COORDS[selectedResult.commune.commune]}
                    />
                  </div>
                )}
              </div>

              {/* Calculateur COS/CMU */}
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-navy">Calculateur de constructibilité</h2>
                <div className="space-y-4">
                  <InputField label="Surface du terrain" value={surfaceTerrain} onChange={(v) => setSurfaceTerrain(Number(v))} suffix="m²" />
                  <InputField label="Zone PAG" type="select" value={selectedZoneCode} onChange={setSelectedZoneCode}
                    options={ZONES_PAG.filter((z) => z.constructible).map((z) => ({ value: z.code, label: `${z.code} — ${z.nom}` }))} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {selectedZone && selectedZone.constructible && (
                <>
                  <ResultPanel title="Droits à construire estimés" lines={[
                    { label: `Zone ${selectedZone.code}`, value: selectedZone.nom },
                    { label: "COS (emprise au sol)", value: selectedZone.cosTypique, sub: true },
                    { label: "CMU (surface brute)", value: selectedZone.cmuTypique, sub: true },
                    { label: "Hauteur max", value: selectedZone.hauteurMax, sub: true },
                    { label: "Surface au sol constructible", value: `${Math.round(surfaceAuSolMin)} – ${Math.round(surfaceAuSolMax)} m²`, highlight: true },
                    { label: "Surface brute constructible (tous niveaux)", value: `${Math.round(surfaceBruteMin)} – ${Math.round(surfaceBruteMax)} m²`, highlight: true, large: true },
                  ]} />

                  <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-3">Usages permis — {selectedZone.code}</h3>
                    <ul className="space-y-1">
                      {selectedZone.usagesPermis.map((u) => (
                        <li key={u} className="flex items-start gap-2 text-sm text-slate">
                          <svg className="h-4 w-4 shrink-0 text-success mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">{selectedZone.observations}</p>
                    <p className="text-xs text-amber-800 mt-1"><strong>Servitudes :</strong> {selectedZone.servitudes}</p>
                  </div>
                </>
              )}

              {selectedZone && !selectedZone.constructible && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
                  <h3 className="text-lg font-bold text-red-700">Zone non constructible</h3>
                  <p className="mt-2 text-sm text-red-600">{selectedZone.description}</p>
                  <p className="mt-2 text-xs text-red-500">{selectedZone.observations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "zones" && (
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-4 py-3 text-left font-semibold text-navy">Zone</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Description</th>
                  <th className="px-4 py-3 text-center font-semibold text-navy">Constructible</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">COS</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">CMU</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">Hauteur max</th>
                </tr>
              </thead>
              <tbody>
                {ZONES_PAG.map((zone) => (
                  <tr key={zone.code} className="border-b border-card-border/50 hover:bg-background/50">
                    <td className="px-4 py-2 font-medium text-navy">{zone.code}<br/><span className="text-xs text-muted font-normal">{zone.nom}</span></td>
                    <td className="px-4 py-2 text-xs text-muted max-w-xs">{zone.description}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${zone.constructible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {zone.constructible ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{zone.cosTypique}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{zone.cmuTypique}</td>
                    <td className="px-4 py-2 text-right text-xs">{zone.hauteurMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "pap" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {PAP_TYPES.map((pap) => (
              <div key={pap.type} className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${pap.type === "NQ" ? "bg-navy/10 text-navy" : "bg-gold/20 text-gold-dark"}`}>PAP {pap.type}</span>
                <h2 className="mt-3 text-lg font-bold text-navy">{pap.nom}</h2>
                <p className="mt-1 text-sm text-muted">{pap.description}</p>
                <h3 className="mt-4 text-xs font-semibold text-navy uppercase tracking-wider">Procédure</h3>
                <ol className="mt-2 space-y-1">
                  {pap.procedure.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 text-xs text-muted">Délai typique : <strong className="text-slate">{pap.delaiTypique}</strong></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "servitudes" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-4">Servitudes de viabilisation et de construction</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">CTV — Servitude de viabilisation</h3>
                  <p className="mt-2 text-sm text-muted">Délai de <strong className="text-slate">6 ans</strong> pour viabiliser le terrain à compter de l'entrée en vigueur du PAG.</p>
                  <p className="mt-2 text-sm text-error font-medium">Sanction : reclassement automatique en zone non constructible.</p>
                </div>
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">CTL — Servitude de construction</h3>
                  <p className="mt-2 text-sm text-muted">Délai de <strong className="text-slate">3 ans</strong> après viabilisation pour commencer les travaux.</p>
                  <p className="mt-2 text-sm text-error font-medium">Sanction : reclassement automatique en zone non constructible.</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800"><strong>Impact sur la valeur :</strong> Un terrain proche de l'expiration CTV/CTL subit une forte décote. Vérifier systématiquement les délais restants.</p>
              </div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-3">Ressources</h2>
              <div className="space-y-2 text-sm">
                <a href="https://map.geoportail.lu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">Carte</span> Geoportail.lu — PAG en ligne
                </a>
                <a href="https://logement.public.lu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">Loi</span> Ministère du Logement
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
