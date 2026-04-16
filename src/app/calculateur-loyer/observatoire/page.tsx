"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LOYERS_LU_Q4_2025, type LoyerObservation } from "@/lib/loyer-observatoire";
import { formatEUR } from "@/lib/calculations";

const PROPERTY_TYPE_LABELS: Record<LoyerObservation["propertyType"], string> = {
  studio: "Studio",
  "1bed": "1 chambre",
  "2bed": "2 chambres",
  "3bed": "3+ chambres",
  maison: "Maison",
};

const TREND_COLORS: Record<LoyerObservation["trend12m"], { label: string; color: string }> = {
  up: { label: "↗ Hausse", color: "text-rose-700" },
  stable: { label: "→ Stable", color: "text-slate-700" },
  down: { label: "↘ Baisse", color: "text-emerald-700" },
};

export default function ObservatoireLoyers() {
  const [propertyType, setPropertyType] = useState<"all" | LoyerObservation["propertyType"]>("all");
  const [commune, setCommune] = useState<string>("all");

  const communes = useMemo(() => {
    const set = new Set(LOYERS_LU_Q4_2025.map((l) => l.commune));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    return LOYERS_LU_Q4_2025.filter((l) => {
      if (propertyType !== "all" && l.propertyType !== propertyType) return false;
      if (commune !== "all" && l.commune !== commune) return false;
      return true;
    });
  }, [propertyType, commune]);

  const avgRent = filtered.length > 0 ? Math.round(filtered.reduce((s, l) => s + l.rentMedian, 0) / filtered.length) : 0;
  const avgRentM2 = filtered.length > 0 ? Math.round(filtered.reduce((s, l) => s + l.rentPerM2Median, 0) / filtered.length) : 0;
  const totalSamples = filtered.reduce((s, l) => s + l.sampleSize, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/calculateur-loyer" className="text-xs text-muted hover:text-navy">&larr; Calculateur loyer</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Observatoire des loyers Luxembourg (Mietspiegel-like)</h1>
          <p className="mt-2 text-muted">
            Loyers médians observés par commune, zone et typologie au Q4 2025.
            Sources agrégées : Athome Pro, Observatoire de l&apos;Habitat, panel tevaxia.
            Rappel : la règle des 5% (loi 21.09.2006 art. 3) plafonne légalement les loyers au Luxembourg.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select value={commune} onChange={(e) => setCommune(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">Toutes communes</option>
            {communes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as "all" | LoyerObservation["propertyType"])}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">Tous types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Loyer médian filtré</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(avgRent)}/mois</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">€/m² médian</div>
            <div className="mt-1 text-2xl font-bold text-navy">{avgRentM2} €/m²</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Taille échantillon</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalSamples}</div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">Commune / Zone</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Type</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">P25</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Médian</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">P75</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">€/m²</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Surface</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Échant.</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted">Aucune donnée pour ce filtre.</td></tr>
              ) : filtered.map((l, i) => (
                <tr key={i} className="border-b border-card-border/50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-navy">{l.commune}</div>
                    <div className="text-xs text-muted">{l.zone}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{PROPERTY_TYPE_LABELS[l.propertyType]}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(l.rentP25)}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-navy">{formatEUR(l.rentMedian)}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(l.rentP75)}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.rentPerM2Median} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{l.avgSurface} m²</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{l.sampleSize}</td>
                  <td className={`px-4 py-2 text-xs font-semibold ${TREND_COLORS[l.trend12m].color}`}>
                    {TREND_COLORS[l.trend12m].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Important :</strong> les loyers médians ci-dessus sont des <strong>observations de marché</strong>.
          Le plafond légal LU (règle 5% = 5% du capital investi réévalué / 12) peut être inférieur ou supérieur.
          Utilisez{" "}
          <Link href="/calculateur-loyer" className="underline font-semibold">le calculateur règle 5%</Link>
          {" "}pour déterminer votre plafond légal selon votre capital investi.
        </div>
      </div>
    </div>
  );
}
