"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenantPortalData, type TenantPortalData } from "@/lib/tenant-portal";
import { formatEUR } from "@/lib/calculations";

const STATUS_LABELS: Record<string, string> = {
  due: "À régler",
  partial: "Partiel",
  paid: "Payé",
  late: "En retard",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  due: "bg-amber-100 text-amber-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  late: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-700",
};

export default function TenantPortal() {
  const params = useParams();
  const token = String(params?.token ?? "");
  const [data, setData] = useState<TenantPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getTenantPortalData(token)
      .then((d) => setData(d))
      .catch((e) => setData({ error: e?.message ?? "Erreur" } as TenantPortalData))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }

  if (!data || data.error || !data.lot) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">Lien invalide</h1>
        <p className="text-muted">
          Ce lien d&apos;accès n&apos;est plus valide. Il a peut-être été révoqué ou a expiré.
          Contactez votre bailleur pour obtenir un nouveau lien.
        </p>
      </div>
    );
  }

  const { lot, tenant_name, payments } = data;
  const unpaid = payments.filter((p) => p.status === "due" || p.status === "late" || p.status === "partial");
  const totalDue = unpaid.reduce((sum, p) => sum + p.amount_total, 0);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="text-xs uppercase tracking-wider text-white/70">Mon espace locataire</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{lot.name}</h1>
          {lot.address && <p className="mt-1 text-sm text-white/80">{lot.address}{lot.commune ? `, ${lot.commune}` : ""}</p>}
          {tenant_name && <p className="mt-2 text-sm text-white/70">Locataire : <strong>{tenant_name}</strong></p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1">{lot.surface} m²</span>
            {lot.nb_chambres && <span className="rounded-full bg-white/10 px-3 py-1">{lot.nb_chambres} ch.</span>}
            <span className="rounded-full bg-white/10 px-3 py-1">Classe {lot.classe_energie}</span>
            {lot.est_meuble && <span className="rounded-full bg-white/10 px-3 py-1">Meublé</span>}
          </div>
        </div>

        {/* Statut paiements */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Paiements en attente</div>
            <div className={`mt-1 text-2xl font-bold ${totalDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {formatEUR(totalDue)}
            </div>
            <div className="mt-1 text-xs text-muted">{unpaid.length} échéance{unpaid.length > 1 ? "s" : ""}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Historique 24 derniers mois</div>
            <div className="mt-1 text-2xl font-bold text-navy">{payments.filter((p) => p.status === "paid").length} payés</div>
            <div className="mt-1 text-xs text-muted">sur {payments.length} périodes</div>
          </div>
        </div>

        {/* Historique paiements */}
        <div className="mt-6 rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-card-border bg-background">
            <h2 className="text-base font-semibold text-navy">Historique des loyers</h2>
          </div>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Aucun paiement enregistré pour l&apos;instant.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs text-muted">
                  <th className="px-5 py-2 font-medium">Période</th>
                  <th className="px-5 py-2 font-medium text-right">Loyer HC</th>
                  <th className="px-5 py-2 font-medium text-right">Charges</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium">Statut</th>
                  <th className="px-5 py-2 font-medium">Quittance</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-card-border/50">
                    <td className="px-5 py-2 font-mono">{p.period}</td>
                    <td className="px-5 py-2 text-right font-mono text-muted">{formatEUR(p.amount_rent)}</td>
                    <td className="px-5 py-2 text-right font-mono text-muted">{formatEUR(p.amount_charges)}</td>
                    <td className="px-5 py-2 text-right font-mono font-semibold text-navy">{formatEUR(p.amount_total)}</td>
                    <td className="px-5 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-xs text-muted">
                      {p.receipt_issued_at ? `✓ ${new Date(p.receipt_issued_at).toLocaleDateString("fr-LU")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-card-border bg-background p-4 text-xs text-muted text-center">
          Accès en lecture seule — pour toute question, contactez votre bailleur. Ce lien est personnel et ne doit pas être partagé.
          <br/>Conforme au droit d&apos;accès RGPD (art. 15) et à la loi du 21 septembre 2006 sur le bail d&apos;habitation.
        </div>
      </div>
    </div>
  );
}
