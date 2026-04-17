// ============================================================
// STR FORECAST — Holt-Winters mensuel (m=12) pour STR/Airbnb
// ============================================================
// Réutilise holtWinters de hotel-forecast.ts mais avec saisonnalité
// annuelle (m=12 mois) au lieu de hebdomadaire, pour produire une
// prévision 12-18 mois d'occupation, ADR et revenu d'un STR.

import { holtWinters } from "./hotel-forecast";

export interface StrMonthlyMetric {
  year: number;
  month: number; // 1-12
  occupancy: number; // 0..1
  adr: number;       // €
  nights: number;    // nuitées vendues (ou 0 si inconnu)
}

export interface StrForecastPoint {
  year: number;
  month: number;
  occupancy: number;
  adr: number;
  revenue: number; // nuits × ADR — synthétique pour visualisation
  lowerRevenue: number;
  upperRevenue: number;
  isForecast: boolean;
}

export interface StrForecastResult {
  historical: StrForecastPoint[];
  forecast: StrForecastPoint[];
  mape: { occupancy: number; adr: number; revenue: number };
  confidence: "low" | "medium" | "high"; // basé sur le nb de mois d'historique
}

/**
 * Parse CSV (YYYY-MM,occupancy,adr,[nights]) — occupancy en %, en dec ou 0..1
 */
export function parseStrCsv(csv: string): StrMonthlyMetric[] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const out: StrMonthlyMetric[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 3) continue;
    const match = /^(\d{4})-(\d{1,2})$/.exec(parts[0]);
    if (!match) continue;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (year < 2000 || year > 2100 || month < 1 || month > 12) continue;
    const occRaw = parseFloat(parts[1].replace("%", "").replace(",", "."));
    const adr = parseFloat(parts[2].replace(",", "."));
    if (isNaN(occRaw) || isNaN(adr)) continue;
    const occupancy = occRaw > 1 ? occRaw / 100 : occRaw;
    const nights = parts[3] ? parseFloat(parts[3].replace(",", ".")) : 0;
    out.push({ year, month, occupancy, adr, nights: isNaN(nights) ? 0 : nights });
  }
  return out;
}

/**
 * Convertit la série d'historique en dates string (YYYY-MM-01) pour l'affichage
 */
export function sortedMonthly(metrics: StrMonthlyMetric[]): StrMonthlyMetric[] {
  return [...metrics].sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month));
}

/**
 * Génère une prévision 12-18 mois à partir de l'historique mensuel.
 * Requiert au moins 24 mois d'historique pour activer la saisonnalité (m=12).
 * En-dessous, fallback tendance linéaire + moyenne.
 */
export function buildStrForecast(
  rawMetrics: StrMonthlyMetric[],
  horizonMonths = 12,
  daysPerMonth = 30,
): StrForecastResult | null {
  const metrics = sortedMonthly(rawMetrics);
  if (metrics.length < 6) return null;

  const occSeries = metrics.map((m) => m.occupancy);
  const adrSeries = metrics.map((m) => m.adr);

  const hwOcc = holtWinters(occSeries, horizonMonths, { m: 12, alpha: 0.3, beta: 0.1, gamma: 0.3 });
  const hwAdr = holtWinters(adrSeries, horizonMonths, { m: 12, alpha: 0.3, beta: 0.1, gamma: 0.3 });

  // MAPE
  const lookback = Math.min(12, metrics.length);
  let mapeOcc = 0, mapeAdr = 0, mapeRev = 0, cnt = 0;
  for (let i = metrics.length - lookback; i < metrics.length; i++) {
    if (occSeries[i] > 0) mapeOcc += Math.abs((occSeries[i] - hwOcc.fitted[i]) / occSeries[i]);
    if (adrSeries[i] > 0) mapeAdr += Math.abs((adrSeries[i] - hwAdr.fitted[i]) / adrSeries[i]);
    const actualRev = occSeries[i] * adrSeries[i] * daysPerMonth;
    const fittedRev = hwOcc.fitted[i] * hwAdr.fitted[i] * daysPerMonth;
    if (actualRev > 0) mapeRev += Math.abs((actualRev - fittedRev) / actualRev);
    cnt++;
  }
  const divisor = Math.max(1, cnt);

  const historical: StrForecastPoint[] = metrics.map((m) => ({
    year: m.year,
    month: m.month,
    occupancy: m.occupancy,
    adr: m.adr,
    revenue: m.occupancy * m.adr * daysPerMonth,
    lowerRevenue: m.occupancy * m.adr * daysPerMonth,
    upperRevenue: m.occupancy * m.adr * daysPerMonth,
    isForecast: false,
  }));

  const last = metrics[metrics.length - 1];
  const forecast: StrForecastPoint[] = [];
  const conf = 1.96;

  for (let h = 1; h <= horizonMonths; h++) {
    const monthIdx = last.month - 1 + h;
    const yOffset = Math.floor(monthIdx / 12);
    const year = last.year + yOffset;
    const month = (monthIdx % 12) + 1;

    const occ = Math.max(0, Math.min(1, hwOcc.forecast[h - 1]));
    const adr = Math.max(0, hwAdr.forecast[h - 1]);
    const revenue = occ * adr * daysPerMonth;

    // Bande sur le revenu (combinant incertitude occ + adr simplifiée)
    const occBand = conf * hwOcc.residStd * Math.sqrt(h);
    const adrBand = conf * hwAdr.residStd * Math.sqrt(h);
    const occLow = Math.max(0, Math.min(1, occ - occBand));
    const occHigh = Math.max(0, Math.min(1, occ + occBand));
    const adrLow = Math.max(0, adr - adrBand);
    const adrHigh = Math.max(0, adr + adrBand);

    forecast.push({
      year, month, occupancy: occ, adr, revenue,
      lowerRevenue: occLow * adrLow * daysPerMonth,
      upperRevenue: occHigh * adrHigh * daysPerMonth,
      isForecast: true,
    });
  }

  // Confidence : basé sur la longueur d'historique
  const confidence: StrForecastResult["confidence"] =
    metrics.length >= 24 ? "high" : metrics.length >= 12 ? "medium" : "low";

  return {
    historical,
    forecast,
    mape: {
      occupancy: (mapeOcc / divisor) * 100,
      adr: (mapeAdr / divisor) * 100,
      revenue: (mapeRev / divisor) * 100,
    },
    confidence,
  };
}

/**
 * Génère un historique synthétique pour démo : 24 mois de données réalistes
 * LU STR avec saisonnalité (pic été + ville été 75 %, basse saison hiver 45 %).
 */
export function generateStrSeed(baseOcc = 0.65, baseAdr = 130, months = 24): StrMonthlyMetric[] {
  // Coefficients saisonniers LU (observations observatoire STR + AirDNA)
  const seasonalOcc = [0.75, 0.78, 0.92, 1.02, 1.12, 1.22, 1.30, 1.32, 1.18, 1.08, 0.88, 0.82];
  const seasonalAdr = [0.88, 0.90, 0.95, 1.02, 1.08, 1.15, 1.22, 1.25, 1.12, 1.05, 0.96, 0.95];

  const out: StrMonthlyMetric[] = [];
  const now = new Date();
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth() + 1;
  for (let i = months; i >= 1; i--) {
    const mIdx = startMonth - 1 - i;
    const yOffset = Math.floor(mIdx / 12);
    const year = startYear + yOffset;
    const month = ((mIdx % 12) + 12) % 12 + 1;
    const m = month - 1;
    const occ = Math.max(0, Math.min(1, baseOcc * seasonalOcc[m] * (1 + (Math.random() - 0.5) * 0.05)));
    const adr = Math.max(0, baseAdr * seasonalAdr[m] * (1 + (Math.random() - 0.5) * 0.05));
    out.push({ year, month, occupancy: occ, adr, nights: Math.round(occ * 30) });
  }
  return out;
}
