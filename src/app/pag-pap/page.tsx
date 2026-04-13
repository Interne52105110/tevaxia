"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { ZONES_PAG, PAP_TYPES } from "@/lib/pag-pap";
import dynamic from "next/dynamic";
import { COMMUNE_COORDS } from "@/lib/communes-coords";
import SEOContent from "@/components/SEOContent";

const PAGMap = dynamic(() => import("@/components/PAGMap"), { ssr: false });

// Liens Geoportail par commune (PAG consultable en ligne)
function getGeoportailUrl(commune: string): string {
  return `https://map.geoportail.lu/theme/main?lang=fr&layers=302&bgLayer=basemap_2015_global&zoom=17&search=${encodeURIComponent(commune)}`;
}

export default function PagPap() {
  const t = useTranslations("pagPap");
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
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {[
            { id: "recherche" as const, label: t("tabSearch") },
            { id: "zones" as const, label: t("tabZones") },
            { id: "pap" as const, label: t("tabPap") },
            { id: "servitudes" as const, label: t("tabServitudes") },
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
                <h2 className="mb-4 text-base font-semibold text-navy">{t("searchCommune")}</h2>
                <div className="relative">
                  <input type="text" value={communeSearch}
                    onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                    placeholder={t("searchPlaceholder")}
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
                      <p className="text-xs text-muted mt-1">{t("canton", { name: selectedResult.commune.canton })}</p>
                      {selectedResult.commune.prixM2Existant && (
                        <p className="text-xs text-muted mt-1">{t("averagePrice", { price: formatEUR(selectedResult.commune.prixM2Existant) })}</p>
                      )}
                    </div>
                    <a href={getGeoportailUrl(selectedResult.commune.commune)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      {t("viewGeoportail")}
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
                <h2 className="mb-4 text-base font-semibold text-navy">{t("buildabilityCalculator")}</h2>
                <div className="space-y-4">
                  <InputField label={t("landArea")} value={surfaceTerrain} onChange={(v) => setSurfaceTerrain(Number(v))} suffix="m²" />
                  <InputField label={t("pagZone")} type="select" value={selectedZoneCode} onChange={setSelectedZoneCode}
                    options={ZONES_PAG.filter((z) => z.constructible).map((z) => ({ value: z.code, label: `${z.code} — ${z.nom}` }))} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {selectedZone && selectedZone.constructible && (
                <>
                  <ResultPanel title={t("estimatedBuildingRights")} lines={[
                    { label: t("zone", { code: selectedZone.code }), value: selectedZone.nom },
                    { label: t("cos"), value: selectedZone.cosTypique, sub: true },
                    { label: t("cmu"), value: selectedZone.cmuTypique, sub: true },
                    { label: t("maxHeight"), value: selectedZone.hauteurMax, sub: true },
                    { label: t("groundFootprint"), value: `${Math.round(surfaceAuSolMin)} – ${Math.round(surfaceAuSolMax)} m²`, highlight: true },
                    { label: t("grossFloorArea"), value: `${Math.round(surfaceBruteMin)} – ${Math.round(surfaceBruteMax)} m²`, highlight: true, large: true },
                  ]} />

                  <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-3">{t("permittedUses", { code: selectedZone.code })}</h3>
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
                    <p className="text-xs text-amber-800 mt-1"><strong>{t("servitudesLabel")}</strong> {selectedZone.servitudes}</p>
                  </div>
                </>
              )}

              {selectedZone && !selectedZone.constructible && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
                  <h3 className="text-lg font-bold text-red-700">{t("nonBuildableZone")}</h3>
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
                  <th className="px-4 py-3 text-left font-semibold text-navy">{t("thZone")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">{t("thDescription")}</th>
                  <th className="px-4 py-3 text-center font-semibold text-navy">{t("thBuildable")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">{t("thCos")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">{t("thCmu")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy">{t("thMaxHeight")}</th>
                </tr>
              </thead>
              <tbody>
                {ZONES_PAG.map((zone) => (
                  <tr key={zone.code} className="border-b border-card-border/50 hover:bg-background/50">
                    <td className="px-4 py-2 font-medium text-navy">{zone.code}<br/><span className="text-xs text-muted font-normal">{zone.nom}</span></td>
                    <td className="px-4 py-2 text-xs text-muted max-w-xs">{zone.description}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${zone.constructible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {zone.constructible ? t("yes") : t("no")}
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
                <h3 className="mt-4 text-xs font-semibold text-navy uppercase tracking-wider">{t("procedure")}</h3>
                <ol className="mt-2 space-y-1">
                  {pap.procedure.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 text-xs text-muted">{t("typicalDelay")} <strong className="text-slate">{pap.delaiTypique}</strong></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "servitudes" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-4">{t("servitudesTitle")}</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">{t("ctvTitle")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("ctvDescription")}</p>
                  <p className="mt-2 text-sm text-error font-medium">{t("ctvSanction")}</p>
                </div>
                <div className="rounded-lg bg-navy/5 p-5">
                  <h3 className="text-base font-semibold text-navy">{t("ctlTitle")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("ctlDescription")}</p>
                  <p className="mt-2 text-sm text-error font-medium">{t("ctlSanction")}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800"><strong>{t("valueImpactLabel")}</strong> {t("valueImpactText")}</p>
              </div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-3">{t("resources")}</h2>
              <div className="space-y-2 text-sm">
                <a href="https://map.geoportail.lu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">{t("resourceMap")}</span> {t("resourceGeoportail")}
                </a>
                <a href="https://logement.public.lu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy hover:underline">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-xs">{t("resourceLaw")}</span> {t("resourceMinistry")}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    <SEOContent
      ns="pagPap"
      sections={[
        { titleKey: "urbanismeTitle", contentKey: "urbanismeContent" },
        { titleKey: "zonesTitle", contentKey: "zonesContent" },
        { titleKey: "constructibiliteTitle", contentKey: "constructibiliteContent" },
        { titleKey: "servitudesTitle", contentKey: "servitudesContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
      ]}
      relatedLinks={[
        { href: "/terres-agricoles", labelKey: "terresAgricoles" },
        { href: "/estimation", labelKey: "estimation" },
        { href: "/marche", labelKey: "marche" },
      ]}
    />
    </>
  );
}
