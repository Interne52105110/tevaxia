"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import HotelOwnerReportPdf from "@/components/HotelOwnerReportPdf";
import { getHotel, listPeriods, savePeriod, type Hotel, type HotelPeriod } from "@/lib/hotels";
import { periodFields, prepareHotelPeriod, type PeriodField } from "@/lib/hotel-period";
import { listMyOrganizations } from "@/lib/orgs";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function HotelDetailPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("hotelDetail");
  const params = useParams();
  if (loading) return <p role="status" className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6 text-center"><Link className="underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{t("signIn")}</Link></div>;
  if (!isSupabaseConfigured) return <p className="p-6">{t("unavailable")}</p>;
  return <HotelDetail key={`${user.id}:${params.id}`} id={String(params.id ?? "")} />;
}

function HotelDetail({ id }: { id: string }) {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("hotelDetail");
  const [data, setData] = useState<{ hotel: Hotel | null; periods: HotelPeriod[]; group: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState<Partial<HotelPeriod> | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      const hotel = await getHotel(id);
      const [periods, orgs] = hotel ? await Promise.all([listPeriods(id), listMyOrganizations()]) : [[], []];
      if (active) { setData({ hotel, periods, group: orgs.find(o => o.id === hotel?.org_id)?.name ?? "" }); setLoadError(false); }
    })().catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [id, reload]);
  const money = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat(locale === "lb" ? "de-DE" : locale, { style: "currency", currency: "EUR" }).format(n) : t("unknown");
  const save = async () => {
    if (!draft || !data?.hotel || lock.current) return;
    let input;
    try { input = prepareHotelPeriod(draft, id, draft.id); }
    catch (e) { setError(t(e instanceof Error ? e.message : "error")); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      await savePeriod(input);
      if (alive.current) { setDraft(null); setData(null); setReload(n => n + 1); }
    } catch { if (alive.current) setError(t("error")); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const report = async (period: HotelPeriod) => {
    if (!data?.hotel || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const keys = [...Object.values(periodFields), "reportTitle", "reportDate", "historyScope", "ownerReportInfo", "notesPlaceholder", "revenuTotal", "revparAuto", "unknown", "rooms"];
      const labels = Object.fromEntries(keys.map(k => [k, t(k)]));
      const blob = await pdf(<HotelOwnerReportPdf hotel={data.hotel} period={period} groupName={data.group} locale={locale} labels={labels} />).toBlob();
      if (!alive.current) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `hotel-report-${period.period_start}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { if (alive.current) setError(t("error")); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return <div className="mx-auto max-w-6xl px-4 py-10">
    <Link className="text-sm underline" href={`${lp}/hotellerie/groupe`}>{t("backToGroup")}</Link>
    {loadError && <div className="mt-4"><p role="alert">{t("error")}</p><button className="underline" onClick={() => { setLoadError(false); setReload(n => n + 1); }}>{t("retry")}</button></div>}
    {!data && !loadError && <p className="mt-4" role="status">{t("loading")}</p>}
    {data && !data.hotel && <p className="mt-4">{t("notFound")}</p>}
    {data?.hotel && <>
      <h1 className="mt-4 break-words text-2xl font-bold">{data.hotel.name}</h1>
      <p className="mt-2 text-sm">{data.hotel.nb_chambres} {t("rooms")} · {data.hotel.commune}</p>
      <p className="mt-4 rounded-lg border p-4 text-sm">{t("scope")}</p>
      <button id="period-add" disabled={busy} className="mt-4 rounded-lg bg-navy p-3 text-white disabled:opacity-50" onClick={() => { setDraft(draft ? null : {}); setError(""); }}>{t(draft ? "cancelBtn" : "addPeriod")}</button>
      {draft && <form className="mt-4 rounded-lg border p-4" onSubmit={e => { e.preventDefault(); void save(); }}>
        <h2 className="font-semibold">{t(draft.id ? "editPeriodTitle" : "newPeriodTitle")}</h2>
        {draft.id && <p className="mt-2 text-sm">{t("editScope")}</p>}
        <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["period_label", "period_start", "period_end"] as const).map((key, i) => <label key={key} className="min-w-0 text-sm" htmlFor={`period-${key}`}>{t(["periodLabelPlaceholder", "startDate", "endDate"][i])}<input id={`period-${key}`} className="mt-1 block w-full min-w-0 rounded-lg border p-2" type={i ? "date" : "text"} maxLength={160} required={i > 0} value={draft[key] ?? ""} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
          {(Object.keys(periodFields) as PeriodField[]).map(key => <label key={key} className="min-w-0 text-sm" htmlFor={`period-${key}`}>{t(periodFields[key])}<input id={`period-${key}`} type="number" step={key === "occupancy" || ["mpi", "ari", "rgi"].includes(key) ? "0.0001" : "0.01"} min={key === "gop" || key === "ebitda" ? -1e9 : 0} max={key === "occupancy" ? 1 : 1e9} value={draft[key] ?? ""} onChange={e => setDraft({ ...draft, [key]: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 block w-full min-w-0 rounded-lg border p-2" /></label>)}
          <label className="min-w-0 text-sm sm:col-span-2 lg:col-span-3" htmlFor="period-notes">{t("notesPlaceholder")}<textarea id="period-notes" required maxLength={3000} rows={4} value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /></label>
        </fieldset>
        <button id="period-save" disabled={busy} className="mt-4 rounded-lg bg-emerald-700 p-3 text-white disabled:opacity-50">{busy ? t("loading") : t("saveBtn")}</button>
      </form>}
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      <h2 className="mt-8 text-xl font-semibold">{t("periodsTitle")}</h2>
      <p className="mt-3 text-sm">{t("historyScope")}</p>
      {!data.periods.length && <p className="mt-4">{t("noPeriods")}</p>}
      {data.periods.map(p => <article data-period={p.id} key={p.id} className="mt-4 rounded-lg border p-4">
        <h3 className="break-words font-semibold">{p.period_label}</h3><p className="mt-1 text-sm">{p.period_start} → {p.period_end}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(["revenue_total", "gop", "ebitda", "ffe_reserve"] as const).map((key, i) => <div key={key}><dt className="text-sm">{t(["revenuTotal", "gopLabel", "ebitdaLabel", "ffeLabel"][i])}</dt><dd className="break-words font-semibold" data-metric={key}>{money(p[key])}</dd></div>)}</dl>
        <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} data-report className="rounded-lg border p-2 text-sm disabled:opacity-50" onClick={() => void report(p)}>{t("ownerReportPdf")}</button><button disabled={busy} data-edit className="rounded-lg border p-2 text-sm" onClick={() => { setDraft({ ...p, gop: null, ebitda: null, ffe_reserve: null }); setError(""); }}>{t("editBtn")}</button></div>
      </article>)}
      <p className="mt-6 text-sm">{t("ownerReportInfo")}</p>
    </>}
  </div>;
}
