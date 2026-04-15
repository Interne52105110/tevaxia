"use client";

import { formatEUR } from "@/lib/calculations";
import type { AssetType } from "@/lib/asset-types";
import {
  OFFICE_SUBMARKETS, OFFICE_MARKET_SUMMARY,
  RETAIL_LOCATIONS, RETAIL_MARKET_SUMMARY,
  LOGISTICS_ZONES, LOGISTICS_MARKET_SUMMARY,
  HOTEL_MARKET,
  LAND_PRICES, LAND_MARKET_SUMMARY,
  HOUSES_MARKET,
  MACRO_DATA,
} from "@/lib/market-data-commercial";

function SourceLinks({ sources }: { sources: { nom: string; url: string; frequence: string; gratuit: boolean }[] }) {
  return (
    <div className="mt-3 space-y-1">
      <div className="text-[10px] font-semibold text-navy uppercase tracking-wider">Sources</div>
      {sources.map((s) => (
        <a key={s.nom} href={s.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-muted hover:text-navy transition-colors">
          <span className="rounded bg-navy/10 px-1 py-0.5 text-[9px] font-medium text-navy">{s.frequence}</span>
          <span>{s.nom}</span>
          {!s.gratuit && <span className="text-warning">(payant)</span>}
        </a>
      ))}
    </div>
  );
}

function OfficePanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-navy/5 p-2 text-center">
          <div className="text-[10px] text-muted">Rendement prime</div>
          <div className="text-lg font-bold text-navy">{OFFICE_MARKET_SUMMARY.yieldPrime}%</div>
        </div>
        <div className="rounded-lg bg-navy/5 p-2 text-center">
          <div className="text-[10px] text-muted">Vacance globale</div>
          <div className="text-lg font-bold text-navy">{OFFICE_MARKET_SUMMARY.vacanceGlobale}%</div>
        </div>
        <div className="rounded-lg bg-navy/5 p-2 text-center">
          <div className="text-[10px] text-muted">Surfaces louées {OFFICE_MARKET_SUMMARY.periode}</div>
          <div className="text-lg font-bold text-navy">{(OFFICE_MARKET_SUMMARY.takeUpAnnuel / 1000).toFixed(0)}k m²</div>
          <div className="text-[9px] text-success">{OFFICE_MARKET_SUMMARY.takeUpEvolution}</div>
        </div>
        <div className="rounded-lg bg-navy/5 p-2 text-center">
          <div className="text-[10px] text-muted">En construction</div>
          <div className="text-lg font-bold text-navy">{(OFFICE_MARKET_SUMMARY.pipelineEnConstruction / 1000).toFixed(0)}k m²</div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-2 py-2 text-left font-semibold text-navy">Sous-marché</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Prime €/m²/mois</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Moyen</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Vacance</th>
              <th className="px-2 py-2 text-center font-semibold text-navy">Tend.</th>
              <th className="px-2 py-2 text-left font-semibold text-navy hidden sm:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {OFFICE_SUBMARKETS.map((s) => (
              <tr key={s.nom} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-2 py-1.5 font-medium">{s.nom}</td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold">{s.loyerPrime} €</td>
                <td className="px-2 py-1.5 text-right font-mono text-muted">{s.loyerMoyen} €</td>
                <td className="px-2 py-1.5 text-right font-mono">{s.vacance}%</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${s.tendance === "hausse" ? "bg-green-100 text-green-700" : s.tendance === "baisse" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{s.tendance}</span>
                </td>
                <td className="px-2 py-1.5 text-muted hidden sm:table-cell">{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLinks sources={OFFICE_MARKET_SUMMARY.sources} />
    </div>
  );
}

function RetailPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gold/10 p-2 text-center">
          <div className="text-[10px] text-muted">Rendement prime</div>
          <div className="text-lg font-bold text-gold-dark">{RETAIL_MARKET_SUMMARY.yieldPrime}%</div>
        </div>
        <div className="rounded-lg bg-gold/10 p-2 text-center">
          <div className="text-[10px] text-muted">Poids du loyer / chiffre d&apos;affaires</div>
          <div className="text-lg font-bold text-gold-dark">{RETAIL_MARKET_SUMMARY.tauxEffortMoyen}</div>
          <div className="text-[9px] text-muted">Loyer / CA locataire</div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-2 py-2 text-left font-semibold text-navy">Emplacement</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Type</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Prime €/m²/mois</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Moyen</th>
              <th className="px-2 py-2 text-center font-semibold text-navy">Tend.</th>
            </tr>
          </thead>
          <tbody>
            {RETAIL_LOCATIONS.map((r) => (
              <tr key={r.nom} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-2 py-1.5 font-medium">{r.nom}</td>
                <td className="px-2 py-1.5 text-right text-muted">{r.type === "high_street" ? "Pied d'immeuble" : r.type === "centre_commercial" ? "Centre co." : "Retail park"}</td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold">{r.loyerPrime} €</td>
                <td className="px-2 py-1.5 text-right font-mono text-muted">{r.loyerMoyen} €</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${r.tendance === "hausse" ? "bg-green-100 text-green-700" : r.tendance === "baisse" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{r.tendance}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLinks sources={RETAIL_MARKET_SUMMARY.sources} />
    </div>
  );
}

function LogisticsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-teal/10 p-2 text-center">
          <div className="text-[10px] text-muted">Rendement prime</div>
          <div className="text-lg font-bold text-teal">{LOGISTICS_MARKET_SUMMARY.yieldPrime}%</div>
        </div>
        <div className="rounded-lg bg-teal/10 p-2 text-center">
          <div className="text-[10px] text-muted">Stock total</div>
          <div className="text-lg font-bold text-teal">{LOGISTICS_MARKET_SUMMARY.stockTotal}</div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-2 py-2 text-left font-semibold text-navy">Zone</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Loyer €/m²/mois</th>
              <th className="px-2 py-2 text-center font-semibold text-navy">Tend.</th>
              <th className="px-2 py-2 text-left font-semibold text-navy hidden sm:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {LOGISTICS_ZONES.map((z) => (
              <tr key={z.nom} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-2 py-1.5 font-medium">{z.nom}</td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold">{z.loyerMin}–{z.loyerMax} €</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${z.tendance === "hausse" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{z.tendance}</span>
                </td>
                <td className="px-2 py-1.5 text-muted hidden sm:table-cell">{z.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLinks sources={LOGISTICS_MARKET_SUMMARY.sources} />
    </div>
  );
}

function HotelPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <div className="text-[10px] text-muted">Nuitées/an</div>
          <div className="text-lg font-bold text-purple-700">{(HOTEL_MARKET.nuiteesAnnuelles / 1_000_000).toFixed(1)}M</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <div className="text-[10px] text-muted">Taux d&apos;occupation (est.)</div>
          <div className="text-lg font-bold text-purple-700">{HOTEL_MARKET.occupancyEstimee}</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <div className="text-[10px] text-muted">Prix moyen / nuit (est.)</div>
          <div className="text-lg font-bold text-purple-700">{HOTEL_MARKET.adrEstimee}</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <div className="text-[10px] text-muted">Rendement (est.)</div>
          <div className="text-lg font-bold text-purple-700">{HOTEL_MARKET.yieldEstimee}</div>
        </div>
      </div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Données limitées :</strong> {HOTEL_MARKET.note}
        </p>
      </div>
      <div className="text-xs text-muted space-y-1">
        <div>{HOTEL_MARKET.nbEtablissements} établissements — {HOTEL_MARKET.segmentation}</div>
        <div>Prix par chambre (investissement) : {formatEUR(HOTEL_MARKET.prixParChambre.min)} – {formatEUR(HOTEL_MARKET.prixParChambre.max)}</div>
      </div>
      <SourceLinks sources={HOTEL_MARKET.sources} />
    </div>
  );
}

function LandPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-50 p-2 text-center">
          <div className="text-[10px] text-muted">Ventes 2024</div>
          <div className="text-lg font-bold text-emerald-700">{LAND_MARKET_SUMMARY.nbVentes2024}</div>
          <div className="text-[9px] text-muted">vs {LAND_MARKET_SUMMARY.nbVentes2023} en 2023</div>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 text-center">
          <div className="text-[10px] text-muted">Tendance prix</div>
          <div className="text-sm font-bold text-error">-14.9%</div>
          <div className="text-[9px] text-muted">depuis 2022</div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-2 py-2 text-left font-semibold text-navy">Zone</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">€/m²</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">€/are</th>
              <th className="px-2 py-2 text-right font-semibold text-navy">Évolution</th>
            </tr>
          </thead>
          <tbody>
            {LAND_PRICES.map((z) => (
              <tr key={z.zone} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-2 py-1.5 font-medium">{z.zone}</td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold">{formatEUR(z.prixM2)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-muted">{formatEUR(z.prixMedianAre)}</td>
                <td className="px-2 py-1.5 text-right text-error">{z.evolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLinks sources={LAND_MARKET_SUMMARY.sources} />
    </div>
  );
}

function HousesPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Données limitées :</strong> {HOUSES_MARKET.note}
        </p>
      </div>
      <div className="text-xs text-muted space-y-1">
        <div>HPI maisons existantes : {HOUSES_MARKET.hpiEvolution}</div>
        <div>Rendement locatif brut estimé : {HOUSES_MARKET.rendementEstime}</div>
      </div>
      <SourceLinks sources={HOUSES_MARKET.sources} />
    </div>
  );
}

function MacroPanel() {
  return (
    <div className="rounded-lg border border-card-border bg-card p-3 shadow-sm">
      <div className="text-xs font-semibold text-navy mb-2">Données macro</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
        <div><span className="text-slate font-medium">Taux hypo.</span> {MACRO_DATA.tauxHypothecaire.taux}% <span className="text-[9px]">({MACRO_DATA.tauxHypothecaire.date})</span></div>
        <div><span className="text-slate font-medium">Coûts constr.</span> {MACRO_DATA.indiceCoutConstruction.evolution}</div>
        <div><span className="text-slate font-medium">Rdt rés. brut</span> {MACRO_DATA.rendementLocatifResidentiel.brut}</div>
        <div><span className="text-slate font-medium">Invest. CRE</span> {formatEUR(MACRO_DATA.investissementCRE2025.total)}</div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL — sélection par type d'actif
// ============================================================

export default function MarketDataPanel({ assetType }: { assetType: AssetType }) {
  return (
    <div className="space-y-4">
      <MacroPanel />
      {(assetType === "office") && <OfficePanel />}
      {(assetType === "retail") && <RetailPanel />}
      {(assetType === "residential_building") && <><HousesPanel /><RetailPanel /></>}
      {(assetType === "logistics") && <LogisticsPanel />}
      {(assetType === "hotel") && <HotelPanel />}
      {(assetType === "land") && <LandPanel />}
      {(assetType === "residential_house") && <HousesPanel />}
    </div>
  );
}
