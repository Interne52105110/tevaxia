"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketDataCommune } from "@/lib/market-data";
import { COMMUNE_COORDS } from "@/lib/communes-coords";
import { formatEUR } from "@/lib/calculations";

// Leaflet est importé dynamiquement côté client uniquement
let L: typeof import("leaflet") | null = null;

function getPriceColor(prix: number | null): string {
  if (!prix) return "#9CA3AF";
  if (prix >= 10000) return "#DC2626";
  if (prix >= 9000) return "#EA580C";
  if (prix >= 8000) return "#D97706";
  if (prix >= 7000) return "#CA8A04";
  if (prix >= 6000) return "#65A30D";
  if (prix >= 5000) return "#16A34A";
  return "#059669";
}

function getRadius(nbTransactions: number | null): number {
  if (!nbTransactions) return 8;
  if (nbTransactions > 200) return 18;
  if (nbTransactions > 100) return 14;
  if (nbTransactions > 50) return 11;
  if (nbTransactions > 20) return 9;
  return 7;
}

type PriceField = "prixM2Existant" | "prixM2VEFA" | "prixM2Annonces";
type ViewMode = PriceField | "rendement";

function computeYield(commune: MarketDataCommune): number | null {
  if (!commune.loyerM2Annonces || !commune.prixM2Existant) return null;
  return (commune.loyerM2Annonces * 12) / commune.prixM2Existant * 100;
}

function getYieldMarkerColor(yieldPct: number | null): string {
  if (yieldPct == null) return "#9CA3AF";
  if (yieldPct >= 4) return "#16A34A"; // green
  if (yieldPct >= 3) return "#D97706"; // amber
  return "#DC2626"; // red
}

interface LeafletMapProps {
  communes: MarketDataCommune[];
  onSelectCommune: (commune: MarketDataCommune) => void;
  selectedCommune?: string;
  priceField?: PriceField;
  viewMode?: ViewMode;
}

export default function LeafletMap({ communes, onSelectCommune, selectedCommune, priceField = "prixM2Existant", viewMode }: LeafletMapProps) {
  const isRendement = viewMode === "rendement";
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Import dynamique Leaflet + CSS
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leaflet]) => {
      L = leaflet.default || leaflet;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !L || !mapRef.current) return;

    // Clean up previous map instance before recreating
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [49.75, 6.15],
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Ajouter les marqueurs
    for (const commune of communes) {
      const coords = COMMUNE_COORDS[commune.commune];
      if (!coords) continue;

      const prix = commune[priceField];
      const yieldPct = computeYield(commune);
      const color = isRendement ? getYieldMarkerColor(yieldPct) : getPriceColor(prix);
      const radius = getRadius(commune.nbTransactions);

      const marker = L.circleMarker(coords, {
        radius,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8,
      }).addTo(map);

      const tooltipContent = isRendement
        ? `<strong>${commune.commune}</strong><br/>${yieldPct != null ? yieldPct.toFixed(2) + " % rendement" : "—"}`
        : `<strong>${commune.commune}</strong><br/>${prix ? formatEUR(prix) + "/m²" : "—"}`;

      marker.bindTooltip(tooltipContent, { direction: "top", offset: [0, -radius] });

      marker.on("click", () => onSelectCommune(commune));
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [ready, communes, onSelectCommune, priceField, isRendement]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl border border-card-border bg-card">
        <p className="text-muted text-sm">Chargement de la carte...</p>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[500px] rounded-xl border border-card-border shadow-sm" />;
}
