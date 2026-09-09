import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsInvoice } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

import { invoiceDocumentTotals, type InvoiceStatusInput } from "./invoice-status";
export { invoiceTotalsByCurrency } from "./invoice-record";

/** Complete live read. A changing or truncated result must not become a partial KPI or backup. */
export async function listInvoices(propertyId: string, expectedUserId?: string): Promise<PmsInvoice[]> {
  const client = ensureClient();
  const identity = await client.auth.getUser();
  const userId = identity.data.user?.id;
  if (identity.error || !userId || (expectedUserId && expectedUserId !== userId)) throw new Error("Authentication changed");
  const property = await client.from("pms_properties").select("id").eq("id", propertyId).eq("user_id", userId).single();
  if (property.error || !property.data) throw new Error("Property unavailable");
  const rows: PmsInvoice[] = [], ids = new Set<string>();
  let expected: number | null = null;
  for (let offset = 0; ; offset += 500) {
    const result = await client.from("pms_invoices").select("*", { count: "exact" })
      .eq("property_id", propertyId).order("issue_date", { ascending: false }).order("id").range(offset, offset + 499);
    if (result.error) throw result.error;
    if (result.count == null || result.count > 200000 || (expected !== null && expected !== result.count)) throw new Error("Incomplete or changing invoice read");
    expected = result.count;
    const page = (result.data ?? []) as PmsInvoice[];
    for (const row of page) {
      if (!row.id || ids.has(row.id) || row.property_id !== propertyId) throw new Error("Invalid invoice page");
      ids.add(row.id); rows.push(row);
    }
    if (rows.length === expected) break;
    if (page.length !== 500 || rows.length > expected) throw new Error("Incomplete invoice read");
  }
  const finalIdentity = await client.auth.getUser();
  if (finalIdentity.error || finalIdentity.data.user?.id !== userId) throw new Error("Authentication changed");
  invoiceDocumentTotals(rows);
  return rows;
}

export async function getInvoice(id: string): Promise<PmsInvoice | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("pms_invoices").select("*").eq("id", id).single();
  if (error) return null;
  return data as PmsInvoice;
}

export async function nextInvoiceNumber(propertyId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_next_invoice_number", { p_property_id: propertyId });
  if (error) throw error;
  return data as string;
}

export async function createInvoice(
  input: Partial<PmsInvoice> & { property_id: string; customer_name: string }
): Promise<PmsInvoice> {
  const client = ensureClient();
  const number = input.invoice_number ?? (await nextInvoiceNumber(input.property_id));
  const { data, error } = await client
    .from("pms_invoices")
    .insert({ ...input, invoice_number: number })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsInvoice;
}

/** Records a manual status only. Invoice issuance/immutability require their own server workflow. */
async function markInvoiceStatus(input: InvoiceStatusInput, field: "issued" | "paid"): Promise<void> {
  const { id, propertyId, userId, updatedAt, invoiceNumber } = input;
  if (!id || !propertyId || !userId || !invoiceNumber || !updatedAt || !Number.isFinite(Date.parse(updatedAt))) throw new Error("Invalid document reference");
  const client = ensureClient();
  const checkIdentity = async () => {
    const auth = await client.auth.getUser();
    if (auth.error || auth.data.user?.id !== userId) throw new Error("Authentication changed");
  };
  await checkIdentity();
  const property = await client.from("pms_properties").select("id").eq("id", propertyId).eq("user_id", userId).single();
  if (property.error || !property.data) throw new Error("Property unavailable");
  const read = async () => {
    const result = await client.from("pms_invoices").select("*").eq("id", id).eq("property_id", propertyId).single();
    if (result.error || !result.data) throw new Error("Document unavailable");
    const inv = result.data as PmsInvoice;
    if (inv.id !== id || inv.property_id !== propertyId || inv.invoice_number !== invoiceNumber) throw new Error("Document changed");
    invoiceDocumentTotals([inv]);
    return inv;
  };
  const current = await read();
  await checkIdentity();
  if (current[field]) return; // A retry must not rewrite the original status timestamp.
  if (current.updated_at !== updatedAt || (field === "paid" && !current.issued)) throw new Error("Document changed or not issued");
  let update = client.from("pms_invoices").update({ [field]: true, [field === "issued" ? "issued_at" : "paid_at"]: new Date().toISOString() })
    .eq("id", id).eq("property_id", propertyId).eq("invoice_number", invoiceNumber).eq("updated_at", updatedAt).eq(field, false);
  if (field === "paid") update = update.eq("issued", true);
  const result = await update.select("id").maybeSingle();
  if (result.error) throw result.error;
  await checkIdentity();
  if (!result.data) {
    const latest = await read();
    await checkIdentity();
    if (!latest[field]) throw new Error("Document changed; reload before retrying");
  }
}
export async function issueInvoice(input: InvoiceStatusInput): Promise<void> { await markInvoiceStatus(input, "issued"); }
export async function markInvoicePaid(input: InvoiceStatusInput): Promise<void> { await markInvoiceStatus(input, "paid"); }

/**
 * Calcule les totaux d'une facture (HT, TVA par catégorie, TTC, taxe séjour).
 * TVA LU hébergement 3 % (art. 40 loi TVA 12.02.1979 + annexe B).
 * TVA LU F&B 17 % sauf certains cas à 8/14 %.
 */
export function computeInvoiceTotals(lines: {
  hebergementHt: number;
  hebergementTvaRate: number;
  fbHt: number;
  fbTvaRate: number;
  otherHt: number;
  otherTvaRate: number;
  taxeSejour: number;
}): {
  hebergementTva: number;
  fbTva: number;
  otherTva: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
} {
  const r = (n: number) => Math.round(n * 100) / 100;
  const hebergementTva = r(lines.hebergementHt * lines.hebergementTvaRate / 100);
  const fbTva = r(lines.fbHt * lines.fbTvaRate / 100);
  const otherTva = r(lines.otherHt * lines.otherTvaRate / 100);
  const totalHt = r(lines.hebergementHt + lines.fbHt + lines.otherHt);
  const totalTva = r(hebergementTva + fbTva + otherTva);
  const totalTtc = r(totalHt + totalTva + lines.taxeSejour);
  return { hebergementTva, fbTva, otherTva, totalHt, totalTva, totalTtc };
}

/**
 * À partir d'un total TTC, calcule le HT correspondant (utile pour afficher ventilation
 * si l'hôtelier saisit le TTC et non le HT).
 */
export function ttcToHt(ttc: number, tvaRatePct: number): number {
  return Math.round((ttc / (1 + tvaRatePct / 100)) * 100) / 100;
}
