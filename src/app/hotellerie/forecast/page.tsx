"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listHotels, type Hotel } from "@/lib/hotels";
import { listMyOrganizations } from "@/lib/orgs";
import {
  listMetrics, upsertMetrics, deleteMetric,
  parseCsvMetrics, buildForecast,
  type DailyMetric, type ForecastResult,
} from "@/lib/hotel-forecast";

import { invoiceDate, addInvoiceDays } from "@/lib/facturation/templates";
import { errMsg } from "@/lib/errors";

type MetricKey = "occupancy" | "adr" | "revpar";
const METRIC_I18N_KEY: Record<MetricKey, string> = {
  occupancy: "metricOccupancy",
  adr: "metricAdr",
  revpar: "metricRevpar",
};
const METRIC_COLOR: Record<MetricKey, string> = {
  occupancy: "#2563EB",
  adr: "#059669",
  revpar: "#7C3AED",
};

export default function HotelForecastPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("hotelForecast");
  const lp = locale === "fr" ? "" : `/${locale}`;
  if (loading) return <p role="status" className="p-8">{t("loading")}</p>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-sm text-muted">{t("loginPrompt")}</p><Link href={`${lp}/connexion`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">{t("loginBtn")}</Link></div>;
  return <ForecastWorkspace key={user.id} userId={user.id} />;
}

function ForecastWorkspace({ userId }: { userId: string }) {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("hotelForecast");
  const formatEUR=(value:number)=>value.toLocaleString(locale === "lb" ? "de-DE" : locale,{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2});
  const active = useRef(true);
  const actionLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const metricsRequest = useRef(0);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("occupancy");
  const [horizon, setHorizon] = useState(90);
  const [variation, setVariation] = useState(0);

  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    metric_date: invoiceDate(),
    occupancy: NaN,
    adr: NaN,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setHotelsLoading(true); setError(null);
      try {
        const orgs = await listMyOrganizations();
        const hotelOrgs = orgs.filter((o) => o.org_type === "hotel_group");
        const allHotels: Hotel[] = [];
        for (const o of hotelOrgs) {
          if (cancelled) return;
          allHotels.push(...await listHotels(o.id));
        }
        if (cancelled) return;
        setHotels(allHotels);
        setActiveHotelId(allHotels[0]?.id ?? null);
      } catch (e) { if (!cancelled) setError(errMsg(e, t("error"))); }
      finally { if (!cancelled) setHotelsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userId, t, reload]);

  const refreshMetrics = useCallback(async (hotelId: string) => {
    const request = ++metricsRequest.current;
    setMetricsLoading(true); setError(null);
    try {
      const ms = await listMetrics(hotelId, addInvoiceDays(invoiceDate(), -365), invoiceDate(), userId);
      if (active.current && request === metricsRequest.current) setMetrics(ms);
    } catch (e) { if (active.current && request === metricsRequest.current) { setMetrics([]); setError(errMsg(e, t("error"))); } }
    finally { if (active.current && request === metricsRequest.current) setMetricsLoading(false); }
  }, [t, userId]);

  useEffect(() => {
    if (activeHotelId) void refreshMetrics(activeHotelId);
    const counter = metricsRequest;
    return () => { counter.current++; };
  }, [activeHotelId, refreshMetrics]);

  const forecast: ForecastResult | null = useMemo(() => {
    if (metrics.length < 14) return null;
    try { return buildForecast(metrics, activeMetric, horizon, variation); } catch { return null; }
  }, [metrics, activeMetric, horizon, variation]);

  const runAction = async (action: (hotelId: string) => Promise<void>) => {
    if (!activeHotelId || actionLock.current || !active.current) return;
    const hotelId = activeHotelId;
    actionLock.current = true; setBusy(true); setError(null);
    try { await action(hotelId); if (active.current) await refreshMetrics(hotelId); }
    catch (e) { if (active.current) setError(errMsg(e, t("error"))); }
    finally { actionLock.current = false; if (active.current) setBusy(false); }
  };
  const handleImportCsv = () => runAction(async hotelId => {
    const rows = parseCsvMetrics(csvText);
    await upsertMetrics(hotelId, rows.map(r => ({ ...r, source: "csv_import" as const })), userId);
    if (active.current) { setCsvText(""); setShowCsvImport(false); }
  });
  const handleManualSave = () => runAction(async hotelId => {
    await upsertMetrics(hotelId, [{ ...manualEntry, source: "manual" }], userId);
    if (active.current) setShowManual(false);
  });
  const handleDeleteMetric = (id: string) => {
    if (window.confirm(t("confirmDelete"))) void runAction(hotelId => deleteMetric(id, hotelId, userId));
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12 [overflow-wrap:anywhere]">
      <fieldset disabled={busy} aria-busy={busy} className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/hotellerie`} className="text-xs text-muted hover:text-navy">{t("hubLink")}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>

        {metrics.some(r=>r.source === "forecast_seed") && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t("excludedDemo")}</p>}
        {error && <div role="alert" className="mt-4 text-sm text-rose-700"><p>{error}</p><button className="mt-2 underline" onClick={() => activeHotelId ? void refreshMetrics(activeHotelId) : setReload(v => v + 1)}>{t("retry")}</button></div>}
        {(hotelsLoading || metricsLoading) && <p role="status" className="mt-4 text-sm">{t("loading")}</p>}

        {!hotelsLoading && !error && hotels.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <p className="text-sm text-muted">
              {t("noHotel")}{" "}
              <Link href={`${lp}/hotellerie/groupe`} className="text-navy underline">{t("noHotelLink")}</Link>
              {" "}{t("noHotelSuffix")}
            </p>
          </div>
        )}

        {hotels.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="text-xs text-muted">{t("hotelLabel")}</label>
              <select value={activeHotelId ?? ""} onChange={(e) => {if(e.target.value===activeHotelId)return;metricsRequest.current++;setMetrics([]);setError(null);setShowManual(false);setShowCsvImport(false);setCsvText("");setManualEntry({metric_date:invoiceDate(),occupancy:NaN,adr:NaN});setActiveHotelId(e.target.value)}}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm">
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>

              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={() => setShowManual(!showManual)}
                  className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                  {t("manualEntry")}
                </button>
                <button onClick={() => setShowCsvImport(!showCsvImport)}
                  className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                  {t("importCsv")}
                </button>

              </div>
            </div>

            {showManual && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs text-muted">{t("dateLabel")}</label>
                    <input type="date" value={manualEntry.metric_date}
                      onChange={(e) => setManualEntry({ ...manualEntry, metric_date: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">{t("occupancyLabel")}</label>
                    <input type="number" min="0" max="1" step="0.01" value={Number.isFinite(manualEntry.occupancy)?manualEntry.occupancy:""}
                      onChange={(e) => setManualEntry({ ...manualEntry, occupancy: e.target.value === "" ? NaN : Number(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">{t("adrLabel")}</label>
                    <input type="number" min="0" step="1" value={Number.isFinite(manualEntry.adr)?manualEntry.adr:""}
                      onChange={(e) => setManualEntry({ ...manualEntry, adr: e.target.value === "" ? NaN : Number(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleManualSave}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      {t("save")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCsvImport && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                <label className="text-xs text-muted">
                  {t("csvFormat")}
                </label>
                <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
                  placeholder="date,occupancy,adr&#10;2026-01-01,0.75,120&#10;2026-01-02,0.82,125"
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono"
                  rows={8} />
                <div className="mt-2 flex justify-end">
                  <button onClick={handleImportCsv} disabled={!csvText.trim()}
                    className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40">
                    {t("importBtn")}
                  </button>
                </div>
              </div>
            )}

            {/* Metric + horizon selectors */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-card-border bg-card">
                {(["occupancy", "adr", "revpar"] as MetricKey[]).map((m) => (
                  <button key={m} onClick={() => setActiveMetric(m)}
                    className={`px-3 py-1.5 text-xs ${activeMetric === m ? "bg-navy text-white" : "text-navy"} ${m === "occupancy" ? "rounded-l-lg" : m === "revpar" ? "rounded-r-lg" : ""}`}>
                    {t(METRIC_I18N_KEY[m])}
                  </button>
                ))}
              </div>
              <label className="flex flex-wrap items-center gap-2 text-xs text-muted">{t("variationLabel")}<input id="hotel-variation" type="number" min={0} max={100} value={Number.isFinite(variation)?variation:""} onChange={e=>setVariation(e.target.value===""?NaN:Number(e.target.value))} className="w-20 rounded border border-input-border bg-input-bg p-2" /></label>
              <label className="text-xs text-muted">{t("horizonLabel")}</label>
              <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm">
                <option value={30}>{t("days30")}</option>
                <option value={60}>{t("days60")}</option>
                <option value={90}>{t("days90")}</option>
                <option value={120}>{t("days120")}</option>
                <option value={180}>{t("days180")}</option>
              </select>
            </div>

            {/* Chart + KPIs */}
            {!metricsLoading && !error && (forecast ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <KpiCard label={t("kpiAvgHistorical", { metric: t(METRIC_I18N_KEY[activeMetric]) })}
                    value={activeMetric === "occupancy"
                      ? `${(avg(forecast.historical.map((p) => p.value)) * 100).toFixed(1)} %`
                      : formatEUR(avg(forecast.historical.map((p) => p.value)))} />
                  <KpiCard label={t("kpiAvgForecast", { metric: t(METRIC_I18N_KEY[activeMetric]) })}
                    value={activeMetric === "occupancy"
                      ? `${(avg(forecast.forecast.map((p) => p.value)) * 100).toFixed(1)} %`
                      : formatEUR(avg(forecast.forecast.map((p) => p.value)))} />
                  <KpiCard label={t("variationLabel")} value={`± ${variation} %`} />
                  <KpiCard label={t("kpiHistoryPoints")} value={String(forecast.historical.length)} />
                </div>

                <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                  <ForecastChart forecast={forecast} color={METRIC_COLOR[activeMetric]} metric={activeMetric}
                    labels={{ today: t("chartToday"), historical: t("legendHistorical"), forecast: t("legendForecast"), ci: t("legendCi") }} />
                </div>

                {/* Forecast table */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-navy hover:underline">
                    {t("showForecastValues", { count: forecast.forecast.length })}
                  </summary>
                  <div className="mt-2 overflow-x-auto rounded-xl border border-card-border bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-3 py-2">{t("thDate")}</th>
                          <th className="px-3 py-2 text-right">{t("thForecast")}</th>
                          <th className="px-3 py-2 text-right">{t("thCiLow")}</th>
                          <th className="px-3 py-2 text-right">{t("thCiHigh")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {forecast.forecast.map((p) => (
                          <tr key={p.date}>
                            <td className="px-3 py-1.5">{new Date(p.date+"T00:00:00Z").toLocaleDateString(locale === "lb" ? "de-DE" : locale,{timeZone:"UTC", weekday: "short", day: "2-digit", month: "short" })}</td>
                            <td className="px-3 py-1.5 text-right font-medium">
                              {activeMetric === "occupancy" ? `${(p.value * 100).toFixed(1)} %` : formatEUR(p.value)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-muted">
                              {activeMetric === "occupancy" ? `${(p.lower * 100).toFixed(1)} %` : formatEUR(p.lower)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-muted">
                              {activeMetric === "occupancy" ? `${(p.upper * 100).toFixed(1)} %` : formatEUR(p.upper)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
                {t("minDataWarning")}
              </div>
            ))}

            {/* Recent metrics table */}
            {metrics.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-navy hover:underline">
                  {t("showHistory", { count: Math.min(metrics.length, 60) })}
                </summary>
                <div className="mt-2 overflow-x-auto rounded-xl border border-card-border bg-card max-h-96">
                  <table className="w-full text-xs">
                    <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2">{t("thDate")}</th>
                        <th className="px-3 py-2 text-right">{t("thOccupation")}</th>
                        <th className="px-3 py-2 text-right">{t("thAdr")}</th>
                        <th className="px-3 py-2 text-right">{t("thRevpar")}</th>
                        <th className="px-3 py-2">{t("thSource")}</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                      {metrics.slice().reverse().slice(0, 60).map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-1.5">{new Date(m.metric_date+"T00:00:00Z").toLocaleDateString(locale === "lb" ? "de-DE" : locale,{timeZone:"UTC"})}</td>
                          <td className="px-3 py-1.5 text-right">{m.occupancy !== null ? `${(m.occupancy * 100).toFixed(1)} %` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{m.adr !== null ? formatEUR(m.adr) : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{m.revpar !== null ? formatEUR(m.revpar) : "—"}</td>
                          <td className="px-3 py-1.5 text-muted text-[10px]">{m.source}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button onClick={() => handleDeleteMetric(m.id)}
                              className="rounded p-1 text-muted hover:text-rose-600" title={t("deleteTitle")}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        )}

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          {t("methodology")}
        </div>
      </fieldset>
    </div>
  );
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="mt-1 text-xl font-bold text-navy">{value}</div>
    </div>
  );
}

// ---------- SVG chart ----------

function ForecastChart({ forecast, color, metric, labels }: {
  forecast: { historical: { date: string; value: number }[]; forecast: { date: string; value: number; lower: number; upper: number }[] };
  color: string;
  metric: MetricKey;
  labels: { today: string; historical: string; forecast: string; ci: string };
}) {
  const W = 900, H = 260, pad = 32;
  const all = [...forecast.historical, ...forecast.forecast];
  if (all.length === 0) return null;

  // Limit historical points to last 120 for readability
  const hist = forecast.historical.slice(-120);
  const fcast = forecast.forecast;
  const display = [...hist, ...fcast];

  const ys = display.map((p) => "value" in p ? p.value : 0);
  const lowers = fcast.map((p) => p.lower);
  const uppers = fcast.map((p) => p.upper);
  const yMin = Math.min(...ys, ...lowers);
  const yMax = Math.max(...ys, ...uppers);
  const yRange = yMax - yMin || 1;

  const x = (i: number) => pad + (i / (display.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);

  const histPath = hist.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const fcastPath = fcast.map((p, i) => `${i === 0 ? "M" : "L"}${x(hist.length + i)},${y(p.value)}`).join(" ");
  const bandPath = fcast.length > 0
    ? fcast.map((p, i) => `${i === 0 ? "M" : "L"}${x(hist.length + i)},${y(p.upper)}`).join(" ") +
      " " + fcast.slice().reverse().map((p, i) => `L${x(hist.length + fcast.length - 1 - i)},${y(p.lower)}`).join(" ") + " Z"
    : "";

  const fmtY = (v: number) => metric === "occupancy" ? `${(v * 100).toFixed(0)} %` : `${v.toFixed(0)} €`;

  // Gridlines
  const ticks = 4;
  const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
    const tv = yMin + (yRange * i) / ticks;
    return { y: y(tv), label: fmtY(tv) };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]">
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={g.y} y2={g.y} stroke="#E5E7EB" strokeWidth={1} />
            <text x={pad - 6} y={g.y + 3} fontSize={9} fill="#6B7280" textAnchor="end">{g.label}</text>
          </g>
        ))}
        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill={color} opacity={0.12} />}
        {/* Historical line */}
        <path d={histPath} stroke={color} strokeWidth={1.5} fill="none" />
        {/* Forecast line (dashed) */}
        <path d={fcastPath} stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
        {/* Separator between historical and forecast */}
        {fcast.length > 0 && (
          <line x1={x(hist.length - 0.5)} x2={x(hist.length - 0.5)} y1={pad} y2={H - pad}
            stroke="#94A3B8" strokeWidth={1} strokeDasharray="2 2" />
        )}
        {/* X-axis labels : first, boundary, last */}
        <text x={pad} y={H - pad + 14} fontSize={9} fill="#6B7280">{display[0]?.date.slice(5)}</text>
        {fcast.length > 0 && (
          <text x={x(hist.length - 0.5)} y={H - pad + 14} fontSize={9} fill="#6B7280" textAnchor="middle">
            {labels.today}
          </text>
        )}
        <text x={W - pad} y={H - pad + 14} fontSize={9} fill="#6B7280" textAnchor="end">
          {display[display.length - 1]?.date.slice(5)}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-0.5" style={{ backgroundColor: color }}></span> {labels.historical}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 border-b border-dashed" style={{ borderColor: color }}></span> {labels.forecast}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: color, opacity: 0.12 }}></span> {labels.ci}
        </span>
      </div>
    </div>
  );
}
