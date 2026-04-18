"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { getPortalAccount, type PortalAccountData } from "@/lib/coownership-portal";
import OwnerStatementPdf from "@/components/OwnerStatementPdf";
import { formatEUR } from "@/lib/calculations";

const PALIER_LABELS: Record<number, string> = {
  1: "Rappel amiable",
  2: "Mise en demeure",
  3: "Dernière mise en demeure",
};

const PALIER_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-900",
  2: "bg-amber-100 text-amber-900",
  3: "bg-rose-100 text-rose-900",
};

export default function MyAccountPage(props: { params: Promise<{ token: string }> }) {
  const { token } = use(props.params);
  const [data, setData] = useState<PortalAccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPortalAccount(token)
      .then((d) => setData(d))
      .catch((e) => setData({ error: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!data || data.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">Accès invalide</h1>
        <p className="text-muted">Ce lien a expiré ou été révoqué.</p>
      </div>
    );
  }

  const hasOutstanding = (data.balance?.outstanding ?? 0) > 0;

  const downloadStatementPdf = async () => {
    if (!data.unpaid && !data.reminders) return;
    // Construit les items pour le PDF depuis unpaid + reminders
    const items: Array<{
      date: string; type: "call" | "payment" | "interest" | "penalty" | "adjustment";
      label: string; debit: number; credit: number;
    }> = [];
    for (const u of data.unpaid ?? []) {
      items.push({
        date: u.due_date, type: "call",
        label: u.call_label,
        debit: u.amount_due, credit: u.amount_paid,
      });
    }
    for (const r of data.reminders ?? []) {
      if (r.late_interest > 0) {
        items.push({
          date: r.sent_at.slice(0, 10),
          type: "interest",
          label: `Intérêts de retard — palier ${r.palier}`,
          debit: r.late_interest, credit: 0,
        });
      }
      if (r.penalty > 0) {
        items.push({
          date: r.sent_at.slice(0, 10),
          type: "penalty",
          label: `Frais recouvrement — palier ${r.palier}`,
          debit: r.penalty, credit: 0,
        });
      }
    }
    items.sort((a, b) => a.date.localeCompare(b.date));

    const now = new Date();
    const periodFrom = items.length > 0 ? items[0].date : now.toISOString().slice(0, 10);
    const periodTo = now.toISOString().slice(0, 10);
    const totalDebit = items.reduce((s, i) => s + i.debit, 0);
    const totalCredit = items.reduce((s, i) => s + i.credit, 0);
    const balance = totalDebit - totalCredit;

    const blob = await pdf(
      <OwnerStatementPdf
        coownership={{ name: data.coownership_name ?? "Copropriété" }}
        syndic={{ name: "Syndic" }}
        owner={{
          lot_number: data.lot_number ?? "?",
          owner_name: data.owner_name ?? null,
          tantiemes: data.tantiemes ?? 0,
        }}
        period={{ from: periodFrom, to: periodTo }}
        items={items}
        summary={{
          total_debit: totalDebit,
          total_credit: totalCredit,
          balance,
          nb_unpaid: data.balance?.nb_unpaid ?? 0,
          oldest_unpaid_date: data.unpaid?.sort((a, b) => a.due_date.localeCompare(b.due_date))[0]?.due_date ?? null,
        }}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `releve-lot-${data.lot_number}-${periodTo}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/copropriete/${token}`} className="text-xs text-muted hover:text-navy">← Mon espace</Link>
          <button onClick={downloadStatementPdf}
            className="rounded-lg border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">
            ↓ Relevé PDF
          </button>
        </div>

        <div className={`mt-3 rounded-2xl p-6 ${hasOutstanding ? "bg-rose-50 border border-rose-200" : "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"}`}>
          <div className={`text-xs uppercase tracking-wider ${hasOutstanding ? "text-rose-700" : "text-white/70"}`}>
            Solde de mon compte
          </div>
          <h1 className={`mt-1 text-3xl sm:text-4xl font-bold ${hasOutstanding ? "text-rose-900" : ""}`}>
            {formatEUR(data.balance?.outstanding ?? 0)}
          </h1>
          <div className={`mt-2 text-sm ${hasOutstanding ? "text-rose-800" : "text-white/90"}`}>
            {hasOutstanding
              ? `${data.balance?.nb_unpaid ?? 0} appel(s) impayé(s) sur votre lot ${data.lot_number}`
              : "✓ Vous êtes à jour de tous vos appels de fonds."}
          </div>
          {data.coownership_name && (
            <div className={`mt-3 text-xs ${hasOutstanding ? "text-rose-700" : "text-white/70"}`}>
              {data.coownership_name} · Lot {data.lot_number} · {data.tantiemes}/{data.total_tantiemes} tantièmes
            </div>
          )}
        </div>

        {/* Appels impayés */}
        {(data.unpaid?.length ?? 0) > 0 && (
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Appels impayés ({data.unpaid?.length})
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-2 py-2 text-left">Période</th>
                  <th className="px-2 py-2 text-left">Échéance</th>
                  <th className="px-2 py-2 text-right">Appelé</th>
                  <th className="px-2 py-2 text-right">Payé</th>
                  <th className="px-2 py-2 text-right">Dû</th>
                  <th className="px-2 py-2 text-left">Référence</th>
                </tr>
              </thead>
              <tbody>
                {data.unpaid?.map((u) => (
                  <tr key={u.charge_id} className={u.days_late > 30 ? "bg-rose-50/50" : ""}>
                    <td className="px-2 py-1.5 font-medium">{u.call_label}</td>
                    <td className="px-2 py-1.5 text-xs">
                      {new Date(u.due_date).toLocaleDateString("fr-LU")}
                      {u.days_late > 0 && (
                        <span className="ml-1 text-[10px] text-rose-700 font-semibold">
                          (+{u.days_late}j)
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-xs">{formatEUR(u.amount_due)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-xs text-muted">{formatEUR(u.amount_paid)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-xs font-semibold text-rose-700">
                      {formatEUR(u.outstanding)}
                    </td>
                    <td className="px-2 py-1.5 text-[10px] font-mono text-muted">{u.payment_reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <strong>Pour régler :</strong> utilisez la référence unique ci-dessus dans votre virement bancaire.
              Le rapprochement sera automatique dès réception par le syndic.
            </div>
          </section>
        )}

        {/* Relances reçues */}
        {(data.reminders?.length ?? 0) > 0 && (
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Relances reçues ({data.reminders?.length})
            </h2>
            <div className="space-y-2">
              {data.reminders?.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-card-border/50 bg-background p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PALIER_COLORS[r.palier]}`}>
                      Palier {r.palier} — {PALIER_LABELS[r.palier]}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(r.sent_at).toLocaleDateString("fr-LU")}
                    </span>
                    <span className="text-[10px] text-muted">via {r.channel}</span>
                  </div>
                  <div className="text-xs text-right">
                    <div className="font-mono font-semibold text-navy">{formatEUR(r.total_claimed)}</div>
                    {(r.late_interest > 0 || r.penalty > 0) && (
                      <div className="text-[10px] text-amber-700">
                        dont {formatEUR(r.late_interest)} intérêts + {formatEUR(r.penalty)} pénalité
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Annexes AG téléchargeables */}
        {(data.years?.length ?? 0) > 0 && (
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Annexes comptables AG disponibles
            </h2>
            <div className="space-y-2">
              {data.years?.filter((y) => y.status === "closed").map((y) => (
                <div key={y.year_id} className="flex items-center justify-between rounded-lg border border-card-border/50 bg-background p-3">
                  <div>
                    <div className="font-semibold text-navy">Exercice {y.year}</div>
                    <div className="text-[10px] text-muted">
                      Clos le {y.closed_at ? new Date(y.closed_at).toLocaleDateString("fr-LU") : "—"} ·
                      5 annexes comptables obligatoires
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                    Contactez le syndic
                  </span>
                </div>
              ))}
              {data.years?.filter((y) => y.status === "open").length && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  L&apos;exercice {data.years?.find((y) => y.status === "open")?.year} est en cours —
                  les annexes seront disponibles après clôture (généralement 3 mois après fin d&apos;exercice).
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Mon espace copropriétaire :</strong> ces informations proviennent directement de la
          comptabilité tenue par votre syndic. Pour toute question sur un appel de fonds ou une relance,
          contactez-le via les coordonnées de la page d&apos;accueil.
        </div>
      </div>
    </div>
  );
}
