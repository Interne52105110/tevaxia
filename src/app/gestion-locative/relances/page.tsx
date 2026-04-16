"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";

interface UnpaidRow {
  payment_id: string;
  lot_id: string;
  lot_name: string;
  tenant_name: string | null;
  period: string;
  amount_total: number;
  due_date: string; // construite à partir period_year/month
  days_overdue: number;
  level_sent: number; // 0, 1, 2 ou 3
  last_sent_at: string | null;
}

const LEVEL_CONFIG: Record<1 | 2 | 3, { label: string; days: number; color: string }> = {
  1: { label: "Rappel amiable J+15", days: 15, color: "bg-amber-100 text-amber-800" },
  2: { label: "Mise en demeure J+30", days: 30, color: "bg-orange-100 text-orange-800" },
  3: { label: "Commandement J+60", days: 60, color: "bg-rose-100 text-rose-800" },
};

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  body: { fontSize: 10, lineHeight: 1.4, marginBottom: 8 },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, fontSize: 8, color: "#6B7280" },
});

function DunningPdf({ level, tenant, amount, period, lotName, landlordName }: { level: 1|2|3; tenant: string; amount: number; period: string; lotName: string; landlordName: string }) {
  const texts = {
    1: `Nous vous adressons ce rappel amiable pour vous signaler qu'un montant de ${amount.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} € demeure impayé au titre du loyer de la période ${period}. Nous vous remercions de régulariser la situation dans les meilleurs délais. Nous restons à votre disposition pour toute information.`,
    2: `Par la présente mise en demeure, nous vous enjoignons de régler la somme de ${amount.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} € correspondant au loyer de la période ${period}, impayée depuis plus de 30 jours. À défaut de paiement dans un délai de 15 jours à compter de la réception de la présente, nous nous réservons le droit de saisir la juridiction compétente.`,
    3: `Commandement de payer - À défaut de règlement dans les 8 jours, nous saisirons la juridiction compétente pour obtenir votre condamnation au paiement de la somme de ${amount.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} € (loyer ${period}), majorée des intérêts légaux, des frais de procédure et, le cas échéant, de la résiliation du bail. Vous disposez également d'un délai pour contacter le Service social de la commune si vous rencontrez des difficultés.`,
  };
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{LEVEL_CONFIG[level].label}</Text>
        <Text style={pdfStyles.body}>Expéditeur : {landlordName}</Text>
        <Text style={pdfStyles.body}>Destinataire : {tenant}</Text>
        <Text style={pdfStyles.body}>Bien : {lotName}</Text>
        <Text style={pdfStyles.body}>Montant dû : {amount.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} €</Text>
        <Text style={pdfStyles.body}>Période : {period}</Text>
        <Text style={pdfStyles.body}>Date : {new Date().toLocaleDateString("fr-LU")}</Text>
        <Text style={{ marginTop: 12, fontSize: 10, lineHeight: 1.5 }}>Madame, Monsieur,</Text>
        <Text style={{ marginTop: 6, fontSize: 10, lineHeight: 1.5 }}>{texts[level]}</Text>
        <Text style={{ marginTop: 12, fontSize: 10 }}>Veuillez agréer, Madame, Monsieur, l&apos;expression de nos salutations distinguées.</Text>
        <Text style={{ marginTop: 20, fontSize: 10 }}>{landlordName}</Text>
        <Text style={pdfStyles.footer}>Document généré par tevaxia.lu · Conforme à la loi du 21 septembre 2006 sur le bail d&apos;habitation LU · {level === 3 ? "Lettre recommandée avec AR" : "Envoi simple"}</Text>
      </Page>
    </Document>
  );
}

export default function RelancesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UnpaidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Bailleur");

  const refresh = async () => {
    if (!user || !supabase) return;
    const { data: prof } = await supabase.from("user_profiles").select("nom_complet").eq("user_id", user.id).maybeSingle();
    if (prof && (prof as { nom_complet?: string }).nom_complet) setProfileName((prof as { nom_complet: string }).nom_complet);

    const { data: unpaid } = await supabase.from("rental_payments")
      .select("id, lot_id, period_year, period_month, amount_total, status, paid_at, rental_lots(id,name)")
      .eq("user_id", user.id)
      .in("status", ["due", "late", "partial"]);

    const list: UnpaidRow[] = [];
    const now = Date.now();
    type PaymentJoined = { id: string; lot_id: string; period_year: number; period_month: number; amount_total: number; rental_lots: { name: string } | { name: string }[] | null };
    for (const p of (unpaid ?? []) as unknown as PaymentJoined[]) {
      const dueDate = new Date(p.period_year, p.period_month - 1, 5);
      const daysOverdue = Math.max(0, Math.floor((now - dueDate.getTime()) / 86400000));
      if (daysOverdue < 15) continue; // pas encore en retard
      // fetch level already sent
      const { data: events } = await supabase.from("rental_dunning_events")
        .select("level, sent_at").eq("payment_id", p.id).order("sent_at", { ascending: false });
      const lastLevel = events && events.length > 0 ? (events[0] as { level: number }).level : 0;
      const lastSent = events && events.length > 0 ? (events[0] as { sent_at: string }).sent_at : null;
      const lotName = Array.isArray(p.rental_lots) ? (p.rental_lots[0]?.name ?? "—") : (p.rental_lots?.name ?? "—");
      list.push({
        payment_id: p.id,
        lot_id: p.lot_id,
        lot_name: lotName,
        tenant_name: null,
        period: `${p.period_year}-${String(p.period_month).padStart(2, "0")}`,
        amount_total: p.amount_total,
        due_date: dueDate.toISOString().slice(0, 10),
        days_overdue: daysOverdue,
        level_sent: lastLevel,
        last_sent_at: lastSent,
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendDunning = async (row: UnpaidRow, level: 1 | 2 | 3) => {
    if (!user || !supabase) return;
    const tenant = row.tenant_name ?? "Locataire";
    const blob = await pdf(<DunningPdf level={level} tenant={tenant} amount={row.amount_total} period={row.period} lotName={row.lot_name} landlordName={profileName} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relance-${LEVEL_CONFIG[level].label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${row.lot_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${row.period}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await supabase.from("rental_dunning_events").insert({
      payment_id: row.payment_id,
      user_id: user.id,
      level,
      method: "pdf",
    });
    await refresh();
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const totalDue = rows.reduce((s, r) => s + r.amount_total, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">&larr; Gestion locative</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Relances impayés — paliers automatiques</h1>
          <p className="mt-2 text-muted">
            3 niveaux paramétrés : rappel amiable J+15 → mise en demeure J+30 → commandement de payer J+60.
            PDF conforme loi 21.09.2006, à envoyer en recommandé AR (papier ou eIDAS).
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
            <div className="text-xs text-rose-700">Total impayés</div>
            <div className="mt-1 text-2xl font-bold text-rose-900">{formatEUR(totalDue)}</div>
          </div>
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="text-xs text-muted">Nombre d&apos;échéances</div>
            <div className="mt-1 text-2xl font-bold text-navy">{rows.length}</div>
          </div>
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="text-xs text-muted">Retard moyen</div>
            <div className="mt-1 text-2xl font-bold text-navy">{rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.days_overdue, 0) / rows.length) : 0} j</div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">Lot</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Période</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Montant</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Retard</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Dernière relance</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">Aucun impayé de plus de 15 jours ✨</td></tr>
              ) : rows.map((r) => {
                const nextLevel = (r.level_sent + 1) as 1 | 2 | 3;
                const canSend = r.level_sent < 3 && r.days_overdue >= LEVEL_CONFIG[nextLevel].days;
                return (
                  <tr key={r.payment_id} className="border-b border-card-border/50">
                    <td className="px-4 py-2 font-medium text-navy">{r.lot_name}</td>
                    <td className="px-4 py-2 font-mono">{r.period}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-rose-700">{formatEUR(r.amount_total)}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.days_overdue} j</td>
                    <td className="px-4 py-2">
                      {r.level_sent === 0 ? (
                        <span className="text-xs text-muted">Aucune</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL_CONFIG[r.level_sent as 1|2|3].color}`}>
                          {LEVEL_CONFIG[r.level_sent as 1|2|3].label}
                          {r.last_sent_at && <span className="ml-1 opacity-70">· {new Date(r.last_sent_at).toLocaleDateString("fr-LU")}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canSend ? (
                        <button onClick={() => sendDunning(r, nextLevel)}
                          className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">
                          Envoyer niv. {nextLevel}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">Trop tôt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Procédure LU :</strong> après 60 jours d&apos;impayé, vous pouvez saisir la Justice de paix pour obtenir une ordonnance
          conditionnelle de paiement (art. 12 loi 21.09.2006), puis engager une procédure en résiliation du bail si pas de régularisation.
          Le commandement de payer peut être délivré par huissier (300-500€). Pour une version eIDAS certifiée, partenariat Yousign/LuxTrust prévu.
        </div>
      </div>
    </div>
  );
}
