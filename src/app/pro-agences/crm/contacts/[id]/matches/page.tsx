"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  findMandatesForContact, VERDICT_LABELS, VERDICT_COLORS,
  type MatchResult,
} from "@/lib/agency-matching";
import { contactDisplayName, type CrmContact } from "@/lib/crm/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function ContactMatchesPage() {
  const params = useParams<{ id: string }>();
  const contactId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [contact, setContact] = useState<CrmContact | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(40);

  const reload = useCallback(async () => {
    if (!contactId || !isSupabaseConfigured || !supabase || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: contactData } = await supabase
        .from("crm_contacts").select("*").eq("id", contactId).single();
      setContact(contactData as CrmContact | null);
      const results = await findMandatesForContact(contactId, { minScore });
      setMatches(results);
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
    setLoading(false);
  }, [contactId, user, minScore]);

  useEffect(() => { void reload(); }, [reload]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link>
    </div>
  );
  if (!contact) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      Contact introuvable.
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/crm/contacts" className="hover:text-navy">Contacts</Link>
        <span>/</span>
        <Link href={`/pro-agences/crm/contacts/${contactId}`} className="hover:text-navy">
          {contactDisplayName(contact)}
        </Link>
        <span>/</span>
        <span className="text-navy">Biens matchés</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-navy">
        Biens correspondants — {contactDisplayName(contact)}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Mandats actifs classés par affinité avec les critères de cet acquéreur.
      </p>

      {/* Rappel critères acquéreur */}
      <div className="mt-4 rounded-xl border border-card-border bg-card p-4 text-xs">
        <div className="flex flex-wrap gap-3">
          {contact.budget_min != null || contact.budget_max != null ? (
            <span className="rounded-full bg-background px-2 py-1">
              Budget : {contact.budget_min ? formatEUR(contact.budget_min) : "?"}
              –{contact.budget_max ? formatEUR(contact.budget_max) : "?"}
            </span>
          ) : <span className="text-muted italic">Budget non renseigné</span>}
          {contact.target_surface_min != null || contact.target_surface_max != null ? (
            <span className="rounded-full bg-background px-2 py-1">
              Surface : {contact.target_surface_min ?? "?"}–{contact.target_surface_max ?? "?"} m²
            </span>
          ) : null}
          {contact.target_zones && contact.target_zones.length > 0 && (
            <span className="rounded-full bg-background px-2 py-1">
              Zones : {contact.target_zones.join(", ")}
            </span>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <span className="rounded-full bg-background px-2 py-1">
              Préférences : {contact.tags.join(", ")}
            </span>
          )}
        </div>
        {(!contact.budget_min && !contact.budget_max) || !contact.target_zones?.length ? (
          <div className="mt-2 text-[11px] text-amber-700">
            💡 Enrichissez le profil (budget + zones cibles) pour améliorer le matching.
            <Link href={`/pro-agences/crm/contacts/${contactId}`} className="ml-1 underline">
              Modifier →
            </Link>
          </div>
        ) : null}
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Filter */}
      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className="text-muted">Seuil :</span>
        {[0, 40, 70].map((s) => (
          <button key={s} onClick={() => setMinScore(s)}
            className={`rounded-full px-3 py-1 font-semibold ${
              minScore === s ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
            }`}>
            {s === 0 ? "Tous" : s === 40 ? "≥ 40" : "≥ 70"}
          </button>
        ))}
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucun mandat actif ne correspond aux critères de cet acquéreur.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.map((m) => (
            <Link key={m.mandate.id} href={`/pro-agences/mandats/${m.mandate.id}`}
              className="block rounded-xl border border-card-border bg-card p-4 hover:border-navy">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-navy truncate">{m.mandate.property_address}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERDICT_COLORS[m.verdict]}`}>
                      {VERDICT_LABELS[m.verdict]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted">
                    <span>{m.mandate.property_commune ?? "—"}</span>
                    <span>·</span>
                    <span>{m.mandate.property_type ?? "—"}</span>
                    {m.mandate.prix_demande && <><span>·</span><span className="font-mono">{formatEUR(m.mandate.prix_demande)}</span></>}
                    {m.mandate.property_surface && <><span>·</span><span>{m.mandate.property_surface} m²</span></>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-navy">{m.score.total}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted">/100</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
                <span className="text-muted">B: <span className="text-navy font-mono">{m.score.budget}/40</span></span>
                <span className="text-muted">S: <span className="text-navy font-mono">{m.score.surface}/30</span></span>
                <span className="text-muted">Z: <span className="text-navy font-mono">{m.score.zone}/20</span></span>
                <span className="text-muted">T: <span className="text-navy font-mono">{m.score.type}/10</span></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
