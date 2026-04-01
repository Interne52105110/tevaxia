"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { calculerCommunaute, type CommunauteResponse } from "@/lib/energy-api";

const PRODUCTION_KWH_PAR_KWC = 920;
const TAUX_AUTOCONSO_BASE = 0.40;
const FACTEUR_FOISONNEMENT = 0.025;
const TARIF_RACHAT_SURPLUS = 0.07;
const CO2_FACTEUR = 300;

function fallbackLocal(nb: number, pv: number, conso: number, tr: number, tp: number): CommunauteResponse {
  const productionAnnuelle = Math.round(pv * PRODUCTION_KWH_PAR_KWC);
  const consoTotale = Math.round(nb * conso);
  const tauxAutoConso = Math.min(0.85, TAUX_AUTOCONSO_BASE + (nb - 1) * FACTEUR_FOISONNEMENT);
  const energieDisponible = Math.min(productionAnnuelle, consoTotale);
  const energieAutoconsommee = Math.round(energieDisponible * tauxAutoConso);
  const surplus = productionAnnuelle - energieAutoconsommee;
  const econAutoC = energieAutoconsommee * (tr - tp);
  const revenuSurplus = surplus * TARIF_RACHAT_SURPLUS;
  const economieTotale = Math.round(econAutoC + revenuSurplus);
  return {
    productionAnnuelle, consoTotale,
    tauxCouverturePct: consoTotale > 0 ? Math.round(productionAnnuelle * 1000 / consoTotale) / 10 : 0,
    tauxAutoConsoPct: Math.round(tauxAutoConso * 1000) / 10,
    energieAutoconsommee, surplus,
    economieTotale, economieParParticipant: Math.round(economieTotale / nb),
    revenuSurplus: Math.round(revenuSurplus),
    co2EviteKg: Math.round(energieAutoconsommee * CO2_FACTEUR / 1000),
    parametres: { productionParKwc: PRODUCTION_KWH_PAR_KWC, tauxAutoConsoBase: TAUX_AUTOCONSO_BASE, facteurFoisonnement: FACTEUR_FOISONNEMENT, tarifRachatSurplus: TARIF_RACHAT_SURPLUS, co2Facteur: CO2_FACTEUR },
  };
}

function fmt(n: number, dec = 0): string { return n.toLocaleString("fr-LU", { maximumFractionDigits: dec }); }

export default function CommunautePage() {
  const t = useTranslations("energy.communaute");
  const [nbParticipants, setNbParticipants] = useState(6);
  const [puissancePV, setPuissancePV] = useState(30);
  const [consoMoyenne, setConsoMoyenne] = useState(4500);
  const [tarifReseau, setTarifReseau] = useState(0.28);
  const [tarifPartage, setTarifPartage] = useState(0.15);
  const [result, setResult] = useState<CommunauteResponse>(fallbackLocal(6, 30, 4500, 0.28, 0.15));
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const compute = useCallback(async (nb: number, pv: number, c: number, tr: number, tp: number) => {
    try {
      const data = await calculerCommunaute({ nbParticipants: nb, puissancePV: pv, consoMoyenneParParticipant: c, tarifReseau: tr, tarifPartage: tp });
      setResult(data); setApiOk(true);
    } catch { setResult(fallbackLocal(nb, pv, c, tr, tp)); setApiOk(false); }
  }, []);

  useEffect(() => { compute(nbParticipants, puissancePV, consoMoyenne, tarifReseau, tarifPartage); },
    [nbParticipants, puissancePV, consoMoyenne, tarifReseau, tarifPartage, compute]);

  const params = result.parametres;

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("description")}</p>
          {apiOk === false && <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">{t("localFallback")}</div>}
          {apiOk === true && <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-energy bg-energy/5 border border-energy/20 rounded-lg px-3 py-1">{t("apiConnected")}</div>}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("nbParticipants")}</label>
              <input type="number" value={nbParticipants} onChange={(e) => setNbParticipants(Math.max(2, Number(e.target.value)))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={2} max={50} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("puissancePV")}</label>
              <input type="number" value={puissancePV} onChange={(e) => setPuissancePV(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={1} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("consoMoyenne")}</label>
              <input type="number" value={consoMoyenne} onChange={(e) => setConsoMoyenne(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={1000} max={20000} step={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("tarifReseau")}</label>
              <div className="relative">
                <input type="number" value={tarifReseau} onChange={(e) => setTarifReseau(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-16 text-foreground" min={0.1} max={1} step={0.01} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">€/kWh</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("tarifPartage")}</label>
              <div className="relative">
                <input type="number" value={tarifPartage} onChange={(e) => setTarifPartage(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-16 text-foreground" min={0.01} max={0.5} step={0.01} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">€/kWh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("productionAnnuelle")}</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{fmt(result.productionAnnuelle)} kWh</div>
              <div className="mt-1 text-xs text-muted">{puissancePV} kWc × {params.productionParKwc} kWh/kWc</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("tauxAutoconso")}</div>
              <div className="mt-1 text-2xl font-bold text-energy">{result.tauxAutoConsoPct}%</div>
              <div className="mt-1 text-xs text-muted">{fmt(result.energieAutoconsommee)} kWh {t("autoconsommes")}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("economieTotale")}</div>
              <div className="mt-1 text-2xl font-bold text-green-600">{fmt(result.economieTotale)} €/an</div>
              <div className="mt-1 text-xs text-muted">{t("economieParticipant")} : {fmt(result.economieParParticipant)} €/an</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("co2Evite")}</div>
              <div className="mt-1 text-2xl font-bold text-energy">{fmt(result.co2EviteKg)} kg/an</div>
              <div className="mt-1 text-xs text-muted">{(result.co2EviteKg / 1000).toFixed(1)} {t("tonnesCO2")}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
              <h2 className="font-semibold text-foreground">{t("resultTitle")}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{t("prodVsConso")}</span>
                  <span className="font-mono text-foreground">{fmt(result.productionAnnuelle)} / {fmt(result.consoTotale)} kWh</span>
                </div>
                <div className="h-4 rounded-full bg-gray-200 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-energy rounded-full" style={{ width: `${Math.min(100, result.tauxCouverturePct)}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted">{t("couverture", { pct: String(result.tauxCouverturePct) })}</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{t("autoVsSurplus")}</span>
                  <span className="font-mono text-foreground">{fmt(result.energieAutoconsommee)} / {fmt(result.surplus)} kWh</span>
                </div>
                <div className="h-4 rounded-full bg-amber-200 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-energy rounded-full" style={{ width: `${result.tauxAutoConsoPct}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{t("autoconsomme", { pct: String(result.tauxAutoConsoPct) })}</span>
                  <span>{t("surplusRevendu")} : {fmt(result.revenuSurplus)} €/an</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-card-border">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("economieAutoconso")}</span>
                    <span className="font-mono font-semibold">{fmt(result.economieTotale - result.revenuSurplus)} €/an</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("revenuSurplusReseau")}</span>
                    <span className="font-mono font-semibold">{fmt(result.revenuSurplus)} €/an</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-energy/20 bg-energy/5 p-5">
            <h3 className="font-medium text-foreground text-sm mb-2">{t("parametresModele")}</h3>
            <ul className="text-xs text-muted space-y-1">
              <li>{t("paramProduction", { val: String(params.productionParKwc) })}</li>
              <li>{t("paramAutoconso", { base: String((params.tauxAutoConsoBase * 100).toFixed(0)), foisonnement: String((params.facteurFoisonnement * 100).toFixed(1)) })}</li>
              <li>{t("paramRachat", { val: String(params.tarifRachatSurplus) })}</li>
              <li>{t("paramCO2", { val: String(params.co2Facteur) })}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
