// ============================================================
// Facturation — historique des Factur-X générées (12 mois)
// ============================================================
//
// Utilise la table Supabase `factur_x_history` (migration 056).
// RLS garantit qu'un utilisateur ne voit que son propre historique.
// Rétention : 12 mois (purge via cron quotidien).
// ============================================================

import { supabase } from "@/lib/supabase";
import type { FacturXInvoice } from "./factur-x";
import { computeTotals } from "./factur-x";

export interface FacturXHistoryEntry {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  seller_name: string;
  seller_country: string | null;
  buyer_name: string;
  buyer_country: string | null;
  currency: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  template: string | null;
  invoice_data: FacturXInvoice;
  created_at: string;
  expires_at: string;
}

/** Sauvegarde une Factur-X dans l'historique. Silencieux si non-auth ou si Supabase absent. */
export async function saveToHistory(inv: FacturXInvoice, template?: string): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const totals = computeTotals(inv);
  const row = {
    user_id: user.id,
    invoice_number: inv.invoice_number,
    invoice_date: inv.issue_date,
    due_date: inv.due_date ?? null,
    seller_name: inv.seller.name,
    seller_country: inv.seller.country_code,
    buyer_name: inv.buyer.name,
    buyer_country: inv.buyer.country_code,
    currency: inv.currency,
    total_ht: totals.line_total,
    total_tva: totals.vat_total,
    total_ttc: totals.grand_total,
    template: template ?? "generic",
    invoice_data: inv,
  };
  const { data, error } = await supabase
    .from("factur_x_history")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    console.warn("[factur-x history] save failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Liste l'historique de l'utilisateur authentifié (max 100, ordre décroissant). */
export async function listHistory(limit = 100): Promise<FacturXHistoryEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("factur_x_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[factur-x history] list failed:", error.message);
    return [];
  }
  return (data ?? []) as FacturXHistoryEntry[];
}

/** Récupère une entrée par ID. */
export async function getHistoryEntry(id: string): Promise<FacturXHistoryEntry | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("factur_x_history")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as FacturXHistoryEntry;
}

/** Supprime une entrée (respect RLS owner-only). */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("factur_x_history").delete().eq("id", id);
  return !error;
}
