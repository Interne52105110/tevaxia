// ============================================================
// DONNÉES DÉMOGRAPHIQUES PAR COMMUNE — Luxembourg
// ============================================================
// Sources : STATEC (Recensement 2021 + estimations 2025),
// Portail des statistiques du Luxembourg

export interface DemographicData {
  commune: string;
  population: number;
  croissancePct: number; // % croissance 2015-2025
  densiteHabKm2: number;
  revenuMedian?: number; // Revenu médian annuel €
  tauxEmploi?: number; // %
  pctEtrangers: number; // %
  trancheAge?: { jeunes: number; actifs: number; seniors: number }; // % <20, 20-64, 65+
}

// Données estimées 2025 — Sources : STATEC, data.public.lu
// Population basée sur les dernières données STATEC disponibles
export const DEMOGRAPHICS: Record<string, DemographicData> = {
  "Luxembourg": { commune: "Luxembourg", population: 134_000, croissancePct: 22, densiteHabKm2: 2_600, revenuMedian: 52_000, tauxEmploi: 72, pctEtrangers: 71, trancheAge: { jeunes: 18, actifs: 68, seniors: 14 } },
  "Esch-sur-Alzette": { commune: "Esch-sur-Alzette", population: 38_000, croissancePct: 18, densiteHabKm2: 2_800, revenuMedian: 38_000, tauxEmploi: 64, pctEtrangers: 58 },
  "Differdange": { commune: "Differdange", population: 30_000, croissancePct: 20, densiteHabKm2: 1_400, revenuMedian: 37_000, tauxEmploi: 62, pctEtrangers: 60 },
  "Dudelange": { commune: "Dudelange", population: 22_000, croissancePct: 12, densiteHabKm2: 850, revenuMedian: 39_000, tauxEmploi: 65, pctEtrangers: 55 },
  "Pétange": { commune: "Pétange", population: 20_500, croissancePct: 15, densiteHabKm2: 1_100, revenuMedian: 36_000, tauxEmploi: 63, pctEtrangers: 55 },
  "Sanem": { commune: "Sanem", population: 18_500, croissancePct: 25, densiteHabKm2: 700, revenuMedian: 42_000, tauxEmploi: 67, pctEtrangers: 52 },
  "Hesperange": { commune: "Hesperange", population: 16_000, croissancePct: 18, densiteHabKm2: 600, revenuMedian: 55_000, tauxEmploi: 74, pctEtrangers: 50 },
  "Bettembourg": { commune: "Bettembourg", population: 11_500, croissancePct: 14, densiteHabKm2: 480, revenuMedian: 44_000, tauxEmploi: 68, pctEtrangers: 48 },
  "Schifflange": { commune: "Schifflange", population: 12_500, croissancePct: 16, densiteHabKm2: 1_800, revenuMedian: 38_000, tauxEmploi: 64, pctEtrangers: 52 },
  "Kayl": { commune: "Kayl", population: 10_500, croissancePct: 12, densiteHabKm2: 700, revenuMedian: 40_000, tauxEmploi: 66, pctEtrangers: 42 },
  "Käerjeng": { commune: "Käerjeng", population: 11_000, croissancePct: 10, densiteHabKm2: 350, revenuMedian: 42_000, tauxEmploi: 68, pctEtrangers: 40 },
  "Mondercange": { commune: "Mondercange", population: 9_500, croissancePct: 16, densiteHabKm2: 650, revenuMedian: 43_000, tauxEmploi: 68, pctEtrangers: 45 },
  "Strassen": { commune: "Strassen", population: 10_500, croissancePct: 15, densiteHabKm2: 1_700, revenuMedian: 58_000, tauxEmploi: 75, pctEtrangers: 55 },
  "Bertrange": { commune: "Bertrange", population: 9_800, croissancePct: 14, densiteHabKm2: 1_200, revenuMedian: 60_000, tauxEmploi: 76, pctEtrangers: 58 },
  "Mamer": { commune: "Mamer", population: 10_800, croissancePct: 20, densiteHabKm2: 500, revenuMedian: 56_000, tauxEmploi: 74, pctEtrangers: 52 },
  "Walferdange": { commune: "Walferdange", population: 8_500, croissancePct: 12, densiteHabKm2: 1_000, revenuMedian: 52_000, tauxEmploi: 72, pctEtrangers: 48 },
  "Niederanven": { commune: "Niederanven", population: 7_000, croissancePct: 15, densiteHabKm2: 250, revenuMedian: 58_000, tauxEmploi: 76, pctEtrangers: 45 },
  "Sandweiler": { commune: "Sandweiler", population: 4_500, croissancePct: 10, densiteHabKm2: 400, revenuMedian: 54_000, tauxEmploi: 74, pctEtrangers: 42 },
  "Junglinster": { commune: "Junglinster", population: 8_500, croissancePct: 18, densiteHabKm2: 200, revenuMedian: 50_000, tauxEmploi: 72, pctEtrangers: 32 },
  "Mersch": { commune: "Mersch", population: 10_000, croissancePct: 15, densiteHabKm2: 250, revenuMedian: 46_000, tauxEmploi: 70, pctEtrangers: 35 },
  "Ettelbruck": { commune: "Ettelbruck", population: 9_500, croissancePct: 12, densiteHabKm2: 350, revenuMedian: 42_000, tauxEmploi: 68, pctEtrangers: 42 },
  "Diekirch": { commune: "Diekirch", population: 7_200, croissancePct: 10, densiteHabKm2: 400, revenuMedian: 40_000, tauxEmploi: 66, pctEtrangers: 38 },
  "Wiltz": { commune: "Wiltz", population: 7_500, croissancePct: 8, densiteHabKm2: 130, revenuMedian: 36_000, tauxEmploi: 62, pctEtrangers: 35 },
  "Clervaux": { commune: "Clervaux", population: 5_500, croissancePct: 6, densiteHabKm2: 50, revenuMedian: 38_000, tauxEmploi: 64, pctEtrangers: 28 },
  "Echternach": { commune: "Echternach", population: 5_800, croissancePct: 8, densiteHabKm2: 200, revenuMedian: 38_000, tauxEmploi: 64, pctEtrangers: 32 },
  "Grevenmacher": { commune: "Grevenmacher", population: 5_200, croissancePct: 10, densiteHabKm2: 250, revenuMedian: 40_000, tauxEmploi: 66, pctEtrangers: 35 },
  "Remich": { commune: "Remich", population: 3_800, croissancePct: 8, densiteHabKm2: 600, revenuMedian: 42_000, tauxEmploi: 66, pctEtrangers: 38 },
  "Vianden": { commune: "Vianden", population: 2_200, croissancePct: 5, densiteHabKm2: 130, revenuMedian: 36_000, tauxEmploi: 60, pctEtrangers: 30 },
  // Moyenne nationale pour référence
  "_national": { commune: "Luxembourg (pays)", population: 672_000, croissancePct: 18, densiteHabKm2: 260, revenuMedian: 44_000, tauxEmploi: 68, pctEtrangers: 48 },
};

export function getDemographics(commune: string): DemographicData | null {
  return DEMOGRAPHICS[commune] || null;
}
