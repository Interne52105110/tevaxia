"use client";

import { useEffect, useRef, useState } from "react";

let L: typeof import("leaflet") | null = null;

interface PAGMapProps {
  commune?: string;
  center?: [number, number];
}

export default function PAGMap({ commune, center }: PAGMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [showPAG, setShowPAG] = useState(true);

  useEffect(() => {
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

    // Cleanup previous
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
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

    // PAG WMS layer from Geoportail.lu
    if (showPAG) {
      L.tileLayer.wms("https://wmts1.geoportail.lu/opendata/service", {
        layers: "302", // PAG layer
        format: "image/png",
        transparent: true,
        attribution: '&copy; <a href="https://www.geoportail.lu">Geoportail.lu</a> (ACT)',
        opacity: 0.6,
      } as L.WMSOptions).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [ready, center, showPAG]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-xl border border-card-border bg-card">
        <p className="text-muted text-sm">Chargement de la carte PAG...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">
          {commune ? `PAG de ${commune}` : "Plan d'Aménagement Général — Luxembourg"}
        </p>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={showPAG} onChange={(e) => setShowPAG(e.target.checked)} className="rounded" />
          Calque PAG
        </label>
      </div>
      <div ref={mapRef} className="h-[400px] rounded-xl border border-card-border shadow-sm" />
      <p className="mt-1 text-[10px] text-muted">Source : Geoportail.lu (ACT) — Plan cadastral numérisé, calque PAG. Données indicatives.</p>
    </div>
  );
}
