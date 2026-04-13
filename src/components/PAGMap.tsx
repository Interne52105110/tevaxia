"use client";

import { useEffect, useRef, useState } from "react";
import { getGeoportailWMSUrl, buildGeoportailViewerUrl } from "@/lib/geoportail";

let L: typeof import("leaflet") | null = null;

interface PAGMapProps {
  commune?: string;
  center?: [number, number];
  /** Translation labels — optional, defaults to French */
  labels?: {
    pagLayer?: string;
    cadastreLayer?: string;
    viewOnGeoportail?: string;
    sourceNote?: string;
    loading?: string;
  };
}

export default function PAGMap({ commune, center, labels }: PAGMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pagLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const cadastreLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const [ready, setReady] = useState(false);
  const [showPAG, setShowPAG] = useState(true);
  const [showCadastre, setShowCadastre] = useState(false);

  const pagLabel = labels?.pagLayer ?? "PAG";
  const cadastreLabel = labels?.cadastreLayer ?? "Cadastre";
  const viewGeoportailLabel = labels?.viewOnGeoportail ?? "Voir sur Geoportail.lu";
  const sourceNote = labels?.sourceNote ?? "Source : Geoportail.lu (ACT) — Plan cadastral numerise, calque PAG. Donnees indicatives.";
  const loadingLabel = labels?.loading ?? "Chargement de la carte PAG...";

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([leaflet]) => {
      L = leaflet.default || leaflet;
      setReady(true);
    });
  }, []);

  // Create / destroy map when center changes
  useEffect(() => {
    if (!ready || !L || !mapRef.current) return;

    // Cleanup previous
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      pagLayerRef.current = null;
      cadastreLayerRef.current = null;
    }

    const defaultCenter: [number, number] = center || [49.6117, 6.1300];

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: center ? 15 : 10,
      zoomControl: true,
    });

    // Base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      pagLayerRef.current = null;
      cadastreLayerRef.current = null;
    };
  }, [ready, center]);

  // PAG overlay management
  useEffect(() => {
    if (!ready || !L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (showPAG && !pagLayerRef.current) {
      try {
        const { url, options } = getGeoportailWMSUrl("pag");
        pagLayerRef.current = L.tileLayer.wms(url, {
          ...options,
          maxZoom: 20,
        } as L.WMSOptions).addTo(map);
      } catch {
        // Graceful degradation
      }
    } else if (!showPAG && pagLayerRef.current) {
      map.removeLayer(pagLayerRef.current);
      pagLayerRef.current = null;
    }
  }, [ready, showPAG]);

  // Cadastre overlay management
  useEffect(() => {
    if (!ready || !L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (showCadastre && !cadastreLayerRef.current) {
      try {
        const { url, options } = getGeoportailWMSUrl("cadastre");
        cadastreLayerRef.current = L.tileLayer.wms(url, {
          ...options,
          maxZoom: 20,
        } as L.WMSOptions).addTo(map);
      } catch {
        // Graceful degradation
      }
    } else if (!showCadastre && cadastreLayerRef.current) {
      map.removeLayer(cadastreLayerRef.current);
      cadastreLayerRef.current = null;
    }
  }, [ready, showCadastre]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-xl border border-card-border bg-card">
        <p className="text-muted text-sm">{loadingLabel}</p>
      </div>
    );
  }

  const geoportailUrl = commune
    ? buildGeoportailViewerUrl(commune, {
        lat: center?.[0],
        lon: center?.[1],
      })
    : "https://map.geoportail.lu";

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-xs text-muted">
          {commune ? `PAG — ${commune}` : "Plan d'Amenagement General — Luxembourg"}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
            <input type="checkbox" checked={showPAG} onChange={(e) => setShowPAG(e.target.checked)} className="rounded" />
            {pagLabel}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
            <input type="checkbox" checked={showCadastre} onChange={(e) => setShowCadastre(e.target.checked)} className="rounded" />
            {cadastreLabel}
          </label>
        </div>
      </div>
      <div ref={mapRef} className="h-[400px] rounded-xl border border-card-border shadow-sm" />
      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] text-muted">{sourceNote}</p>
        <a
          href={geoportailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/10 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          {viewGeoportailLabel}
        </a>
      </div>
    </div>
  );
}
