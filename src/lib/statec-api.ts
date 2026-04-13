// ============================================================
// DONNÉES DE MARCHÉ LIVE — data.public.lu / Observatoire Habitat
// ============================================================
// Source : Portail Open Data Luxembourg (data.public.lu)
// API udata REST — gratuite, sans clé, CORS activé
// Fallback : données statiques de market-data.ts

import { getMarketDataCommune, type MarketDataCommune } from "./market-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LivePriceEntry {
  prixM2: number;
  source: string;
  date: string;
}

export interface MarketDataWithSource extends MarketDataCommune {
  /** "live" si les données proviennent de l'API, "static" si fallback */
  dataSource: "live" | "static";
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATA_PUBLIC_LU_API = "https://data.public.lu/api/1";

/** Slugs de datasets connus pour les prix immobiliers par commune */
const DATASET_SLUGS = [
  "logement-prix-annonces",
  "prix-immobiliers-par-commune",
  "observatoire-habitat-prix-par-commune",
] as const;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures
const LOCALSTORAGE_KEY = "tevaxia_live_market_data";

// ---------------------------------------------------------------------------
// Cache en memoire
// ---------------------------------------------------------------------------

let memoryCache: {
  data: Map<string, LivePriceEntry>;
  fetchedAt: number;
} | null = null;

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/**
 * Tente de charger le cache depuis localStorage (cote client uniquement).
 */
function loadFromLocalStorage(): Map<string, LivePriceEntry> | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      fetchedAt: number;
      entries: [string, LivePriceEntry][];
    };
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) {
      localStorage.removeItem(LOCALSTORAGE_KEY);
      return null;
    }
    return new Map(parsed.entries);
  } catch {
    return null;
  }
}

/**
 * Persiste le cache dans localStorage (cote client uniquement).
 */
function saveToLocalStorage(data: Map<string, LivePriceEntry>): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    const payload = {
      fetchedAt: Date.now(),
      entries: Array.from(data.entries()),
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage plein ou indisponible — on ignore silencieusement
  }
}

/**
 * Essaie de fetcher un dataset par son slug et retourne les metadonnees.
 */
async function fetchDatasetBySlug(
  slug: string
): Promise<{ resources: DatasetResource[] } | null> {
  try {
    const url = `${DATA_PUBLIC_LU_API}/datasets/${slug}/`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { resources: DatasetResource[] };
  } catch {
    return null;
  }
}

interface DatasetResource {
  id: string;
  title: string;
  description?: string;
  url: string;
  format: string;
  published: string;
  last_modified: string;
}

/**
 * Recherche de datasets par mot-cle (fallback si aucun slug ne fonctionne).
 */
async function searchDatasets(
  query: string
): Promise<{ resources: DatasetResource[] } | null> {
  try {
    const url = `${DATA_PUBLIC_LU_API}/datasets/?q=${encodeURIComponent(query)}&page_size=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data: { resources: DatasetResource[] }[];
    };
    // Retourne le premier dataset qui a des ressources
    for (const ds of json.data ?? []) {
      if (ds.resources && ds.resources.length > 0) {
        return ds;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Selectionne la meilleure ressource CSV ou JSON parmi les ressources disponibles.
 * Prefere les fichiers les plus recents et les formats CSV > JSON > XLSX.
 */
function pickBestResource(
  resources: DatasetResource[]
): DatasetResource | null {
  if (!resources || resources.length === 0) return null;

  const scored = resources
    .map((r) => {
      let formatScore = 0;
      const fmt = (r.format ?? "").toLowerCase();
      if (fmt === "csv" || r.url.endsWith(".csv")) formatScore = 3;
      else if (fmt === "json" || r.url.endsWith(".json")) formatScore = 2;
      else if (fmt === "xlsx" || fmt === "xls") formatScore = 0; // non parseable cote client
      else formatScore = 1;

      const dateScore = new Date(r.last_modified || r.published || 0).getTime();
      return { resource: r, formatScore, dateScore };
    })
    .filter((r) => r.formatScore >= 2) // CSV ou JSON seulement
    .sort((a, b) => {
      if (b.formatScore !== a.formatScore)
        return b.formatScore - a.formatScore;
      return b.dateScore - a.dateScore;
    });

  return scored.length > 0 ? scored[0].resource : null;
}

/**
 * Parse un CSV brut en tableau d'objets.
 * Gere les separateurs virgule et point-virgule (courant au Luxembourg).
 */
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];

  // Detecter le separateur
  const firstLine = lines[0];
  const sep = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < 2) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Normalise le nom de commune pour la correspondance.
 * Ex: "Luxembourg-Ville" -> "luxembourg", "Esch-sur-Alzette" reste tel quel.
 */
function normalizeCommune(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+ville$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tente d'extraire commune + prix au m2 depuis un tableau de records CSV/JSON.
 * S'adapte a differentes structures de colonnes.
 */
function extractPriceData(
  rows: Record<string, string>[],
  resourceDate: string
): Map<string, LivePriceEntry> {
  const result = new Map<string, LivePriceEntry>();
  if (rows.length === 0) return result;

  // Detecter les noms de colonnes pour commune et prix
  const sampleKeys = Object.keys(rows[0]);
  const communeCol = sampleKeys.find(
    (k) =>
      /commune/i.test(k) ||
      /municipality/i.test(k) ||
      /gemeinde/i.test(k) ||
      /localit/i.test(k)
  );
  const priceCol = sampleKeys.find(
    (k) =>
      /prix.*m2/i.test(k) ||
      /price.*m2/i.test(k) ||
      /prix.*m\u00B2/i.test(k) ||
      /median/i.test(k) ||
      /moyen/i.test(k) ||
      /average/i.test(k) ||
      /prix/i.test(k) ||
      /price/i.test(k)
  );
  const dateCol = sampleKeys.find(
    (k) =>
      /date/i.test(k) ||
      /period/i.test(k) ||
      /trimestre/i.test(k) ||
      /quarter/i.test(k) ||
      /ann/i.test(k) ||
      /year/i.test(k)
  );

  if (!communeCol || !priceCol) return result;

  // Si le dataset contient plusieurs periodes, ne garder que la plus recente
  let filteredRows = rows;
  if (dateCol) {
    const dateSet = new Set(rows.map((r) => r[dateCol]).filter(Boolean));
    const dates = Array.from(dateSet).sort();
    const latestDate = dates[dates.length - 1];
    if (latestDate) {
      filteredRows = rows.filter((r) => r[dateCol] === latestDate);
    }
  }

  for (const row of filteredRows) {
    const communeName = row[communeCol];
    const priceStr = row[priceCol];
    if (!communeName || !priceStr) continue;

    // Gerer les nombres avec virgule decimale (format europeen)
    const price = parseFloat(priceStr.replace(/\s/g, "").replace(",", "."));
    if (isNaN(price) || price <= 0) continue;

    const entryDate =
      (dateCol && row[dateCol]) || resourceDate;

    result.set(normalizeCommune(communeName), {
      prixM2: Math.round(price),
      source: "data.public.lu — Observatoire de l'Habitat (live)",
      date: entryDate,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Recupere les donnees de marche live depuis data.public.lu.
 * Retourne une Map commune_normalisee -> { prixM2, source, date }.
 *
 * Strategie :
 * 1. Verifier le cache memoire (TTL 24h)
 * 2. Verifier localStorage (TTL 24h)
 * 3. Essayer les slugs de dataset connus
 * 4. Recherche par mot-cle en fallback
 * 5. Retourner une Map vide si tout echoue
 */
export async function fetchLiveMarketData(): Promise<
  Map<string, LivePriceEntry>
> {
  // 1. Cache memoire
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL) {
    return memoryCache.data;
  }

  // 2. localStorage
  const cached = loadFromLocalStorage();
  if (cached && cached.size > 0) {
    memoryCache = { data: cached, fetchedAt: Date.now() };
    return cached;
  }

  // 3. Essayer les slugs connus
  let dataset: { resources: DatasetResource[] } | null = null;
  for (const slug of DATASET_SLUGS) {
    dataset = await fetchDatasetBySlug(slug);
    if (dataset && dataset.resources && dataset.resources.length > 0) break;
  }

  // 4. Recherche par mot-cle
  if (!dataset || !dataset.resources || dataset.resources.length === 0) {
    dataset = await searchDatasets("prix immobilier commune luxembourg");
  }

  if (!dataset || !dataset.resources || dataset.resources.length === 0) {
    return new Map();
  }

  // Selectionner la meilleure ressource
  const resource = pickBestResource(dataset.resources);
  if (!resource) return new Map();

  // Telecharger et parser
  try {
    const res = await fetch(resource.url, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return new Map();

    const contentType = res.headers.get("content-type") ?? "";
    const resourceDate = (
      resource.last_modified ||
      resource.published ||
      new Date().toISOString()
    ).slice(0, 10);

    let data: Map<string, LivePriceEntry>;

    if (
      resource.url.endsWith(".json") ||
      contentType.includes("application/json")
    ) {
      // JSON — pourrait etre un tableau d'objets ou un objet enveloppe
      const json = await res.json();
      const rows: Record<string, string>[] = Array.isArray(json)
        ? json
        : json.data
          ? json.data
          : [];
      data = extractPriceData(
        rows.map((r: Record<string, unknown>) => {
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(r)) {
            out[k] = String(v ?? "");
          }
          return out;
        }),
        resourceDate
      );
    } else {
      // CSV (defaut)
      const text = await res.text();
      const rows = parseCSV(text);
      data = extractPriceData(rows, resourceDate);
    }

    if (data.size > 0) {
      memoryCache = { data, fetchedAt: Date.now() };
      saveToLocalStorage(data);
    }

    return data;
  } catch {
    return new Map();
  }
}

/**
 * Indique si des donnees live sont actuellement disponibles en cache.
 */
export function isLiveDataAvailable(): boolean {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL) {
    return memoryCache.data.size > 0;
  }
  const cached = loadFromLocalStorage();
  return cached !== null && cached.size > 0;
}

/**
 * Invalide le cache (memoire + localStorage).
 * Utile pour forcer un rafraichissement.
 */
export function clearLiveDataCache(): void {
  memoryCache = null;
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Recupere les donnees de marche pour une commune en privilegiant les donnees live.
 *
 * @param commune - Nom de la commune (ex: "Luxembourg", "Esch-sur-Alzette")
 * @returns Les donnees de marche enrichies du champ `dataSource`
 */
export async function getMarketDataWithLive(
  commune: string
): Promise<MarketDataWithSource | null> {
  // Essayer les donnees live
  try {
    const liveData = await fetchLiveMarketData();
    if (liveData.size > 0) {
      const normalizedQuery = normalizeCommune(commune);
      const liveEntry = liveData.get(normalizedQuery);

      if (liveEntry) {
        // Recuperer aussi les donnees statiques pour les champs complementaires
        const staticData = getMarketDataCommune(commune);

        if (staticData) {
          // Fusionner : prix live + metadonnees statiques
          return {
            ...staticData,
            prixM2Existant: liveEntry.prixM2,
            periode: liveEntry.date,
            source: liveEntry.source,
            dataSource: "live",
          };
        }

        // Pas de donnees statiques — construire un objet minimal
        return {
          commune,
          canton: "",
          prixM2Existant: liveEntry.prixM2,
          prixM2VEFA: null,
          prixM2Annonces: null,
          loyerM2Annonces: null,
          nbTransactions: null,
          periode: liveEntry.date,
          source: liveEntry.source,
          dataSource: "live",
        };
      }
    }
  } catch {
    // En cas d'erreur, on tombe sur le fallback statique
  }

  // Fallback : donnees statiques
  const staticData = getMarketDataCommune(commune);
  if (!staticData) return null;

  return {
    ...staticData,
    dataSource: "static",
  };
}
