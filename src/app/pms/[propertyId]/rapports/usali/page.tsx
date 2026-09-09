"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { JOURNAL_LABEL_KEYS, loadMonthlyJournal, type MonthlyJournal } from "@/lib/pms/monthly-journal";
import UsaliReportPdf from "@/components/UsaliReportPdf";

export default function MonthlyJournalPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params);
  const { user, loading } = useAuth();
  const t = useTranslations("pmsJournal"), locale = useLocale(), lp = locale === "fr" ? "" : `/${locale}`;
  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!user) return <div className="p-6"><h1 className="text-2xl font-bold">{t("title")}</h1><Link className="mt-4 inline-block underline" href={`${lp}/connexion`}>{t("signIn")}</Link></div>;
  return <JournalSelection key={`${user.id}:${propertyId}`} userId={user.id} propertyId={propertyId} />;
}
function JournalSelection({ userId, propertyId }: { userId: string; propertyId: string }) {
  const t = useTranslations("pmsJournal"), locale = useLocale(), lp = locale === "fr" ? "" : `/${locale}`;
  const [month, setMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
  const [attempt, setAttempt] = useState(0);
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && +month.slice(0, 4) >= 1900 && +month.slice(0, 4) <= 2200;
  return <div className="mx-auto max-w-6xl px-2 py-6 sm:px-4 [overflow-wrap:anywhere]">
    <Link className="text-sm underline" href={`${lp}/pms/${propertyId}`}>{t("back")}</Link>
    <h1 className="mt-4 text-2xl font-bold text-navy">{t("title")}</h1><p className="mt-2 text-muted">{t("description")}</p>
    <label className="mt-5 block max-w-xs" htmlFor="journal-month">{t("month")}<input id="journal-month" type="month" min="1900-01" max="2200-12" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 block w-full min-w-0 rounded-lg border border-card-border bg-card p-3" /></label>
    {valid ? <JournalResult key={`${month}:${attempt}`} userId={userId} propertyId={propertyId} month={month} retry={() => setAttempt(a => a + 1)} /> : <p className="mt-4" role="alert">{t("error")}</p>}
  </div>;
}
function JournalResult({ userId, propertyId, month, retry }: { userId: string; propertyId: string; month: string; retry: () => void }) {
  const t = useTranslations("pmsJournal"), locale = useLocale();
  const [state, setState] = useState<{ report?: MonthlyJournal; failed?: boolean }>({});
  const [busy, setBusy] = useState(false), [downloadError, setDownloadError] = useState(false);
  const locked = useRef(false), alive = useRef(true);
  useEffect(() => {
    let active = true; alive.current = true;
    loadMonthlyJournal(userId, propertyId, +month.slice(0, 4), +month.slice(5)).then(report => { if (active) setState({ report }); }).catch(() => { if (active) setState({ failed: true }); });
    return () => { active = false; alive.current = false; };
  }, [userId, propertyId, month]);
  if (state.failed) return <div className="mt-6 rounded-xl border border-rose-300 p-4"><p role="alert">{t("error")}</p><button id="journal-retry" onClick={retry} className="mt-3 rounded border px-4 py-2">{t("retry")}</button></div>;
  if (!state.report) return <p className="mt-6" role="status">{t("loading")}</p>;
  const r = state.report, labels = Object.fromEntries(JOURNAL_LABEL_KEYS.map(key => [key, t(key)]));
  const number = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale);
  const money = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  async function download() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setDownloadError(false);
    try {
      const blob = await pdf(<UsaliReportPdf report={r} labels={labels} locale={locale} />).toBlob();
      if (!alive.current) return;
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `tevaxia-pms-journal-${month}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { if (alive.current) setDownloadError(true); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  const label = (category: string) => labels[`cat_${category}`] ?? labels[category] ?? category;
  return <div data-journal-report={month}>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><h2 className="min-w-0 text-xl font-bold">{r.propertyName}</h2><button id="journal-pdf" disabled={busy} onClick={download} className="rounded-lg bg-navy px-4 py-3 text-white disabled:opacity-50">{t(busy ? "downloading" : "download")}</button></div>
    {downloadError && <p className="mt-3" role="alert">{t("downloadError")}</p>}
    <p className="mt-2">{r.start} – {r.end} · UTC</p><p className="mt-4 rounded-xl border border-card-border bg-card p-4 text-sm leading-relaxed">{t("scope")}</p>
    <section className="mt-6"><h2 className="text-xl font-bold">{t("journal")}</h2>{r.rows.length === 0 && <p className="mt-3">{t("empty")}</p>}
      <div className="mt-3 overflow-x-auto rounded-lg border border-card-border" tabIndex={0} role="region" aria-label={t("journal")}><table className="w-full min-w-[620px] text-sm"><thead className="bg-navy text-white"><tr>{["category", "count", "ht", "vat", "gross"].map(key => <th key={key} className="p-3 text-left">{t(key)}</th>)}</tr></thead><tbody>
        {[...r.rows, r.operating, r.taxes, r.total].map((row, index) => <tr data-journal-row={row.category} key={`${index}:${row.category}`} className={index >= r.rows.length ? "border-t bg-card font-semibold" : "border-t"}><th scope="row" className="p-3 text-left">{label(row.category)}</th><td className="p-3">{number.format(row.count)}</td>{["ht", "vat", "gross"].map(key => <td key={key} data-amount={key} className="whitespace-nowrap p-3 text-right tabular-nums">{money.format(row[key as "ht" | "vat" | "gross"])}</td>)}</tr>)}
      </tbody></table></div><p className="mt-3 text-sm">{t("pdfScope")}</p><a className="mt-2 inline-block text-sm underline" href="https://pfi.public.lu/fr/citoyen/tva/taux-tva.html" target="_blank" rel="noreferrer">{t("taxSource")}</a>
    </section>
    <section className="mt-8"><h2 className="text-xl font-bold">{t("inventory")}</h2><p className="mt-3 text-sm leading-relaxed">{t("inventoryScope")}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["coverage", `${r.recordedDays} / ${r.days}`], ["closedDays", r.closedDays], ["available", r.available], ["occupied", r.occupied], ["occupancy", r.occupancy == null ? t("unknown") : number.format(r.occupancy) + " %"]].map(([key, value]) => <div key={key} className="rounded-xl border border-card-border p-4"><dt>{t(String(key))}</dt><dd data-journal-value={key} className="mt-2 text-xl font-bold">{value}</dd></div>)}</dl>
      {r.audits.length > 0 && <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={t("inventory")}><table className="w-full min-w-[500px] text-sm"><thead><tr>{["date", "available", "occupied", "closed"].map(key => <th key={key} className="p-3 text-left">{t(key)}</th>)}</tr></thead><tbody>{r.audits.map(a => <tr key={a.audit_date} className="border-t"><td className="p-3">{a.audit_date}</td><td className="p-3">{number.format(a.total_rooms)}</td><td className="p-3">{number.format(a.occupied_rooms)}</td><td className="p-3">{t(a.closed ? "closed" : "open")}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
