// ============================================================
// PMS — FOLIOS (client running tab)
// ============================================================

import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsChargeCategory, PmsFolio, PmsFolioCharge } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

/**
 * Catégories F&B vs autres services — drives TVA split in invoices.
 */
export const FB_CATEGORIES: PmsChargeCategory[] = [
  "breakfast", "lunch", "dinner", "bar", "minibar", "room_service", "meeting_room",
];

export const OTHER_CATEGORIES: PmsChargeCategory[] = [
  "extra_bed", "parking", "laundry", "spa", "phone", "internet",
  "transport", "cancellation_fee", "damage", "other",
];

export const CATEGORY_LABELS: Record<PmsChargeCategory, string> = {
  room: "Hébergement",
  taxe_sejour: "Taxe séjour",
  extra_bed: "Lit supplémentaire",
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  bar: "Bar",
  minibar: "Minibar",
  room_service: "Room service",
  meeting_room: "Salle de réunion",
  parking: "Parking",
  laundry: "Blanchisserie",
  spa: "Spa",
  phone: "Téléphone",
  internet: "Internet premium",
  transport: "Transport",
  cancellation_fee: "Frais annulation",
  damage: "Dommages",
  other: "Divers",
};

/**
 * Taux de TVA par catégorie au Luxembourg (valeurs par défaut).
 * Peut être surchargé par charge.
 */
export const CATEGORY_DEFAULT_TVA: Record<PmsChargeCategory, number> = {
  room: 3,           // hébergement TVA 3%
  taxe_sejour: 0,    // hors TVA
  extra_bed: 3,      // suit l'hébergement
  breakfast: 17,     // F&B
  lunch: 17,
  dinner: 17,
  bar: 17,
  minibar: 17,
  room_service: 17,
  meeting_room: 17,
  parking: 17,
  laundry: 17,
  spa: 17,
  phone: 17,
  internet: 17,
  transport: 17,
  cancellation_fee: 17,
  damage: 17,
  other: 17,
};

// ---------- Folios ----------

export async function getFolioByReservation(reservationId: string): Promise<PmsFolio | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("pms_folios")
    .select("*")
    .eq("reservation_id", reservationId)
    .maybeSingle();
  return (data as PmsFolio | null) ?? null;
}

export async function openFolio(propertyId: string, reservationId: string): Promise<PmsFolio> {
  const client = ensureClient();
  const { data, error } = await client
    .from("pms_folios")
    .upsert(
      { property_id: propertyId, reservation_id: reservationId, status: "open" },
      { onConflict: "reservation_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsFolio;
}

export async function autoPostRoomCharges(folioId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_folio_auto_post_room_charges", { p_folio_id: folioId });
  if (error) throw error;
  return Number(data ?? 0);
}

/**
 * Convertit le folio en facture définitive (ventilation TVA automatique).
 * Retourne l'UUID de la facture créée.
 */
export async function settleFolio(folioId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_settle_folio", { p_folio_id: folioId });
  if (error) throw error;
  return data as string;
}

// ---------- Charges ----------

export async function listFolioCharges(folioId: string, includeVoided = false): Promise<PmsFolioCharge[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("pms_folio_charges").select("*").eq("folio_id", folioId);
  if (!includeVoided) q = q.eq("voided", false);
  const { data } = await q.order("posted_at", { ascending: true });
  return (data ?? []) as PmsFolioCharge[];
}

export async function postCharge(input: {
  folio_id: string;
  category: PmsChargeCategory;
  description: string;
  quantity?: number;
  unit_price_ht: number;
  tva_rate?: number;
  source?: string;
  external_ref?: string;
  notes?: string;
}): Promise<PmsFolioCharge> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("pms_folio_charges")
    .insert({
      folio_id: input.folio_id,
      category: input.category,
      description: input.description,
      quantity: input.quantity ?? 1,
      unit_price_ht: input.unit_price_ht,
      tva_rate: input.tva_rate ?? CATEGORY_DEFAULT_TVA[input.category],
      source: input.source ?? "manual",
      external_ref: input.external_ref ?? null,
      notes: input.notes ?? null,
      posted_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsFolioCharge;
}

export async function voidCharge(id: string, reason: string): Promise<void> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client
    .from("pms_folio_charges")
    .update({
      voided: true,
      voided_at: new Date().toISOString(),
      voided_by: user?.id ?? null,
      void_reason: reason,
    })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Pure helpers ----------

/**
 * Groupe des charges par catégorie avec totaux HT/TVA/TTC.
 * Utile pour le récap visible côté page.
 */
export function groupChargesByCategory(
  charges: PmsFolioCharge[],
): Record<PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }> {
  const init: Record<string, { count: number; ht: number; tva: number; ttc: number }> = {};
  const out = init as Record<PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }>;
  for (const c of charges) {
    if (c.voided) continue;
    const key = c.category;
    if (!out[key]) out[key] = { count: 0, ht: 0, tva: 0, ttc: 0 };
    out[key].count += 1;
    out[key].ht += Number(c.line_ht);
    out[key].tva += Number(c.line_tva);
    out[key].ttc += Number(c.line_ttc);
  }
  return out;
}

/**
 * Ventilation TVA pour pré-visualisation facture (3 buckets : hébergement / F&B / autres + taxe séjour).
 */
export function computeVatBreakdown(charges: PmsFolioCharge[]): {
  hebergement: { ht: number; tva: number; ttc: number };
  fb: { ht: number; tva: number; ttc: number };
  other: { ht: number; tva: number; ttc: number };
  taxe_sejour: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
} {
  const out = {
    hebergement: { ht: 0, tva: 0, ttc: 0 },
    fb: { ht: 0, tva: 0, ttc: 0 },
    other: { ht: 0, tva: 0, ttc: 0 },
    taxe_sejour: 0,
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
  };
  for (const c of charges) {
    if (c.voided) continue;
    if (c.category === "room" || c.category === "extra_bed") {
      out.hebergement.ht += Number(c.line_ht);
      out.hebergement.tva += Number(c.line_tva);
      out.hebergement.ttc += Number(c.line_ttc);
    } else if (c.category === "taxe_sejour") {
      out.taxe_sejour += Number(c.line_ttc);
    } else if (FB_CATEGORIES.includes(c.category)) {
      out.fb.ht += Number(c.line_ht);
      out.fb.tva += Number(c.line_tva);
      out.fb.ttc += Number(c.line_ttc);
    } else {
      out.other.ht += Number(c.line_ht);
      out.other.tva += Number(c.line_tva);
      out.other.ttc += Number(c.line_ttc);
    }
    out.total_ht += Number(c.line_ht);
    out.total_tva += Number(c.line_tva);
    out.total_ttc += Number(c.line_ttc);
  }
  return out;
}
