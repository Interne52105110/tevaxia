// Luxembourg Geoportail API utilities
// Public APIs — no API key required
// Reference: https://www.geoportail.lu

// ---------------------------------------------------------------------------
// WMS / WMTS layer definitions
// ---------------------------------------------------------------------------

export interface GeoportailLayer {
  id: string;
  label: string;
  wmsUrl: string;
  layers: string;
  format: string;
  transparent: boolean;
  attribution: string;
  opacity: number;
}

/** Base WMS endpoint (public, no key). */
const WMS_BASE = "https://wms.geoportail.lu/opendata/service";

/** Predefined layers available from the Geoportail. */
export const GEOPORTAIL_LAYERS: Record<string, GeoportailLayer> = {
  cadastre: {
    id: "cadastre",
    label: "Cadastre",
    wmsUrl: WMS_BASE,
    layers: "cadastre",
    format: "image/png",
    transparent: true,
    attribution:
      '&copy; <a href="https://www.geoportail.lu" target="_blank" rel="noopener">Geoportail.lu</a> (ACT)',
    opacity: 0.7,
  },
  pag: {
    id: "pag",
    label: "PAG",
    wmsUrl: WMS_BASE,
    layers: "pag",
    format: "image/png",
    transparent: true,
    attribution:
      '&copy; <a href="https://www.geoportail.lu" target="_blank" rel="noopener">Geoportail.lu</a> (ACT)',
    opacity: 0.55,
  },
  orthophoto: {
    id: "orthophoto",
    label: "Orthophoto",
    wmsUrl: "https://wmts1.geoportail.lu/opendata/wmts",
    layers: "ortho_latest",
    format: "image/jpeg",
    transparent: false,
    attribution:
      '&copy; <a href="https://www.geoportail.lu" target="_blank" rel="noopener">Geoportail.lu</a> (ACT)',
    opacity: 1,
  },
};

// ---------------------------------------------------------------------------
// WMS tile URL builder for Leaflet TileLayer.WMS
// ---------------------------------------------------------------------------

/**
 * Returns the WMS base URL and default options for use with L.tileLayer.wms().
 *
 * Usage:
 * ```ts
 * const { url, options } = getGeoportailWMSUrl("cadastre");
 * L.tileLayer.wms(url, options).addTo(map);
 * ```
 */
export function getGeoportailWMSUrl(layerKey: string): {
  url: string;
  options: {
    layers: string;
    format: string;
    transparent: boolean;
    attribution: string;
    opacity: number;
  };
} {
  const layer = GEOPORTAIL_LAYERS[layerKey];
  if (!layer) {
    throw new Error(`Unknown Geoportail layer: ${layerKey}`);
  }
  return {
    url: layer.wmsUrl,
    options: {
      layers: layer.layers,
      format: layer.format,
      transparent: layer.transparent,
      attribution: layer.attribution,
      opacity: layer.opacity,
    },
  };
}

// ---------------------------------------------------------------------------
// Geocoding helper
// ---------------------------------------------------------------------------

export interface GeocodingResult {
  lat: number;
  lon: number;
  label: string;
}

/**
 * Geocode an address or place name using the Geoportail geocoder (public API).
 * Returns an empty array on error for graceful degradation.
 */
export async function geocodeAddress(
  query: string,
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://api.geoportail.lu/geocoder/search?queryString=${encodeURIComponent(query.trim())}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];

    const data = await res.json();

    // The Geoportail geocoder returns a GeoJSON FeatureCollection
    if (!data?.results || !Array.isArray(data.results)) {
      // Fallback: some versions return { results: [...] }
      if (data?.features && Array.isArray(data.features)) {
        return data.features.map(
          (f: { geometry: { coordinates: number[] }; properties: { label?: string; name?: string } }) => ({
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            label: f.properties?.label || f.properties?.name || query,
          }),
        );
      }
      return [];
    }

    return data.results.map(
      (r: { geomlonlat?: { coordinates?: number[] }; label?: string; name?: string }) => ({
        lat: r.geomlonlat?.coordinates?.[1] ?? 0,
        lon: r.geomlonlat?.coordinates?.[0] ?? 0,
        label: r.label || r.name || query,
      }),
    );
  } catch {
    // Network error or timeout — degrade gracefully
    return [];
  }
}

// ---------------------------------------------------------------------------
// Geoportail external link builder
// ---------------------------------------------------------------------------

/**
 * Build a URL that opens the Geoportail map viewer centered on a location.
 */
export function buildGeoportailViewerUrl(
  commune: string,
  options?: { lat?: number; lon?: number; zoom?: number; layers?: string },
): string {
  const zoom = options?.zoom ?? 17;
  const layers = options?.layers ?? "302"; // PAG layer by default
  const base = "https://map.geoportail.lu/theme/main";

  if (options?.lat && options?.lon) {
    // Use coordinates for precise centering
    return `${base}?lang=fr&layers=${layers}&bgLayer=basemap_2015_global&zoom=${zoom}&X=${options.lon}&Y=${options.lat}`;
  }

  return `${base}?lang=fr&layers=${layers}&bgLayer=basemap_2015_global&zoom=${zoom}&search=${encodeURIComponent(commune)}`;
}
