// ============================================================
// RENTAL PAYMENTS — suivi paiements + quittances
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type PaymentStatus = "due" | "partial" | "paid" | "late" | "cancelled";
export type PaymentMethod = "virement" | "cheque" | "prelevement" | "espece" | "autre";

export interface RentalPayment {
  id: string;
  lot_id: string;
  user_id: string;
  period_year: number;
  period_month: number;
  amount_rent: number;
  amount_charges: number;
  amount_total: number;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  status: PaymentStatus;
  receipt_issued_at: string | null;
  receipt_sha256: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listPaymentsForLot(lotId: string): Promise<RentalPayment[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("rental_payments")
    .select("*")
    .eq("lot_id", lotId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RentalPayment[];
}

export async function upsertPayment(input: {
  id?: string;
  lot_id: string;
  period_year: number;
  period_month: number;
  amount_rent: number;
  amount_charges: number;
  paid_at?: string | null;
  payment_method?: PaymentMethod | null;
  payment_reference?: string | null;
  status?: PaymentStatus;
  notes?: string | null;
}): Promise<RentalPayment> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const payload = {
    lot_id: input.lot_id,
    user_id: user.id,
    period_year: input.period_year,
    period_month: input.period_month,
    amount_rent: input.amount_rent,
    amount_charges: input.amount_charges,
    paid_at: input.paid_at ?? null,
    payment_method: input.payment_method ?? null,
    payment_reference: input.payment_reference ?? null,
    status: input.status ?? "due",
    notes: input.notes ?? null,
  };

  const { data, error } = await client
    .from("rental_payments")
    .upsert(payload, { onConflict: "lot_id,period_year,period_month" })
    .select("*")
    .single();
  if (error) throw error;
  return data as RentalPayment;
}

export async function deletePayment(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("rental_payments").delete().eq("id", id);
  if (error) throw error;
}

export async function markPaid(id: string, method: PaymentMethod = "virement"): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("rental_payments")
    .update({ status: "paid", paid_at: new Date().toISOString().slice(0, 10), payment_method: method })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Génère les 12 mois d'une année pour un lot (upsert en masse).
 * Les mois déjà existants sont préservés.
 */
export async function seedYear(lotId: string, year: number, monthlyRent: number, monthlyCharges: number): Promise<number> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const rows = months.map((m) => {
    const periodDate = new Date(year, m - 1, 1);
    const isPast = periodDate < today;
    return {
      lot_id: lotId,
      user_id: user.id,
      period_year: year,
      period_month: m,
      amount_rent: monthlyRent,
      amount_charges: monthlyCharges,
      status: isPast ? "due" : "due",
    };
  });

  const { error } = await client
    .from("rental_payments")
    .upsert(rows, { onConflict: "lot_id,period_year,period_month", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}
