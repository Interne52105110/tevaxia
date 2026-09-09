"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listHotels, type Hotel, type HotelPeriod } from "@/lib/hotels";

type Row = { hotel: Hotel; period: Pick<HotelPeriod, "revpar" | "adr" | "occupancy" | "gop_margin"> | null };
type State<T> = { key: string; value?: T; error?: boolean };

export default function HotelBenchmarkPage() {
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("hotelBenchmark");
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const userId = user?.id ?? "";
  const [organizations, setOrganizations] = useState<State<Organization[]>>({ key: "" });
  const [selection, setSelection] = useState({ owner: "", id: "" });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState<State<Row[]>>({ key: "" });
  const [retry, setRetry] = useState(0);
  const orgs = organizations.key === userId ? organizations.value : undefined;
  const activeOrgId = selection.owner === userId && orgs?.some(o => o.id === selection.id)
    ? selection.id : orgs?.[0]?.id ?? "";
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  const datesValid = validDate(start) && validDate(end) && end >= start;
  const key = JSON.stringify([userId, activeOrgId, start, end, retry]);
  const rows = result.key === key ? result.value : undefined;
  const error = organizations.key === userId && organizations.error || result.key === key && result.error;

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;
    let active = true;
    void listMyOrganizations().then(list => {
      if (active) setOrganizations({ key: userId, value: list.filter(o => o.org_type === "hotel_group") });
    }).catch(() => {
      if (active) setOrganizations({ key: userId, error: true });
    });
    return () => { active = false; };
  }, [userId, retry]);

  useEffect(() => {
    if (!userId || !activeOrgId || !datesValid || !supabase) return;
    let active = true;
    const client = supabase;
    void (async () => {
      const hotels = await listHotels(activeOrgId);
      const value = await Promise.all(hotels.map(async hotel => {
        const { data, error } = await client.from("hotel_periods")
          .select("revpar, adr, occupancy, gop_margin")
          .eq("hotel_id", hotel.id).eq("period_start", start).eq("period_end", end).maybeSingle();
        if (error) throw error;
        return { hotel, period: data } as Row;
      }));
      value.sort((a, b) => a.hotel.name.localeCompare(b.hotel.name, locale));
      if (active) setResult({ key, value });
    })().catch(() => { if (active) setResult({ key, error: true }); });
    return () => { active = false; };
  }, [userId, activeOrgId, datesValid, start, end, key, locale]);

  const numberLocale = locale === "lb" ? "de-DE" : locale;
  const money = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) && n >= 0
    ? new Intl.NumberFormat(numberLocale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n) : "—";
  const percent = (n: number | null | undefined, occupancy = false) => typeof n === "number" && Number.isFinite(n) && (!occupancy || n >= 0 && n <= 1)
    ? new Intl.NumberFormat(numberLocale, { style: "percent", maximumFractionDigits: 1 }).format(n) : "—";

  if (!isSupabaseConfigured) return <div className="mx-auto max-w-4xl p-6">{t("supabaseRequired")}</div>;
  if (authLoading) return <p role="status" className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6 text-center"><Link href={`${prefix}/connexion`} className="underline">{t("signIn")}</Link></div>;

  return <div className="mx-auto max-w-7xl px-4 py-10">
    <Link href={`${prefix}/hotellerie`} className="text-sm underline">{t("backHub")}</Link>
    <h1 className="mt-3 text-2xl font-bold">{t("pageTitle")}</h1>
    <p className="mt-3 text-sm">{t("periodScope")}</p>
    {error && <div className="mt-4 rounded-lg border border-red-300 p-4"><p role="alert">{t("loadError")}</p><button onClick={() => setRetry(n => n + 1)} className="mt-2 underline">{t("retry")}</button></div>}
    {!orgs && !error && <p role="status" className="mt-4">{t("loading")}</p>}
    {orgs?.length === 0 && <p className="mt-4">{t("noOrgs")} <Link href={`${prefix}/profil/organisation`} className="underline">{t("organization")}</Link></p>}
    {!!orgs?.length && <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="min-w-0 text-sm" htmlFor="benchmark-org">{t("organization")}<select id="benchmark-org" value={activeOrgId} onChange={e => setSelection({ owner: userId, id: e.target.value })} className="mt-1 block w-full min-w-0 rounded-lg border p-2">{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label className="min-w-0 text-sm" htmlFor="benchmark-start">{t("periodStart")}<input id="benchmark-start" type="date" value={start} onChange={e => setStart(e.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border p-2" /></label>
        <label className="min-w-0 text-sm" htmlFor="benchmark-end">{t("periodEnd")}<input id="benchmark-end" type="date" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border p-2" /></label>
      </div>
      {!datesValid && <p className="mt-4">{t("choosePeriod")}</p>}
      {datesValid && !rows && !error && <p role="status" className="mt-4">{t("loading")}</p>}
      {rows?.length === 0 && <p className="mt-4">{t("noHotels")}</p>}
      {!!rows?.length && <div className="mt-6 overflow-x-auto rounded-lg border" role="region" aria-label={t("pageTitle")} tabIndex={0}>
        <table className="w-full min-w-[700px] text-sm">
          <caption className="p-3 text-left">{start} → {end}. {t("missingScope")}</caption>
          <thead><tr>{["thHotel", "thRooms", "thRevpar", "thAdr", "thOcc", "thGop"].map(k => <th key={k} scope="col" className="p-3 text-left">{t(k)}</th>)}</tr></thead>
          <tbody>{rows.map(({ hotel: h, period: p }) => <tr key={h.id} data-hotel={h.id} className="border-t">
            <th scope="row" className="p-3 text-left font-medium"><Link className="underline" href={`${prefix}/hotellerie/groupe/${h.id}`}>{h.name}</Link>{!p && <p className="mt-1 font-normal">{t("noExactPeriod")}</p>}</th>
            <td className="p-3">{h.nb_chambres}</td><td data-metric="revpar" className="p-3">{money(p?.revpar)}</td><td data-metric="adr" className="p-3">{money(p?.adr)}</td><td data-metric="occupancy" className="p-3">{percent(p?.occupancy, true)}</td><td data-metric="gop" className="p-3">{percent(p?.gop_margin)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </>}
    <p className="mt-6 text-sm">{t("noAggregate")} <Link href={`${prefix}/hotellerie/compset`} className="underline">{t("documentedComparison")}</Link></p>
  </div>;
}
