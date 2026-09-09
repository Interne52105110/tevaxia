"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listHistory, deleteHistoryEntry, assertHistoryOwner, type FacturXHistoryEntry } from "@/lib/facturation/history";

function formatEUR(n: number, currency = "EUR", locale = "fr"): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export default function HistoriquePage() {
  const { user, loading } = useAuth();
  const t = useTranslations("facturation.historique");
  const locale = useLocale(), lp = locale === "fr" ? "" : `/${locale}`;
  if (loading) return <div className="p-12 text-center">{t("loading")}</div>;
  if (!user) return <div className="p-12 text-center"><Link href={`${lp}/connexion`} className="underline">{t("signIn")}</Link></div>;
  return <HistoryContent key={user.id} userId={user.id} />;
}

function HistoryContent({ userId }: { userId: string }) {
  const t = useTranslations("facturation.historique");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const [entries, setEntries] = useState<FacturXHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const active = useRef(false), operation = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    listHistory(200, userId).then(rows => { if (!cancelled) setEntries(rows); })
      .catch(() => { if (!cancelled) setError(t("loadError")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, reload, t]);

  const perform = async (action: () => Promise<void>) => {
    if (operation.current || !active.current) return;
    operation.current = true; setBusy(true); setError(null);
    try { await assertHistoryOwner(userId); if (active.current) await action(); }
    catch { if (active.current) setError(t("actionError")); }
    finally { operation.current = false; if (active.current) setBusy(false); }
  };
  const reDownload = (e: FacturXHistoryEntry) => perform(async () => {
    const { generateFacturXPdf } = await import("@/lib/facturation/factur-x-pdf");
    const artifacts = await generateFacturXPdf(e.invoice_data, { locale });
    await assertHistoryOwner(userId);
    if (!active.current) return;
    const url = URL.createObjectURL(new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = artifacts.pdfFilename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const editEntry = (e: FacturXHistoryEntry) => perform(async () => {
    localStorage.setItem("tevaxia-facturation-draft", JSON.stringify(e.invoice_data));
    window.location.href = `${lp}/facturation/emission`;
  });
  const remove = (e: FacturXHistoryEntry) => perform(async () => {
    if (!confirm(t("deleteConfirm", { num: e.invoice_number }))) return;
    await deleteHistoryEntry(e.id, userId);
    if (active.current) setEntries(current => current.filter(x => x.id !== e.id));
  });

  const filtered = entries.filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return e.invoice_number.toLowerCase().includes(q)
      || e.buyer_name.toLowerCase().includes(q)
      || e.seller_name.toLowerCase().includes(q);
  });

  if (loading) return <div className="p-12 text-center">{t("loading")}</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <Link href={`${lp}/facturation`} className="text-xs text-muted hover:text-navy">← {t("back")}</Link>
          <h1 className="break-words text-2xl font-bold text-navy mt-1">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link href={`${lp}/facturation/emission`}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          + {t("newInvoice")}
        </Link>
      </div>

      {error && <div role="alert" className="mb-4 rounded border border-rose-300 bg-rose-50 p-4 text-rose-900">{error} <button disabled={busy} className="ml-3 underline" onClick={() => { setError(null); setLoading(true); setReload(n => n + 1); }}>{t("retry")}</button></div>}
      <div className="mb-4">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")}
          className="w-full sm:w-96 rounded border border-input-border bg-input-bg px-3 py-2 text-sm" />
      </div>

      {error && entries.length === 0 ? null : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm text-muted">{query ? t("noResults") : t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2">{t("col.number")}</th>
                <th className="px-3 py-2">{t("col.date")}</th>
                <th className="px-3 py-2">{t("col.buyer")}</th>
                <th className="px-3 py-2 text-right">{t("col.ttc")}</th>
                <th className="px-3 py-2">{t("col.template")}</th>
                <th className="px-3 py-2 text-right">{t("col.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-mono text-xs">{e.invoice_number}</td>
                  <td className="px-3 py-2 text-xs">{new Date(e.invoice_date + "T12:00:00Z").toLocaleDateString(locale === "lb" ? "de-LU" : locale, { timeZone: "UTC" })}</td>
                  <td className="px-3 py-2 text-xs">{e.buyer_name}</td>
                  <td className="px-3 py-2 text-xs text-right font-mono">{formatEUR(e.total_ttc, e.currency, locale)}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{e.template ?? "generic"}</span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button disabled={busy} onClick={() => reDownload(e)}
                      className="rounded-md bg-navy/10 px-2 py-1 text-[11px] font-medium text-navy hover:bg-navy/20">
                      {t("actions.download")}
                    </button>
                    <button disabled={busy} onClick={() => editEntry(e)}
                      className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-slate hover:bg-slate-50">
                      {t("actions.edit")}
                    </button>
                    <button disabled={busy} onClick={() => remove(e)}
                      className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title={t("actions.delete")} aria-label={t("actions.delete")}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("hintTitle")}</strong> {t("hintBody")}
      </div>
    </div>
  );
}
