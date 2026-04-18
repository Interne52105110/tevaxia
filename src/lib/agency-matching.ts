// ============================================================
// CRM MATCHING — acquéreur ↔ mandat
// ============================================================
//
// Scoring heuristique d'un contact CRM par rapport à un mandat
// immobilier, basé sur :
//   - budget (prix_demande vs budget_min/max)         [40 pts]
//   - surface (property_surface vs target_surface)    [30 pts]
//   - zone (property_commune vs target_zones[])       [20 pts]
//   - type bien (property_type vs tags)               [10 pts]
//
// Score /100. Seuils :
//   ≥ 70 = fort        → proposer rendez-vous
//   40–69 = possible   → prendre contact
//   <40 = faible       → pas de notification auto
//
// Pas de base de données dédiée : on agit à la lecture sur les
// tables existantes crm_contacts + agency_mandates.

import { supabase, isSupabaseConfigured } from "./supabase";
import type { AgencyMandate, MandateStatus } from "./agency-mandates";
import type { CrmContact, CrmContactKind } from "./crm/types";

export interface MatchScoreBreakdown {
  budget: number;        // /40
  surface: number;       // /30
  zone: number;          // /20
  type: number;          // /10
  total: number;         // /100
  notes: string[];       // explications humaines
}

export type MatchVerdict = "strong" | "possible" | "weak";

export interface MatchResult {
  contact: CrmContact;
  mandate: AgencyMandate;
  score: MatchScoreBreakdown;
  verdict: MatchVerdict;
}

/**
 * Kind de contact éligibles au matching (côté acheteur).
 * On exclut bailleurs/vendeurs qui n'ont pas vocation à acheter ici.
 */
export const BUYER_CONTACT_KINDS: CrmContactKind[] = ["prospect", "lead", "acquereur"];

// ============================================================
// Scoring pur (testable)
// ============================================================

function scoreBudget(
  prix: number | null,
  budgetMin: number | null,
  budgetMax: number | null,
): { score: number; note: string } {
  if (prix == null || prix === 0) return { score: 20, note: "Prix mandat non renseigné" };
  if (budgetMin == null && budgetMax == null) {
    return { score: 10, note: "Budget acquéreur non renseigné" };
  }
  const min = budgetMin ?? 0;
  const max = budgetMax ?? Number.POSITIVE_INFINITY;
  if (prix >= min && prix <= max) {
    return { score: 40, note: `Prix ${prix.toLocaleString("fr-LU")} € dans le budget` };
  }
  // Hors fourchette : pénaliser par écart relatif
  const target = prix < min ? min : max;
  const gapPct = Math.abs(prix - target) / target * 100;
  if (gapPct <= 5) return { score: 30, note: `Prix proche (${gapPct.toFixed(1)}% hors budget)` };
  if (gapPct <= 10) return { score: 20, note: `Prix à ${gapPct.toFixed(1)}% hors budget` };
  if (gapPct <= 20) return { score: 10, note: `Prix à ${gapPct.toFixed(1)}% hors budget` };
  return { score: 0, note: `Prix très éloigné (${gapPct.toFixed(0)}% hors budget)` };
}

function scoreSurface(
  surface: number | null,
  targetMin: number | null,
  targetMax: number | null,
): { score: number; note: string } {
  if (surface == null || surface === 0) return { score: 15, note: "Surface mandat non renseignée" };
  if (targetMin == null && targetMax == null) {
    return { score: 7, note: "Surface cible acquéreur non renseignée" };
  }
  const min = targetMin ?? 0;
  const max = targetMax ?? Number.POSITIVE_INFINITY;
  if (surface >= min && surface <= max) {
    return { score: 30, note: `Surface ${surface} m² dans la fourchette cible` };
  }
  const target = surface < min ? min : max;
  const gapPct = Math.abs(surface - target) / target * 100;
  if (gapPct <= 10) return { score: 20, note: `Surface proche (${gapPct.toFixed(0)}% hors cible)` };
  if (gapPct <= 20) return { score: 10, note: `Surface à ${gapPct.toFixed(0)}% hors cible` };
  return { score: 0, note: `Surface très éloignée (${gapPct.toFixed(0)}% hors cible)` };
}

function scoreZone(
  commune: string | null,
  targetZones: string[] | null,
): { score: number; note: string } {
  if (!commune) return { score: 10, note: "Commune mandat non renseignée" };
  if (!targetZones || targetZones.length === 0) {
    return { score: 5, note: "Zones cibles acquéreur non renseignées" };
  }
  const cNorm = commune.toLowerCase().trim();
  const match = targetZones.some((z) => z.toLowerCase().trim() === cNorm);
  if (match) return { score: 20, note: `${commune} dans les zones cibles` };
  return { score: 0, note: `${commune} hors zones cibles (${targetZones.join(", ")})` };
}

function scoreType(
  propertyType: string | null,
  tags: string[],
): { score: number; note: string } {
  if (!propertyType) return { score: 5, note: "Type de bien mandat non renseigné" };
  if (tags.length === 0) return { score: 3, note: "Pas de préférences type" };
  const tagsNorm = tags.map((t) => t.toLowerCase());
  const typeNorm = propertyType.toLowerCase();
  if (tagsNorm.includes(typeNorm)) {
    return { score: 10, note: `Type "${propertyType}" préféré` };
  }
  return { score: 0, note: `Type "${propertyType}" non dans préférences (${tags.join(", ")})` };
}

export function scoreMatch(contact: CrmContact, mandate: AgencyMandate): MatchScoreBreakdown {
  const b = scoreBudget(mandate.prix_demande, contact.budget_min, contact.budget_max);
  const s = scoreSurface(mandate.property_surface, contact.target_surface_min, contact.target_surface_max);
  const z = scoreZone(mandate.property_commune, contact.target_zones);
  const t = scoreType(mandate.property_type, contact.tags ?? []);
  const total = b.score + s.score + z.score + t.score;
  return {
    budget: b.score,
    surface: s.score,
    zone: z.score,
    type: t.score,
    total,
    notes: [b.note, s.note, z.note, t.note],
  };
}

export function matchVerdict(total: number): MatchVerdict {
  if (total >= 70) return "strong";
  if (total >= 40) return "possible";
  return "weak";
}

export const VERDICT_LABELS: Record<MatchVerdict, string> = {
  strong: "Fort match",
  possible: "Match possible",
  weak: "Match faible",
};

export const VERDICT_COLORS: Record<MatchVerdict, string> = {
  strong: "bg-emerald-100 text-emerald-900",
  possible: "bg-amber-100 text-amber-900",
  weak: "bg-slate-100 text-slate-700",
};

// ============================================================
// Statuts mandats éligibles au matching
// ============================================================

export const MATCHABLE_MANDATE_STATUSES: MandateStatus[] = [
  "mandat_signe", "diffuse", "en_visite", "offre_recue",
];

// ============================================================
// Supabase queries
// ============================================================

/**
 * Pour un mandat donné, retourne les contacts CRM acheteurs triés par score.
 */
export async function findContactsForMandate(
  mandateId: string,
  opts: { minScore?: number; limit?: number } = {},
): Promise<MatchResult[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: mandateData, error: mErr } = await supabase
    .from("agency_mandates")
    .select("*")
    .eq("id", mandateId)
    .single();
  if (mErr || !mandateData) return [];
  const mandate = mandateData as AgencyMandate;

  const { data: contactsData } = await supabase
    .from("crm_contacts")
    .select("*")
    .in("kind", BUYER_CONTACT_KINDS);
  const contacts = (contactsData ?? []) as CrmContact[];

  const threshold = opts.minScore ?? 0;
  const results: MatchResult[] = contacts.map((contact) => {
    const score = scoreMatch(contact, mandate);
    return { contact, mandate, score, verdict: matchVerdict(score.total) };
  }).filter((r) => r.score.total >= threshold);

  results.sort((a, b) => b.score.total - a.score.total);
  return opts.limit ? results.slice(0, opts.limit) : results;
}

/**
 * Pour un contact acquéreur, retourne les mandats actifs triés par score.
 */
export async function findMandatesForContact(
  contactId: string,
  opts: { minScore?: number; limit?: number } = {},
): Promise<MatchResult[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: contactData } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("id", contactId)
    .single();
  if (!contactData) return [];
  const contact = contactData as CrmContact;

  const { data: mandatesData } = await supabase
    .from("agency_mandates")
    .select("*")
    .in("status", MATCHABLE_MANDATE_STATUSES);
  const mandates = (mandatesData ?? []) as AgencyMandate[];

  const threshold = opts.minScore ?? 0;
  const results: MatchResult[] = mandates.map((mandate) => {
    const score = scoreMatch(contact, mandate);
    return { contact, mandate, score, verdict: matchVerdict(score.total) };
  }).filter((r) => r.score.total >= threshold);

  results.sort((a, b) => b.score.total - a.score.total);
  return opts.limit ? results.slice(0, opts.limit) : results;
}
