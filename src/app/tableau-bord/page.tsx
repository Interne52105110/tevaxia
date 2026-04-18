"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listMySharedLinks, type SharedLink } from "@/lib/shared-links";
import { listMyMandates, type AgencyMandate } from "@/lib/agency-mandates";
import { listMyActivity, type ActivityEntry } from "@/lib/activity-log";
import { listerEvaluations, type SavedValuation } from "@/lib/storage";
import { formatEUR } from "@/lib/calculations";

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("fr-LU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [evals, setEvals] = useState<SavedValuation[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [rentalLotsCount, setRentalLotsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvals(listerEvaluations());
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const [l, m, a] = await Promise.all([
          isSupabaseConfigured ? listMySharedLinks() : Promise.resolve([]),
          isSupabaseConfigured ? listMyMandates() : Promise.resolve([]),
          isSupabaseConfigured ? listMyActivity(10) : Promise.resolve([]),
        ]);
        if (cancel) return;
        setLinks(l);
        setMandates(m);
        setActivity(a);

        if (isSupabaseConfigured && supabase) {
          const { count } = await supabase.from("rental_lots").select("id", { count: "exact", head: true }).eq("user_id", user.id);
          if (!cancel) setRentalLotsCount(count ?? 0);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user, authLoading]);

  const activeLinks = links.filter((l) => new Date(l.expires_at) > new Date());
  const activeMandates = mandates.filter((m) => ["mandat_signe", "sous_compromis"].includes(m.status));
  const soldMandates = mandates.filter((m) => m.status === "vendu");
  const totalCommission = soldMandates.reduce((s, m) => s + (Number(m.commission_amount_percue) || 0), 0);

  const patrimoineCalcule = evals.reduce((s, e) => s + (e.valeurPrincipale ?? 0), 0);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement du tableau de bord…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-navy mb-3">Tableau de bord personnel</h1>
        <p className="text-sm text-muted">
          <Link href="/connexion" className="text-navy underline">Connectez-vous</Link> pour accéder à votre tableau de bord consolidé.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Tableau de bord personnel</h1>
      <p className="mt-1 text-sm text-muted">
        Vue consolidée de toute votre activité tevaxia.lu : évaluations, portefeuille locatif, mandats, liens partagés.
      </p>

      {/* KPIs globaux */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Évaluations enregistrées" value={evals.length} href="/mes-evaluations" />
        <KpiCard label="Lots locatifs" value={rentalLotsCount} href="/gestion-locative/portefeuille" />
        <KpiCard label="Mandats actifs" value={activeMandates.length} href="/pro-agences/mandats" />
        <KpiCard label="Liens partagés actifs" value={activeLinks.length} href="/profil/liens-partages" />
      </div>

      {/* Patrimoine et commissions */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-5 text-white shadow-lg">
          <div className="text-xs text-white/70">Valeur cumulée évaluations</div>
          <div className="mt-1 text-2xl font-bold">{formatEUR(patrimoineCalcule)}</div>
          <Link href="/portfolio" className="mt-2 inline-block text-[11px] text-white/70 hover:text-white">
            Voir portfolio →
          </Link>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs text-emerald-800">Commissions perçues (ventes closes)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{formatEUR(totalCommission)}</div>
          <div className="mt-1 text-[10px] text-emerald-700">{soldMandates.length} vente(s) close(s)</div>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="text-xs text-muted">Vues cumulées liens partagés</div>
          <div className="mt-1 text-2xl font-bold text-navy">
            {links.reduce((s, l) => s + l.view_count, 0)}
          </div>
          <Link href="/profil/liens-partages" className="mt-1 inline-block text-[10px] text-navy/70 hover:text-navy">
            Voir analytics →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Évaluations récentes */}
        <section className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">Dernières évaluations</h2>
            <Link href="/mes-evaluations" className="text-xs text-navy hover:underline">Voir tout →</Link>
          </div>
          {evals.length === 0 ? (
            <p className="text-xs text-muted italic">Aucune évaluation enregistrée. Commencez par <Link href="/estimation" className="text-navy underline">/estimation</Link> ou <Link href="/valorisation" className="text-navy underline">/valorisation</Link>.</p>
          ) : (
            <ul className="space-y-2">
              {evals.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-xs border-b border-card-border/40 pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-navy truncate">{e.nom}</div>
                    <div className="text-[10px] text-muted font-mono">{e.type} · {fmtDate(e.date)}</div>
                  </div>
                  {e.valeurPrincipale != null && (
                    <div className="font-mono font-semibold">{formatEUR(e.valeurPrincipale)}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mandats actifs */}
        <section className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">Mandats actifs</h2>
            <Link href="/pro-agences/mandats" className="text-xs text-navy hover:underline">Voir tout →</Link>
          </div>
          {activeMandates.length === 0 ? (
            <p className="text-xs text-muted italic">Aucun mandat actif.</p>
          ) : (
            <ul className="space-y-2">
              {activeMandates.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-xs border-b border-card-border/40 pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-navy truncate">{m.property_address}</div>
                    <div className="text-[10px] text-muted">
                      {m.client_name ?? "—"} · {m.status}
                    </div>
                  </div>
                  {m.prix_demande != null && (
                    <div className="font-mono font-semibold">{formatEUR(m.prix_demande)}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activité récente */}
        <section className="rounded-xl border border-card-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">Activité récente</h2>
            <Link href="/profil/confidentialite" className="text-xs text-navy hover:underline">Voir tout →</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-muted italic">Aucune activité enregistrée pour le moment.</p>
          ) : (
            <ul className="space-y-1">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-xs py-1 border-b border-card-border/30 last:border-0">
                  <span className="font-mono text-[10px] text-muted shrink-0 w-28">
                    {new Date(a.created_at).toLocaleString("fr-LU", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="font-mono text-navy">{a.action}</span>
                  {a.entity_type && <span className="text-muted">· {a.entity_type}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Shortcuts */}
      <section className="mt-8 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-base font-semibold text-navy mb-3">Raccourcis outils</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: "/estimation", label: "Estimation" },
            { href: "/valorisation", label: "Valorisation EVS" },
            { href: "/gestion-locative", label: "Gestion locative" },
            { href: "/dcf-multi", label: "DCF multi" },
            { href: "/syndic", label: "Syndic / Copro" },
            { href: "/hotellerie", label: "Hôtellerie" },
            { href: "/str", label: "STR / Airbnb" },
            { href: "/portfolio", label: "Portfolio" },
          ].map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-xs font-medium text-slate hover:border-navy hover:text-navy transition-colors text-center"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-card-border bg-card p-4 hover:border-navy transition-colors">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy">{value}</div>
    </Link>
  );
}
