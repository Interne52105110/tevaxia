import type { FacturXInvoice } from "./factur-x";

export const LEGACY_INVOICE_DRAFT_KEY = "tevaxia-facturation-draft";
export function invoiceDraftKey(userId: string | null): string {
  return `tevaxia-facturation-draft:v2:${userId === null ? "guest" : "user:" + encodeURIComponent(userId)}`;
}

/** Drafts can be incomplete; validate their shape before rendering editable controls. */
export function parseInvoiceDraft(raw: string): FacturXInvoice {
  const data = JSON.parse(raw);
  const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
  const stringFields = (value: Record<string, unknown>, keys: string[]) => keys.every(key => value[key] === undefined || typeof value[key] === "string");
  if (!object(data) || !["MINIMUM","BASIC_WL","BASIC","EN_16931","EXTENDED"].includes(String(data.profile)) || !["380","381","384","386"].includes(String(data.document_type)) || typeof data.profile !== "string" || typeof data.document_type !== "string" || typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency) || typeof data.invoice_number !== "string" || typeof data.issue_date !== "string") throw new Error("Invalid invoice draft");
  if (!stringFields(data, ["due_date","buyer_reference","contract_reference","purchase_order_reference","payment_iban","payment_bic","payment_reference","payment_terms"])) throw new Error("Invalid invoice draft text");
  for (const key of ["seller", "buyer"]) {
    const party = data[key];
    if (!object(party) || typeof party.name !== "string" || typeof party.country_code !== "string" || !stringFields(party, ["trading_name","legal_id","vat_id","address_line1","address_line2","postcode","city","email","phone"])) throw new Error("Invalid invoice draft party");
  }
  if (data.notes !== undefined && (!Array.isArray(data.notes) || !data.notes.every(note => typeof note === "string"))) throw new Error("Invalid invoice draft notes");
  if (!Array.isArray(data.lines)) throw new Error("Invalid invoice draft lines");
  for (const line of data.lines) {
    if (!object(line) || typeof line.id !== "string" || typeof line.name !== "string" || !stringFields(line, ["description","unit_code"]) || !["S","Z","E","AE","K","G","O"].includes(String(line.vat_category)) || typeof line.vat_category !== "string") throw new Error("Invalid invoice draft line");
    for (const key of ["quantity","unit_price_net","vat_rate_percent","discount_percent"]) {
      if (key === "discount_percent" && line[key] === undefined) continue;
      // JSON encodes a temporarily blank numeric control (NaN) as null.
      if (line[key] === null) line[key] = NaN;
      else if (typeof line[key] !== "number" || !Number.isFinite(line[key])) throw new Error("Invalid invoice draft number");
    }
  }
  return data as unknown as FacturXInvoice;
}

export function storeInvoiceDraft(inv: unknown, userId: string | null): void {
  const raw = JSON.stringify(inv);
  parseInvoiceDraft(raw);
  localStorage.setItem(invoiceDraftKey(userId), raw);
}
