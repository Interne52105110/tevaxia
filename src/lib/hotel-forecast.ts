// ============================================================
// HOTEL FORECAST — Holt-Winters (additive) + metrics helpers
// ============================================================
// Prévision à 90 jours (occupation / ADR / RevPAR) via lissage
// exponentiel triple additif avec saisonnalité hebdomadaire (m=7).
// Tous les calculs sont faits côté navigateur sans dépendance externe.

import { supabase, isSupabaseConfigured } from "./supabase";
import { invoiceDate } from "./facturation/templates";

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

async function assertMetricUser(expectedUserId: string) {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (!expectedUserId || error || data.user?.id !== expectedUserId) throw new Error("Hotel account changed or unavailable");
  return client;
}

async function assertHotelAccess(hotelId: string, expectedUserId: string, write = false) {
  const client = await assertMetricUser(expectedUserId);
  if (!hotelId) throw new RangeError("Missing hotel");
  const { data: hotel, error } = await client.from("hotels").select("org_id").eq("id", hotelId).maybeSingle();
  if (error || !hotel?.org_id) throw new Error("Hotel unavailable");
  const { data: member, error: memberError } = await client.from("org_members").select("role").eq("org_id", hotel.org_id).eq("user_id", expectedUserId).maybeSingle();
  if (memberError || !member || !(write ? ["admin", "member"] : ["admin", "member", "viewer"]).includes(member.role)) throw new Error("Hotel access denied");
  await assertMetricUser(expectedUserId);
  return client;
}

/** Read every page, including when the server applies a smaller page limit. */
export async function listMetrics(hotelId: string, from: string | undefined, to: string | undefined, expectedUserId: string): Promise<DailyMetric[]> {
  const client = await assertHotelAccess(hotelId, expectedUserId);
  const rows: DailyMetric[] = [];
  let cursor = "";
  for (;;) {
    await assertMetricUser(expectedUserId);
    let q = client.from("hotel_daily_metrics").select("*").eq("hotel_id", hotelId).order("metric_date", { ascending: true }).limit(200);
    if (from) q = q.gte("metric_date", from);
    if (to) q = q.lte("metric_date", to);
    if (cursor) q = q.gt("metric_date", cursor);
    const { data, error } = await q;
    if (error || !data) throw new Error("Hotel metrics read failed");
    await assertMetricUser(expectedUserId);
    if (!data.length) return rows;
    for (const row of data) {
      if (row.hotel_id !== hotelId || typeof row.metric_date !== "string" || row.metric_date <= cursor) throw new Error("Invalid hotel metrics page");
      cursor = row.metric_date;
      rows.push(row as DailyMetric);
    }
    if (rows.length > 100000) throw new Error("Hotel metrics result too large");
  }
}

export interface MetricInput { metric_date:string; occupancy?:number|null; adr?:number|null; revpar?:number|null; source?:DailyMetric['source']; notes?:string }
const validDay=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>='2000-01-01'&&date<=invoiceDate()&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
const validMetric=(n:number|null|undefined,max:number)=>n==null||Number.isFinite(n)&&n>=0&&n<=max;
/** Validate the complete batch before any database write. Never persist demo data. */
export function validateMetricInputs(rows:MetricInput[]):MetricInput[]{
 if(!Array.isArray(rows)||rows.length<1||rows.length>3660||rows.some(r=>!r||typeof r!=='object')||new Set(rows.map(r=>r.metric_date)).size!==rows.length)throw new RangeError('Invalid metric batch');
 return rows.map(r=>{
  if(!validDay(r.metric_date)||!validMetric(r.occupancy,1)||!validMetric(r.adr,1e6)||!validMetric(r.revpar,1e6)||r.occupancy==null||r.adr===undefined||r.adr==null&&r.occupancy!==0||r.occupancy===0&&r.adr!=null&&r.adr!==0||r.source&&!['manual','csv_import','pms_sync'].includes(r.source)||r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>2000))throw new RangeError('Invalid hotel metric');
  const revpar=r.occupancy===0?0:r.occupancy!=null&&r.adr!=null?r.occupancy*r.adr:r.revpar??null;
  if(r.revpar!=null&&revpar!=null&&Math.abs(r.revpar-revpar)>.02)throw new RangeError('Inconsistent RevPAR');
  return {...r,revpar};
 });
}
export async function upsertMetrics(hotelId: string, rows: MetricInput[], expectedUserId: string): Promise<number> {
  const valid = validateMetricInputs(rows);
  const client = await assertHotelAccess(hotelId, expectedUserId, true);
  const payload = valid.map(r => ({ hotel_id: hotelId, metric_date: r.metric_date, occupancy: r.occupancy, adr: r.adr ?? null, revpar: r.occupancy === 0 ? 0 : r.revpar, source: r.source ?? "manual", notes: r.notes ?? null }));
  const { data, error } = await client.from("hotel_daily_metrics").upsert(payload, { onConflict: "hotel_id,metric_date" }).select("metric_date");
  if (error || !data || data.length !== payload.length || new Set(data.map(r => r.metric_date)).size !== payload.length || payload.some(r => !data.some(saved => saved.metric_date === r.metric_date))) throw new Error("Hotel metrics save could not be confirmed");
  await assertMetricUser(expectedUserId);
  return data.length;
}

export async function deleteMetric(id: string, hotelId: string, expectedUserId: string): Promise<void> {
  if (!id) throw new RangeError("Missing metric");
  const client = await assertHotelAccess(hotelId, expectedUserId, true);
  const { data, error } = await client.from("hotel_daily_metrics").delete().eq("id", id).eq("hotel_id", hotelId).select("id");
  if (error || !data || data.length !== 1 || data[0].id !== id) throw new Error("Hotel metric deletion could not be confirmed");
  await assertMetricUser(expectedUserId);
}

// ---------- CSV parse ----------
// Attendu : lignes "YYYY-MM-DD,occupancy,adr" — ex. "2026-01-15,0.82,145".

function csvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = text.slice(0, text.search(/[\r\n]/) < 0 ? text.length : text.search(/[\r\n]/)).includes(";") ? ";" : text.split(/[\r\n]/)[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(f => f !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === delimiter) pushField();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else if (ch === '"' && field.trim() === "" && !closed) { field = ""; quoted = true; }
    else if (ch === '"' || (closed && ch.trim())) throw new Error("Malformed CSV");
    else field += ch;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  pushRow(); return rows;
}


export function parseCsvMetrics(csv:string):{metric_date:string;occupancy:number;adr:number}[]{
 if(csv.length>2_000_000)throw new RangeError('CSV too large');const rows=csvRows(csv);
 if(rows[0]?.[0]==='date'){if(rows.shift()!.join(',')!=='date,occupancy,adr')throw new RangeError('Invalid CSV header')}
 const number=(s:string)=>{const v=s.replace(/[ \u00a0\u202f]/g,'').replace(',','.');if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))throw new RangeError('Invalid number');return Number(v)};
 const result=rows.map(r=>{if(r.length!==3)throw new RangeError('Invalid CSV columns');const pct=r[1].endsWith('%'),raw=number(pct?r[1].slice(0,-1):r[1]);return {metric_date:r[0],occupancy:pct?raw/100:raw,adr:number(r[2])}});
 validateMetricInputs(result);return result;
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
  if(!Array.isArray(series)||!series.length||series.some(v=>!Number.isFinite(v))||!Number.isInteger(horizon)||horizon<1||horizon>3660||!Number.isInteger(m)||m<1||m>366||[alpha,beta,gamma].some(v=>!Number.isFinite(v)||v<0||v>1))throw new RangeError('Invalid smoothing inputs');


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

export interface ForecastResult { metric:'occupancy'|'adr'|'revpar'; historical:ForecastPoint[]; forecast:ForecastPoint[]; variationPct:number }
export function buildForecast(metrics:DailyMetric[],metric:'occupancy'|'adr'|'revpar',horizonDays=90,variationPct=0):ForecastResult|null{
 if(!Array.isArray(metrics)||metrics.length>3660||!['occupancy','adr','revpar'].includes(metric)||!Number.isInteger(horizonDays)||horizonDays<1||horizonDays>180||!Number.isFinite(variationPct)||variationPct<0||variationPct>100)throw new RangeError('Invalid forecast assumptions');
 const valid=metrics.filter(r=>r.source!=='forecast_seed').sort((a,b)=>a.metric_date.localeCompare(b.metric_date));
 valid.forEach((r,i)=>{
  if(!validDay(r.metric_date)||!validMetric(r.occupancy,1)||!validMetric(r.adr,1e6)||!validMetric(r.revpar,1e6)||metric==='revpar'&&(r.occupancy==null||r.adr===undefined||r.adr==null)||metric!=='revpar'&&r[metric]==null)throw new RangeError('Incomplete or invalid daily data');
  if(i&&Date.parse(r.metric_date+'T00:00:00Z')-Date.parse(valid[i-1].metric_date+'T00:00:00Z')!==86400000)throw new RangeError('Days must be unique and consecutive');
 });
 if(valid.length<14)return null;
 const clamp=(n:number,key:'occupancy'|'adr'|'revpar')=>key==='occupancy'?Math.max(0,Math.min(1,n)):Math.max(0,n);
 const series=valid.map(r=>metric==='revpar'?r.occupancy!*r.adr!:r[metric]!);
 const projected=metric==='revpar'?(()=>{const occ=holtWinters(valid.map(r=>r.occupancy!),horizonDays).forecast,adr=holtWinters(valid.map(r=>r.adr!),horizonDays).forecast;return occ.map((o,i)=>clamp(o,'occupancy')*clamp(adr[i],'adr'))})():holtWinters(series,horizonDays).forecast.map(v=>clamp(v,metric));
 const historical=valid.map((r,i)=>({date:r.metric_date,value:series[i],lower:series[i],upper:series[i],isForecast:false}));
 const end=Date.parse(valid[valid.length-1].metric_date+'T00:00:00Z');
 const forecast=projected.map((value,i)=>{if(!Number.isFinite(value))throw new RangeError('Non-finite forecast');return {date:new Date(end+(i+1)*86400000).toISOString().slice(0,10),value,lower:clamp(value*(1-variationPct/100),metric),upper:clamp(value*(1+variationPct/100),metric),isForecast:true}});
 return {metric,historical,forecast,variationPct};
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
    const noise = 1; // Deterministic fictional fixture, not market observations.
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
