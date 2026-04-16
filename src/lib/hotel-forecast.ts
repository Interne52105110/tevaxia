// ============================================================
// HOTEL FORECAST — Holt-Winters (additive) + metrics helpers
// ============================================================
// Prévision à 90 jours (occupation / ADR / RevPAR) via lissage
// exponentiel triple additif avec saisonnalité hebdomadaire (m=7).
// Tous les calculs sont faits côté navigateur sans dépendance externe.

import { supabase, isSupabaseConfigured } from "./supabase";

export interface DailyMetric {
  id: string;
  hotel_id: string;
  metric_date: string; // YYYY-MM-DD
  occupancy: number | null;
  adr: number | null;
  revpar: number | null;
  source: "manual" | "csv_import" | "pms_sync" | "forecast_seed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForecastPoint {
  date: string;
  value: number;
  lower: number;
  upper: number;
  isForecast: boolean;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

// ---------- CRUD ----------

export async function listMetrics(hotelId: string, from?: string, to?: string): Promise<DailyMetric[]> {
  const client = ensureClient();
  let q = client.from("hotel_daily_metrics").select("*").eq("hotel_id", hotelId);
  if (from) q = q.gte("metric_date", from);
  if (to) q = q.lte("metric_date", to);
  const { data, error } = await q.order("metric_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailyMetric[];
}

export async function upsertMetrics(hotelId: string, rows: {
  metric_date: string;
  occupancy?: number | null;
  adr?: number | null;
  revpar?: number | null;
  source?: DailyMetric["source"];
  notes?: string;
}[]): Promise<number> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const payload = rows.map((r) => ({
    hotel_id: hotelId,
    metric_date: r.metric_date,
    occupancy: r.occupancy ?? null,
    adr: r.adr ?? null,
    revpar: r.revpar ?? null,
    source: r.source ?? "manual",
    notes: r.notes ?? null,
    created_by: user?.id ?? null,
  }));
  const { error } = await client.from("hotel_daily_metrics").upsert(payload, { onConflict: "hotel_id,metric_date" });
  if (error) throw error;
  return payload.length;
}

export async function deleteMetric(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("hotel_daily_metrics").delete().eq("id", id);
  if (error) throw error;
}

// ---------- CSV parse ----------
// Attendu : lignes "YYYY-MM-DD,occupancy,adr" — ex. "2026-01-15,0.82,145".

export function parseCsvMetrics(csv: string): { metric_date: string; occupancy: number; adr: number }[] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const out: { metric_date: string; occupancy: number; adr: number }[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 3) continue;
    const date = parts[0];
    // Skip header
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const occ = parseFloat(parts[1].replace("%", "").replace(",", "."));
    const adr = parseFloat(parts[2].replace(",", "."));
    if (isNaN(occ) || isNaN(adr)) continue;
    // Accept 0.82 or 82 (%) convention
    const normalizedOcc = occ > 1 ? occ / 100 : occ;
    out.push({ metric_date: date, occupancy: normalizedOcc, adr });
  }
  return out;
}

// ---------- Holt-Winters (triple exponential smoothing, additive) ----------
// m = 7 (saisonnalité hebdomadaire pour hôtels)
// α, β, γ ∈ (0,1) — smoothing factors

interface HwParams {
  alpha?: number; // level
  beta?: number;  // trend
  gamma?: number; // seasonal
  m?: number;     // period
}

export function holtWinters(
  series: number[],
  horizon: number,
  params: HwParams = {}
): { fitted: number[]; forecast: number[]; residStd: number } {
  const alpha = params.alpha ?? 0.3;
  const beta = params.beta ?? 0.1;
  const gamma = params.gamma ?? 0.3;
  const m = params.m ?? 7;

  if (series.length < 2 * m) {
    // Fallback : moyenne mobile
    const avg = series.reduce((s, v) => s + v, 0) / Math.max(1, series.length);
    return {
      fitted: series.map(() => avg),
      forecast: Array(horizon).fill(avg),
      residStd: 0,
    };
  }

  // 1. Initialisation — moyennes saisonnières
  const nCycles = Math.floor(series.length / m);
  const cycleAverages: number[] = [];
  for (let c = 0; c < nCycles; c++) {
    let sum = 0;
    for (let i = 0; i < m; i++) sum += series[c * m + i];
    cycleAverages.push(sum / m);
  }

  // Level initial = moyenne du premier cycle
  let level = cycleAverages[0];
  // Tendance initiale = (moy dernier cycle - moy 1er cycle) / ((nCycles-1)*m)
  let trend = (cycleAverages[nCycles - 1] - cycleAverages[0]) / ((nCycles - 1) * m);
  // Indices saisonniers = moyenne des écarts (série - moy_cycle) par position
  const seasonal: number[] = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let c = 0; c < nCycles; c++) {
      sum += series[c * m + i] - cycleAverages[c];
    }
    seasonal[i] = sum / nCycles;
  }

  // 2. Smoothing
  const fitted: number[] = [];
  const residuals: number[] = [];
  for (let t = 0; t < series.length; t++) {
    const seasIdx = t % m;
    const prevLevel = level;
    const fcast = level + trend + seasonal[seasIdx];
    fitted.push(fcast);
    residuals.push(series[t] - fcast);

    const newLevel = alpha * (series[t] - seasonal[seasIdx]) + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * trend;
    seasonal[seasIdx] = gamma * (series[t] - newLevel) + (1 - gamma) * seasonal[seasIdx];
    level = newLevel;
    trend = newTrend;
  }

  // 3. Forecast
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const seasIdx = (series.length + h - 1) % m;
    forecast.push(level + h * trend + seasonal[seasIdx]);
  }

  // 4. Écart-type des résidus — pour intervalle de confiance
  const meanResid = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const variance = residuals.reduce((s, r) => s + (r - meanResid) ** 2, 0) / Math.max(1, residuals.length - 1);
  const residStd = Math.sqrt(variance);

  return { fitted, forecast, residStd };
}

// ---------- High-level forecast builder ----------

export interface ForecastResult {
  metric: "occupancy" | "adr" | "revpar";
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  mape: number; // Mean Absolute Percentage Error (backtest simple)
  residStd: number;
}

export function buildForecast(
  metrics: DailyMetric[],
  metric: "occupancy" | "adr" | "revpar",
  horizonDays: number = 90
): ForecastResult | null {
  const valid = metrics
    .filter((m) => m[metric] !== null && m[metric] !== undefined)
    .sort((a, b) => a.metric_date.localeCompare(b.metric_date));

  if (valid.length < 14) return null; // minimum 2 semaines

  const series = valid.map((v) => Number(v[metric]));
  const dates = valid.map((v) => v.metric_date);
  const { fitted, forecast, residStd } = holtWinters(series, horizonDays);

  // MAPE sur les 30 derniers points
  const lookback = Math.min(30, series.length);
  let mapeSum = 0;
  let mapeCount = 0;
  for (let i = series.length - lookback; i < series.length; i++) {
    if (series[i] > 0) {
      mapeSum += Math.abs((series[i] - fitted[i]) / series[i]);
      mapeCount++;
    }
  }
  const mape = mapeCount > 0 ? (mapeSum / mapeCount) * 100 : 0;

  // Points historiques
  const historical: ForecastPoint[] = series.map((v, i) => ({
    date: dates[i],
    value: v,
    lower: v,
    upper: v,
    isForecast: false,
  }));

  // Points prévisionnels
  const last = dates[dates.length - 1];
  const forecastPts: ForecastPoint[] = [];
  const conf = 1.96; // ~95 %
  for (let h = 1; h <= horizonDays; h++) {
    const d = new Date(last + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + h);
    const dateStr = d.toISOString().slice(0, 10);
    // Incertitude croît avec l'horizon : √h * résidStd
    const band = conf * residStd * Math.sqrt(h);
    const val = forecast[h - 1];
    let lower = val - band;
    let upper = val + band;
    // Clamp occupancy [0, 1]
    if (metric === "occupancy") {
      lower = Math.max(0, Math.min(1, lower));
      upper = Math.max(0, Math.min(1, upper));
    } else {
      lower = Math.max(0, lower);
      upper = Math.max(0, upper);
    }
    forecastPts.push({
      date: dateStr,
      value: metric === "occupancy" ? Math.max(0, Math.min(1, val)) : Math.max(0, val),
      lower,
      upper,
      isForecast: true,
    });
  }

  return { metric, historical, forecast: forecastPts, mape, residStd };
}

// ---------- Synthetic seed (pour démo utilisateurs sans historique) ----------

export function generateSeedData(baseOcc: number, baseAdr: number, days: number = 120): {
  metric_date: string;
  occupancy: number;
  adr: number;
}[] {
  const out: { metric_date: string; occupancy: number; adr: number }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = days; i >= 1; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay(); // 0 = dim, 6 = sam
    // Motif hebdo : vendredi/samedi = +15 %, mardi = -10 %
    const dowFactor = [1.0, 0.9, 0.88, 0.92, 1.05, 1.18, 1.15][dow];
    const noise = 1 + (Math.random() - 0.5) * 0.1;
    // Tendance légère positive (+0.5 % / mois)
    const trend = 1 + (days - i) * 0.0002;
    out.push({
      metric_date: d.toISOString().slice(0, 10),
      occupancy: Math.max(0, Math.min(1, baseOcc * dowFactor * noise * trend)),
      adr: Math.max(0, baseAdr * dowFactor * noise * trend),
    });
  }
  return out;
}
