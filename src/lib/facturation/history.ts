import { supabase } from "@/lib/supabase";
import type { FacturXInvoice } from "./factur-x";
import { computeTotals, validateInvoice } from "./factur-x";

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

/** Bind every operation to the identity that initiated it, in addition to database RLS. */
export async function assertHistoryOwner(expectedUserId: string): Promise<void> {
  if (!supabase || !expectedUserId) throw new Error("History authentication required");
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== expectedUserId) throw new Error("History account changed or unavailable");
}

async function owner(expectedUserId?: string): Promise<string> {
  if (!supabase) throw new Error("History unavailable");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || (expectedUserId && data.user.id !== expectedUserId)) throw new Error("History authentication changed or unavailable");
  return data.user.id;
}

/** Anonymous generation does not save; authenticated callers must capture their identity before generating. */
export async function saveToHistory(inv: FacturXInvoice, template: string | undefined, expectedUserId: string | null): Promise<string | null> {
  if (!expectedUserId) return null;
  await assertHistoryOwner(expectedUserId);
  if (validateInvoice(inv).length) throw new Error("Invalid history document");
  const totals = computeTotals(inv);
  const { data, error } = await supabase!.from("factur_x_history").insert({
    user_id: expectedUserId, invoice_number: inv.invoice_number, invoice_date: inv.issue_date,
    due_date: inv.due_date || null, seller_name: inv.seller.name, seller_country: inv.seller.country_code,
    buyer_name: inv.buyer.name, buyer_country: inv.buyer.country_code, currency: inv.currency,
    total_ht: totals.line_total, total_tva: totals.vat_total, total_ttc: totals.grand_total,
    template: template ?? "generic", invoice_data: inv,
  }).select("id").single();
  if (error || !data?.id) throw new Error("History save failed");
  await assertHistoryOwner(expectedUserId);
  return data.id;
}

/** Complete keyset read. Page size controls requests, never silently truncates the result. */
export async function listHistory(pageSize = 200, expectedUserId?: string): Promise<FacturXHistoryEntry[]> {
  const userId = await owner(expectedUserId);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error("Invalid history page size");
  const rows: FacturXHistoryEntry[] = [];
  let cursor = "";
  for (;;) {
    await assertHistoryOwner(userId);
    let query = supabase!.from("factur_x_history").select("*").eq("user_id", userId).order("id", { ascending: true }).limit(pageSize);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error || !data) throw new Error("History read failed");
    await assertHistoryOwner(userId);
    if (!data.length) break;
    for (const entry of data) {
      if (typeof entry.id !== "string" || entry.id <= cursor) throw new Error("Invalid history page order");
      cursor = entry.id;
      rows.push(entry as FacturXHistoryEntry);
    }
    if (rows.length > 100000) throw new Error("History too large for this export");
  }
  return rows.sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}

export async function getHistoryEntry(id: string, expectedUserId?: string): Promise<FacturXHistoryEntry | null> {
  const userId = await owner(expectedUserId);
  const { data, error } = await supabase!.from("factur_x_history").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) throw new Error("History read failed");
  await assertHistoryOwner(userId);
  return data as FacturXHistoryEntry | null;
}

export async function deleteHistoryEntry(id: string, expectedUserId: string): Promise<boolean> {
  await assertHistoryOwner(expectedUserId);
  const { data, error } = await supabase!.from("factur_x_history").delete().eq("user_id", expectedUserId).eq("id", id).select("id");
  if (error || data?.length !== 1 || data[0].id !== id) throw new Error("History deletion failed");
  await assertHistoryOwner(expectedUserId);
  return true;
}
