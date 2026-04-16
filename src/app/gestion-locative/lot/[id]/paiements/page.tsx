"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import RentReceiptPdf from "@/components/RentReceiptPdf";
import { getProfile } from "@/lib/profile";
import { getLot, type RentalLot } from "@/lib/gestion-locative";
import {
  listPaymentsForLot, upsertPayment, markPaid, seedYear, deletePayment,
  type RentalPayment,
} from "@/lib/rental-payments";
import { formatEUR } from "@/lib/calculations";

const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

const STATUS_COLOR: Record<string, string> = {
  due: "bg-amber-100 text-amber-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  late: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  due: "À encaisser",
  partial: "Partiel",
  paid: "Payé",
  late: "Retard",
  cancelled: "Annulé",
};

export default function PaymentsPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");
  const thisYear = new Date().getFullYear();

  const [lot, setLot] = useState<RentalLot | null>(null);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);

  const refresh = async () => {
    if (!id) return;
    try {
      const l = getLot(id);
      setLot(l);
      const ps = await listPaymentsForLot(id);
      setPayments(ps);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (!lot) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const yearPayments = payments.filter((p) => p.period_year === selectedYear);
  const byMonth = new Map<number, RentalPayment>();
  for (const p of yearPayments) byMonth.set(p.period_month, p);

  const totalExpected = lot.loyerMensuelActuel * 12 + lot.chargesMensuelles * 12;
  const totalPaid = yearPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_total, 0);

  const handleSeedYear = async () => {
    if (!confirm(`Générer les 12 mois de ${selectedYear} avec le loyer actuel (${formatEUR(lot.loyerMensuelActuel)} + ${formatEUR(lot.chargesMensuelles)} charges) ?`)) return;
    try {
      await seedYear(id, selectedYear, lot.loyerMensuelActuel, lot.chargesMensuelles);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleCreateMonth = async (month: number) => {
    try {
      await upsertPayment({
        lot_id: id,
        period_year: selectedYear,
        period_month: month,
        amount_rent: lot.loyerMensuelActuel,
        amount_charges: lot.chargesMensuelles,
      });
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try { await markPaid(paymentId); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Supprimer cette ligne de paiement ?")) return;
    try { await deletePayment(paymentId); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleSaveEdit = async (payment: RentalPayment) => {
    try {
      await upsertPayment({
        id: payment.id,
        lot_id: id,
        period_year: payment.period_year,
        period_month: payment.period_month,
        amount_rent: editAmount - payment.amount_charges,
        amount_charges: payment.amount_charges,
      });
      setEditingId(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const downloadReceipt = async (payment: RentalPayment) => {
    const profile = getProfile();
    const blob = await pdf(
      <RentReceiptPdf
        lot={lot}
        landlord={{
          name: profile.nomComplet || "Bailleur",
          address: profile.adresse,
          email: profile.email,
          phone: profile.telephone,
        }}
        payment={payment}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `quittance-${safeName}-${payment.period_year}-${String(payment.period_month).padStart(2, "0")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/gestion-locative/lot/${id}`} className="text-xs text-muted hover:text-navy">← {lot.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Paiements &amp; quittances</h1>
        <p className="mt-1 text-sm text-muted">
          Suivi des loyers encaissés et génération automatique de quittances mensuelles (loi du 21 septembre 2006, art. 25).
        </p>

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
            + Générer les 12 mois de {selectedYear}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">Loyer + charges attendus</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalExpected)}</div>
            <div className="mt-0.5 text-xs text-muted">12 × {formatEUR(lot.loyerMensuelActuel + lot.chargesMensuelles)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">Encaissé {selectedYear}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(totalPaid)}</div>
            <div className="mt-0.5 text-xs text-muted">{yearPayments.filter((p) => p.status === "paid").length} / 12 mois</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">Reste à encaisser</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{formatEUR(totalExpected - totalPaid)}</div>
            <div className="mt-0.5 text-xs text-muted">{yearPayments.filter((p) => p.status !== "paid").length} lignes en attente</div>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {/* Tableau mois par mois */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2">Mois</th>
                <th className="px-4 py-2 text-right">Montant</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Date règlement</th>
                <th className="px-4 py-2">Mode</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const p = byMonth.get(m);
                if (!p) {
                  return (
                    <tr key={m} className="opacity-60">
                      <td className="px-4 py-2 font-medium text-navy">{MONTHS[m - 1]} {selectedYear}</td>
                      <td className="px-4 py-2 text-right text-muted">—</td>
                      <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">Non créé</span></td>
                      <td className="px-4 py-2 text-muted">—</td>
                      <td className="px-4 py-2 text-muted">—</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleCreateMonth(m)}
                          className="rounded-md bg-navy/10 px-2 py-1 text-[11px] font-medium text-navy hover:bg-navy/20">
                          + Créer
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
                    <td className="px-4 py-2 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-LU") : "—"}</td>
                    <td className="px-4 py-2 text-xs">{p.payment_method ?? "—"}</td>
                    <td className="px-4 py-2 text-right space-x-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(p)}
                            className="rounded-md bg-emerald-600 text-white px-2 py-1 text-[11px] font-semibold hover:bg-emerald-700">OK</button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50">Annuler</button>
                        </>
                      ) : (
                        <>
                          {p.status !== "paid" && (
                            <button onClick={() => handleMarkPaid(p.id)}
                              className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100">
                              Marquer payé
                            </button>
                          )}
                          {p.status === "paid" && (
                            <button onClick={() => downloadReceipt(p)}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-100">
                              Quittance PDF
                            </button>
                          )}
                          <button onClick={() => { setEditingId(p.id); setEditAmount(p.amount_total); }}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                            Éditer
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title="Supprimer">
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

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Obligations du bailleur (art. 25 de la loi du 21.09.2006) :</strong> vous devez remettre
          gratuitement une quittance de loyer au locataire qui en fait la demande. La quittance générée ici
          détaille la période, le loyer HC et les provisions sur charges — conforme aux exigences LU.
        </div>
      </div>
    </div>
  );
}
