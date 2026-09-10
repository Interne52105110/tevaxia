"use client";

import { rentalInvoiceDraft } from "@/lib/facturation/rental-draft";
import { storeInvoiceDraft } from "@/lib/facturation/draft";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import RentReceiptPdf from "@/components/RentReceiptPdf";
import { getProfile } from "@/lib/profile";
import { getLotAsync, type RentalLot } from "@/lib/gestion-locative";
import {
  listPaymentsForLot, upsertPayment, markPaid, seedYear, deletePayment, summarizeRentalPayments, confirmRentalPayment,
  type RentalPayment,
} from "@/lib/rental-payments";
import { formatEUR } from "@/lib/calculations";


const STATUS_COLOR: Record<string, string> = {
  due: "bg-amber-100 text-amber-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  late: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const routeParams = useParams();
  if (loading) return null;
  return <PaymentsPageContent key={`${user?.id ?? "guest"}:${String(routeParams?.id ?? "")}`} />;
}

function PaymentsPageContent() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("paiementsLocatifs");
  const ti = useTranslations("invoiceTemplate");
  const { user } = useAuth();
  const ownerId=user?.id;
  const params = useParams();
  const id = String(params?.id ?? "");
  const thisYear = Number(new Intl.DateTimeFormat("en",{timeZone:"Europe/Luxembourg",year:"numeric"}).format(new Date()));

  const MONTHS = [
    t("month1"), t("month2"), t("month3"), t("month4"),
    t("month5"), t("month6"), t("month7"), t("month8"),
    t("month9"), t("month10"), t("month11"), t("month12"),
  ];

  const STATUS_LABEL: Record<string, string> = {
    due: t("statusDue"),
    partial: t("statusPartial"),
    paid: t("statusPaid"),
    late: t("statusLate"),
    cancelled: t("statusCancelled"),
  };

  const live=useRef(true),running=useRef(false);
  const [busy,setBusy]=useState(false),[ready,setReady]=useState(false);
  const [lot, setLot] = useState<RentalLot | null>(null);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);

  const refresh = useCallback(async () => {
    if(!id||!ownerId)throw new Error('Rental account required');
    if(live.current)setReady(false);
    const l=await getLotAsync(id,ownerId);
    if(!l)throw new Error('Rental lot unavailable');
    const ps=await listPaymentsForLot(id,ownerId);
    if(live.current){setLot(l);setPayments(ps);setReady(true);setError(null);}
  },[id,ownerId]);
  useEffect(()=>{live.current=true;if(id&&ownerId)void refresh().catch(()=>{if(live.current)setError(t('error'))});return()=>{live.current=false;};},[id,ownerId,refresh,t]);
  const runAction=async(work:()=>Promise<unknown>)=>{
    if(running.current||!ready||!user)return;
    running.current=true;setBusy(true);setError(null);
    try{await work();if(live.current)await refresh();}
    catch{if(live.current)setError(t('error'));}
    finally{running.current=false;if(live.current)setBusy(false);}
  };
  if(!user)return <div className="mx-auto max-w-5xl px-4 py-16"><Link className="underline" href={`${lp}/connexion`}>{t('signIn')}</Link></div>;
  if(!lot)return <div role={error?'alert':'status'} className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{error?t('error'):t('loading')}{error&&<button className="block mx-auto mt-4 underline" onClick={()=>void refresh().catch(()=>setError(t('error')))}>{t('retry')}</button>}</div>;

  const yearPayments = payments.filter((p) => p.period_year === selectedYear);
  const byMonth = new Map<number, RentalPayment>();
  for (const p of yearPayments) byMonth.set(p.period_month, p);

  const totals=summarizeRentalPayments(yearPayments);
  const totalExpected=totals.expected,totalPaid=totals.paid;
  const handleSeedYear=async()=>{
    if(!confirm(t('confirmSeed',{year:selectedYear,rent:formatEUR(lot.loyerMensuelActuel),charges:formatEUR(lot.chargesMensuelles)})))return;
    await runAction(()=>seedYear(id,selectedYear,lot.loyerMensuelActuel,lot.chargesMensuelles,user.id));
  };
  const handleCreateMonth=async(month:number)=>runAction(()=>upsertPayment({lot_id:id,period_year:selectedYear,period_month:month,amount_rent:lot.loyerMensuelActuel,amount_charges:lot.chargesMensuelles},user.id));
  const handleMarkPaid=async(payment:RentalPayment)=>runAction(()=>markPaid(payment,user.id));
  const handleDelete=async(payment:RentalPayment)=>{
    if(!confirm(t('confirmDelete')))return;
    await runAction(()=>deletePayment(payment,user.id));
  };
  const handleSaveEdit=async(payment:RentalPayment)=>runAction(async()=>{
    await upsertPayment({id:payment.id,updated_at:payment.updated_at,lot_id:id,period_year:payment.period_year,period_month:payment.period_month,amount_rent:editAmount-payment.amount_charges,amount_charges:payment.amount_charges},user.id);
    if(live.current)setEditingId(null);
  });

  const prepareInvoice = (payment: RentalPayment) => {
    if (!lot || !user || busy || !ready) return;
    try {
      const profile = getProfile(user?.id ?? null);
      const draft = rentalInvoiceDraft(payment, lot, user.id, { name: profile.nomComplet || profile.societe || "", address: profile.adresse }, { rent: ti("rent"), charges: ti("charges") });
      storeInvoiceDraft(draft, user.id);
      window.location.href = `${lp}/facturation/emission`;
    } catch { setError(t("error")); }
  };

  const downloadReceipt = async (payment: RentalPayment) => runAction(async()=>{
    const confirmed=await confirmRentalPayment(payment,user.id);
    if(confirmed.status!=="paid")throw new Error("Rental payment not settled");
    const profile = getProfile(user?.id ?? null);
    const blob = await pdf(
      <RentReceiptPdf
        lot={lot}
        landlord={{
          name: profile.nomComplet || profile.societe || "",
          address: profile.adresse,
          email: profile.email,
          phone: profile.telephone,
        }}
        payment={confirmed}
      />
    ).toBlob();
    if(!live.current)return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `quittance-${safeName}-${payment.period_year}-${String(payment.period_month).padStart(2, "0")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/gestion-locative/lot/${id}`} className="text-xs text-muted hover:text-navy">&larr; {lot.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>

        {error&&<div role="alert" className="mt-4 text-sm text-rose-700">{error}<button className="ml-3 underline" disabled={busy} onClick={()=>void refresh().catch(()=>setError(t('error')))}>{t('retry')}</button></div>}
        <p className="mt-4 text-sm text-muted">{t('ledgerScope')}</p>
        <fieldset className="min-w-0" disabled={busy||!ready} aria-busy={busy}>
        {/* KPIs + year selector */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            {[thisYear - 2, thisYear - 1, thisYear, thisYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleSeedYear}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("generateYear")} {selectedYear}
          </button>
          <button onClick={()=>runAction(async()=>{
            const {createTenantToken,buildTenantPortalUrl}=await import("@/lib/tenant-portal");
            const tok=await createTenantToken({lot_id:id,tenant_name:null,tenant_email:null,expires_in_days:365},user.id);
            if(!live.current)return;
            const url=buildTenantPortalUrl(tok.token);await navigator.clipboard.writeText(url);
            if(live.current)alert(t("tenantPortalCopied",{url}));
          })}
            className="rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:from-teal-700 hover:to-cyan-700">
            {t("tenantPortalBtn")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiExpected")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalExpected)}</div>
            <div className="mt-0.5 text-xs text-muted">{t("kpiExpectedDetail")} {totals.registered}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiCollected")} {selectedYear}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(totalPaid)}</div>
            <div className="mt-0.5 text-xs text-muted">{yearPayments.filter((p) => p.status === "paid").length} {t("kpiMonths")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiRemaining")}</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{totals.remaining===null?t("partialUnknown"):formatEUR(totals.remaining)}</div>
            <div className="mt-0.5 text-xs text-muted">{totals.pending} {t("kpiPending")}</div>
          </div>
        </div>



        {/* Graphique cumul paiements */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-base font-semibold text-navy">{t("cumTitle", { year: selectedYear })}</h3>
          <p className="mt-0.5 text-xs text-muted mb-3">{t("cumSubtitle")}</p>
          {(() => {
            const monthLabels = [t("month1Short"),t("month2Short"),t("month3Short"),t("month4Short"),t("month5Short"),t("month6Short"),t("month7Short"),t("month8Short"),t("month9Short"),t("month10Short"),t("month11Short"),t("month12Short")];
            let cumPaid = 0;
            let cumExpected = 0;
            const data = Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              const p = byMonth.get(m);
              if(p&&p.status!=="cancelled")cumExpected=Math.round((cumExpected+p.amount_total)*100)/100;
              if (p?.status === "paid") {
                cumPaid = Math.round((cumPaid+p.amount_total)*100)/100;
              }
              return {
                month: monthLabels[i],
                paid: cumPaid,
                expected: cumExpected,
              };
            });
            const maxY = Math.max(cumExpected, 1);
            return (
              <div className="space-y-2">
                {data.map((d) => {
                  const pctPaid = (d.paid / maxY) * 100;
                  const pctExpected = (d.expected / maxY) * 100;
                  return (
                    <div key={d.month} className="flex items-center gap-2 text-xs">
                      <div className="w-8 shrink-0 text-muted">{d.month}</div>
                      <div className="relative flex-1 h-5 rounded bg-background border border-card-border/40 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-navy/20"
                          style={{ width: `${pctExpected}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-500"
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                      <div className="w-24 shrink-0 text-right font-mono text-[10px] tabular-nums">
                        {formatEUR(d.paid)} / {formatEUR(d.expected)}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-muted">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-navy/20" /> {t("legendDue")}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-emerald-500" /> {t("legendPaidOnTime")}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Month-by-month table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2">{t("thMonth")}</th>
                <th className="px-4 py-2 text-right">{t("thAmount")}</th>
                <th className="px-4 py-2">{t("thStatus")}</th>
                <th className="px-4 py-2">{t("thPaymentDate")}</th>
                <th className="px-4 py-2">{t("thMethod")}</th>
                <th className="px-4 py-2 text-right">{t("thActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const p = byMonth.get(m);
                if (!p) {
                  return (
                    <tr key={m} className="opacity-60">
                      <td className="px-4 py-2 font-medium text-navy">{MONTHS[m - 1]} {selectedYear}</td>
                      <td className="px-4 py-2 text-right text-muted">&mdash;</td>
                      <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{t("statusNotCreated")}</span></td>
                      <td className="px-4 py-2 text-muted">&mdash;</td>
                      <td className="px-4 py-2 text-muted">&mdash;</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleCreateMonth(m)}
                          className="rounded-md bg-navy/10 px-2 py-1 text-[11px] font-medium text-navy hover:bg-navy/20">
                          {t("create")}
                        </button>
                      </td>
                    </tr>
                  );
                }
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className={p.status === "paid" ? "bg-emerald-50/40" : ""}>
                    <td className="px-4 py-2 font-medium text-navy">{MONTHS[m - 1]} {selectedYear}</td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <input type="number" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                          className="w-24 rounded border border-input-border bg-input-bg px-2 py-0.5 text-right text-sm" />
                      ) : formatEUR(p.amount_total)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{p.paid_at ? new Date(p.paid_at+"T12:00:00Z").toLocaleDateString(locale==="lb"?"de-LU":locale,{timeZone:"Europe/Luxembourg"}) : "\u2014"}</td>
                    <td className="px-4 py-2 text-xs">{p.payment_method ?? "\u2014"}</td>
                    <td className="px-4 py-2 text-right space-x-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(p)}
                            className="rounded-md bg-emerald-600 text-white px-2 py-1 text-[11px] font-semibold hover:bg-emerald-700">OK</button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50">{t("cancel")}</button>
                        </>
                      ) : (
                        <>
                          {p.status !== "paid" && p.status !== "cancelled" && !p.receipt_issued_at && !p.receipt_sha256 && (
                            <button onClick={() => handleMarkPaid(p)}
                              className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100">
                              {t("markPaid")}
                            </button>
                          )}
                          {p.status === "paid" && (
                            <button onClick={() => downloadReceipt(p)}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-100">
                              {t("receiptPdf")}
                            </button>
                          )}
                          <button onClick={() => prepareInvoice(p)}
                            className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                            title={t("facturxTitle")}>
                            {t("prepareBilling")}
                          </button>
                          <button disabled={p.status==="paid"||p.status==="cancelled"||!!p.receipt_issued_at||!!p.receipt_sha256} onClick={() => { setEditingId(p.id); setEditAmount(p.amount_total); }}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                            {t("edit")}
                          </button>
                          <button disabled={p.status==="paid"||p.status==="cancelled"||!!p.receipt_issued_at||!!p.receipt_sha256} onClick={() => handleDelete(p)}
                            className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title={t("deleteTitle")}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9" />
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        </fieldset>
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("legalNote")}</strong>
        </div>
      </div>
    </div>
  );
}
