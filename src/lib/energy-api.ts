// Client API pour le backend Spring Boot energy-api
// En dev : http://localhost:8080, en prod : https://api.energy.tevaxia.eu

const API_BASE = process.env.NEXT_PUBLIC_ENERGY_API_URL || "http://localhost:8081";

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Erreur API ${res.status}`);
  }

  return res.json();
}

// --- Impact CPE ---

export interface ImpactRequest {
  valeurBien: number;
  classeActuelle: string;
}

export interface ClasseImpact {
  classe: string;
  ajustementPct: number;
  valeurAjustee: number;
  delta: number;
}

export interface ImpactResponse {
  valeurBase: number;
  classeActuelle: string;
  classes: ClasseImpact[];
}

export function calculerImpact(request: ImpactRequest): Promise<ImpactResponse> {
  return post("/api/v1/impact", request);
}

// --- Rénovation ROI ---

export interface RenovationRequest {
  classeActuelle: string;
  classeCible: string;
  surface: number;
  anneeConstruction: number;
  valeurBien: number;
}

export interface PosteTravaux {
  label: string;
  coutMin: number;
  coutMax: number;
  coutMoyen: number;
}

export interface RenovationResponse {
  sautClasse: string;
  postes: PosteTravaux[];
  totalMin: number;
  totalMax: number;
  totalMoyen: number;
  honoraires: number;
  totalProjet: number;
  dureeEstimeeMois: number;
  gainValeur: number;
  gainValeurPct: number;
  roiPct: number;
}

export function calculerRenovation(request: RenovationRequest): Promise<RenovationResponse> {
  return post("/api/v1/renovation", request);
}

// --- Communauté d'énergie ---

export interface CommunauteRequest {
  nbParticipants: number;
  puissancePV: number;
  consoMoyenneParParticipant: number;
  tarifReseau: number;
  tarifPartage: number;
}

export interface CommunauteResponse {
  productionAnnuelle: number;
  consoTotale: number;
  tauxCouverturePct: number;
  tauxAutoConsoPct: number;
  energieAutoconsommee: number;
  surplus: number;
  economieTotale: number;
  economieParParticipant: number;
  revenuSurplus: number;
  co2EviteKg: number;
  parametres: {
    productionParKwc: number;
    tauxAutoConsoBase: number;
    facteurFoisonnement: number;
    tarifRachatSurplus: number;
    co2Facteur: number;
  };
}

export function calculerCommunaute(request: CommunauteRequest): Promise<CommunauteResponse> {
  return post("/api/v1/communaute", request);
}
