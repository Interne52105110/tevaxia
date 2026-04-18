"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getMandate, type AgencyMandate } from "@/lib/agency-mandates";
import {
  findContactsForMandate, VERDICT_LABELS, VERDICT_COLORS,
  type MatchResult,
} from "@/lib/agency-matching";
import { contactDisplayName } from "@/lib/crm/types";
import { logInteraction } from "@/lib/crm/interactions";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function MandateMatchingPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(40);

  const reload = useCallback(async () => {
    if (!mandateId || !isSupabaseConfigured || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [m, results] = await Promise.all([
        getMandate(mandateId),
        findContactsForMandate(mandateId, { minScore }),
      ]);
      setMandate(m);
      setMatches(results);
    } catch (e) {
      setError(errMsg(e, "Erreur matching"));
    }
    setLoading(false);
  }, [mandateId, user, minScore]);

  useEffect(() => { void reload(); }, [reload]);

  const flagAndContact = async (m: MatchResult) => {
    try {
      await logInteraction({
        mandateId: m.mandate.id,
        contactId: m.contact.id,
        type: "note",
        direction: "internal",
        subject: `Match automatique ${VERDICT_LABELS[m.verdict]} (${m.score.total}/100)`,
        body: m.score.notes.join(" · "),
      });
      alert(`Suggestion de rapprochement loguée dans la timeline de ${contactDisplayName(m.contact)} et du mandat.`);
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link>
    </div>
  );
  if (!mandate) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      Mandat introuvable. <Link href="/pro-agences/mandats" className="text-navy underline">← Retour</Link>
    </div>
  );

  const stats = {
    strong: matches.filter((m) => m.verdict === "strong").length,
    possible: matches.filter((m) => m.verdict === "possible").length,
    weak: matches.filter((m) => m.verdict === "weak").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/mandats" className="hover:text-navy">Mandats</Link>
        <span>/</span>
        <Link href={`/pro-agences/mandats/${mandateId}`} className="hover:text-navy">
          {mandate.reference ?? mandate.id.slice(0, 8)}
        </Link>
        <span>/</span>
        <span className="text-navy">Matching acquéreurs</span>
      </div>

      {/* Header */}
      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">Matching acquéreurs</h1>
        <p className="mt-1 text-sm text-muted">
          Contacts CRM (prospects, leads, acquéreurs) classés par affinité avec ce mandat.
          Scoring sur 4 axes : budget (40 pts), surface (30 pts), zone (20 pts), type (10 pts).
        </p>
      </div>

      {/* Rappel mandat */}
      <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-navy">{mandate.property_address}</span>
          <span className="rounded-full bg-background px-2 py-0.5">{mandate.property_commune ?? "—"}</span>
          <span className="rounded-full bg-background px-2 py-0.5">{mandate.property_type ?? "—"}</span>
          <span className="rounded-full bg-background px-2 py-0.5 font-mono">
            {mandate.prix_demande ? formatEUR(mandate.prix_demande) : "prix ?"}
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 font-mono">
            {mandate.property_surface ? `${mandate.property_surface} m²` : "surface ?"}
          </span>
          {mandate.property_epc_class && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-900">
              CPE {mandate.property_epc_class}
            </span>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        <StatCard label="Forts matches" value={stats.strong} tone="emerald" />
        <StatCard label="Matches possibles" value={stats.possible} tone="amber" />
        <StatCard label="Matches faibles" value={stats.weak} tone="neutral" />
        <StatCard label="Total" value={matches.length} tone="navy" />
      </div>

      {/* Threshold filter */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Seuil minimum :</span>
          {[0, 40, 70].map((s) => (
            <button key={s} onClick={() => setMinScore(s)}
              className={`rounded-full px-3 py-1 font-semibold ${
                minScore === s ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
              }`}>
              {s === 0 ? "Tous" : s === 40 ? "Possibles+" : "Forts seulement"}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucun acquéreur ne correspond aux critères de ce mandat.
          <div className="mt-2 text-xs">
            Enrichissez les profils contacts (budget, surface cible, zones) pour améliorer le matching.
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.map((m) => (
            <div key={m.contact.id} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/pro-agences/crm/contacts/${m.contact.id}`}
                      className="text-base font-semibold text-navy hover:underline truncate">
                      {contactDisplayName(m.contact)}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERDICT_COLORS[m.verdict]}`}>
                      {VERDICT_LABELS[m.verdict]}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted">
                      {m.contact.kind}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
                    {m.contact.email && <span>📧 {m.contact.email}</span>}
                    {m.contact.phone && <span>📞 {m.contact.phone}</span>}
                    {(m.contact.budget_min != null || m.contact.budget_max != null) && (
                      <span>
                        Budget : {m.contact.budget_min ? formatEUR(m.contact.budget_min) : "?"}
                        –{m.contact.budget_max ? formatEUR(m.contact.budget_max) : "?"}
                      </span>
                    )}
                    {(m.contact.target_surface_min != null || m.contact.target_surface_max != null) && (
                      <span>
                        Surface : {m.contact.target_surface_min ?? "?"}–{m.contact.target_surface_max ?? "?"} m²
                      </span>
                    )}
                    {m.contact.target_zones && m.contact.target_zones.length > 0 && (
                      <span>Zones : {m.contact.target_zones.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-navy">{m.score.total}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted">/100</div>
                  </div>
                </div>
              </div>

              {/* Score breakdown bars */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreBar label="Budget" value={m.score.budget} max={40} />
                <ScoreBar label="Surface" value={m.score.surface} max={30} />
                <ScoreBar label="Zone" value={m.score.zone} max={20} />
                <ScoreBar label="Type" value={m.score.type} max={10} />
              </div>

              {/* Notes */}
              <details className="mt-3">
                <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-muted">
                  Détails du score
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-slate">
                  {m.score.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-navy">·</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.contact.email && (
                  <a href={`mailto:${m.contact.email}?subject=${encodeURIComponent(`Bien disponible — ${mandate.property_address}`)}&body=${encodeURIComponent(`Bonjour ${m.contact.first_name ?? ""},\n\nUn bien correspondant à votre recherche vient d'être mis en vente :\n\n${mandate.property_address}${mandate.property_commune ? `\n${mandate.property_commune}` : ""}\n${mandate.prix_demande ? `Prix : ${formatEUR(mandate.prix_demande)}` : ""}${mandate.property_surface ? `\nSurface : ${mandate.property_surface} m²` : ""}\n\nNe manquez pas l'opportunité.\n\nCordialement`)}`}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                    📧 Email pré-rempli
                  </a>
                )}
                <button onClick={() => flagAndContact(m)}
                  className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-background">
                  Loguer la suggestion
                </button>
                <Link href={`/pro-agences/crm/contacts/${m.contact.id}`}
                  className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-slate hover:bg-background">
                  Voir fiche contact →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Algorithme :</strong> scoring heuristique sur 4 axes pondérés. Ne remplace pas le jugement
        commercial mais priorise efficacement quand le portefeuille contacts grandit. Le rapprochement
        s&apos;améliore mécaniquement avec des profils contacts bien renseignés (budget, zones, critères).
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "neutral" | "navy" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200"
    : tone === "amber" ? "bg-amber-50 border-amber-200"
    : tone === "navy" ? "bg-navy text-white border-transparent"
    : "bg-card border-card-border";
  const text = tone === "emerald" ? "text-emerald-900"
    : tone === "amber" ? "text-amber-900"
    : tone === "navy" ? "text-white"
    : "text-navy";
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className={`text-[10px] uppercase tracking-wider ${tone === "navy" ? "text-white/70" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold ${text}`}>{value}</div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct > 0 ? "bg-slate-400" : "bg-slate-200";
  return (
    <div>
      <div className="flex items-baseline justify-between text-[10px] text-muted mb-1">
        <span className="font-semibold uppercase tracking-wider">{label}</span>
        <span className="font-mono">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
