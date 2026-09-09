"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listHotels, createHotel, deleteHotel, type Hotel, type HotelCategory } from "@/lib/hotels";
import { hotelGroupTotals } from "@/lib/hotel-group";

export default function HotelGroupDashboard() {
  const { user, loading } = useAuth();
  const t = useTranslations("hotelGroupe");
  const locale = useLocale();
  if (loading) return <p role="status" className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6 text-center"><p>{t("login")}</p><Link className="mt-4 inline-block underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{t("loginBtn")}</Link></div>;
  if (!isSupabaseConfigured) return <p className="p-6">{t("unavailable")}</p>;
  return <Groups key={user.id} />;
}

function Groups() {
  const t = useTranslations("hotelGroupe");
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void listMyOrganizations().then(list => { if (active) { setOrgs(list.filter(o => o.org_type === "hotel_group")); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [retry]);
  const org = orgs?.find(o => o.id === selected) ?? orgs?.[0];
  return <div className="mx-auto max-w-6xl px-4 py-10">
    <Link className="text-sm underline" href={`${prefix}/hotellerie`}>{t("hubLink")}</Link>
    <h1 className="mt-3 text-2xl font-bold">{t("title")}</h1>
    <p className="mt-3 text-sm">{t("subtitle")} {t("linkSubtitle")}</p>
    {error && <div className="mt-4"><p role="alert">{t("error")}</p><button className="underline" onClick={() => { setError(false); setRetry(n => n + 1); }}>{t("retry")}</button></div>}
    {!orgs && !error && <p role="status" className="mt-4">{t("loading")}</p>}
    {orgs?.length === 0 && <div className="mt-6 rounded-lg border p-4"><h2 className="font-semibold">{t("noGroup")}</h2><p className="mt-2">{t("noGroupDesc")}</p><Link className="mt-3 inline-block underline" href={`${prefix}/profil/organisation`}>{t("createGroup")}</Link></div>}
    {!!orgs?.length && <label className="mt-5 block text-sm" htmlFor="hotel-group-org">{t("groupLabel")}<select id="hotel-group-org" value={org?.id ?? ""} onChange={e => setSelected(e.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border p-2">{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
    {org && <GroupHotels key={org.id} org={org} />}
  </div>;
}

function GroupHotels({ org }: { org: Organization }) {
  const t = useTranslations("hotelGroupe");
  const locale = useLocale();
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const [hotels, setHotels] = useState<Hotel[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [commune, setCommune] = useState("");
  const [category, setCategory] = useState<HotelCategory>("midscale");
  const [rooms, setRooms] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    void listHotels(org.id).then(list => { if (active) { setHotels(list); setLoadError(false); } }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [org.id, retry]);
  const mutate = async (action: () => Promise<unknown>, created = false) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      await action();
      if (alive.current) { setHotels(null); setRetry(n => n + 1); if (created) { setShowCreate(false); setName(""); setCommune(""); setRooms(""); } }
    } catch { if (alive.current) setError(true); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const totals = hotels ? hotelGroupTotals(hotels) : null;
  const money = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) && n >= 0 ? new Intl.NumberFormat(locale === "lb" ? "de-DE" : locale, { style: "currency", currency: "EUR" }).format(n) : t("unknown");
  return <section className="mt-6" aria-label={org.name}>
    {loadError && <div><p role="alert">{t("error")}</p><button className="underline" onClick={() => { setLoadError(false); setRetry(n => n + 1); }}>{t("retry")}</button></div>}
    {!hotels && !loadError && <p role="status">{t("loading")}</p>}
    {totals && <><dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border p-4"><dt>{t("establishments")}</dt><dd data-total="hotels" className="mt-2 text-xl font-bold">{hotels!.length}</dd></div>
      <div className="rounded-lg border p-4"><dt>{t("totalRooms")}</dt><dd data-total="rooms" className="mt-2 text-xl font-bold">{totals.rooms ?? t("unknown")}</dd></div>
      <div className="rounded-lg border p-4"><dt>{t("capexCumul")}</dt><dd data-total="acquisition" className="mt-2 break-words text-xl font-bold">{money(totals.acquisition)}</dd></div>
    </dl><p className="mt-3 text-sm">{t("totalScope")}</p></>}
    <button id="hotel-group-add" disabled={busy} className="mt-5 rounded-lg bg-navy p-3 text-white disabled:opacity-50" onClick={() => setShowCreate(!showCreate)}>{t(showCreate ? "cancel" : "addHotel")}</button>
    {showCreate && <form className="mt-4 rounded-lg border p-4" onSubmit={e => { e.preventDefault(); void mutate(() => createHotel({ org_id: org.id, name, commune, category, nb_chambres: Number(rooms) }), true); }}>
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm" htmlFor="hotel-group-name">{t("hotelName")}<input id="hotel-group-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
        <label className="min-w-0 text-sm" htmlFor="hotel-group-category">{t("category")}<select id="hotel-group-category" value={category} onChange={e => setCategory(e.target.value as HotelCategory)} className="mt-1 block w-full rounded-lg border p-2">{(["budget", "midscale", "upscale", "luxury"] as const).map(c => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="min-w-0 text-sm" htmlFor="hotel-group-commune">{t("commune")}<input id="hotel-group-commune" maxLength={160} value={commune} onChange={e => setCommune(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
        <label className="min-w-0 text-sm" htmlFor="hotel-group-rooms">{t("nbRooms")}<input id="hotel-group-rooms" required type="number" min="1" max="100000" step="1" value={rooms} onChange={e => setRooms(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
      </fieldset>
      <button id="hotel-group-save" disabled={busy || !name.trim()} className="mt-4 rounded-lg bg-emerald-700 p-3 text-white disabled:opacity-50">{t(busy ? "loading" : "createHotel")}</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-red-700">{t("error")}</p>}
    {hotels?.length === 0 && <p className="mt-4">{t("noHotelDesc")}</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{hotels?.map(h => <article key={h.id} data-hotel={h.id} className="min-w-0 rounded-lg border p-4">
      <h2 className="break-words text-lg font-semibold"><Link className="underline" href={`${prefix}/hotellerie/groupe/${h.id}`}>{h.name}</Link></h2>
      <p className="mt-2 text-sm">{h.commune} · {h.nb_chambres > 0 ? `${h.nb_chambres} ${t("roomsCount")}` : t("roomsNotSet")}</p>
      <p className="mt-2 text-sm">{t("acquisitionPrice")} : {money(h.prix_acquisition)}</p>
      <div className="mt-4 flex flex-wrap gap-3"><Link className="rounded-lg border p-2 text-sm" href={`${prefix}/hotellerie/groupe/${h.id}`}>{t("openFile")}</Link><button disabled={busy} className="rounded-lg border p-2 text-sm" data-delete onClick={() => { if (confirm(t("deleteConfirm"))) void mutate(() => deleteHotel(h.id)); }}>{t("deleteBtn")}</button></div>
    </article>)}</div>
    <p className="mt-6 text-sm">{t("toolScope")}</p>
    <div className="mt-3 flex flex-wrap gap-3">{["valorisation", "dscr", "exploitation", "compset", "renovation"].map((route, i) => <Link key={route} className="rounded-lg border p-2 text-sm" href={`${prefix}/hotellerie/${route}`}>{t(["valorisation", "dscr", "exploitation", "revpar", "renovation"][i])}</Link>)}</div>
  </section>;
}
