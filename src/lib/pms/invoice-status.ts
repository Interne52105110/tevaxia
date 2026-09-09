import type { PmsInvoice } from "./types";
import { invoiceTotalsByCurrency } from "./invoice-record";
export const INVOICE_TYPES = ["standard", "deposit", "credit", "proforma"] as const;
/** Face values by document type and currency; never mix deposits, final invoices and pro forma into revenue. */
export function invoiceDocumentTotals(invoices: PmsInvoice[]) {
  if (invoices.some(inv => !INVOICE_TYPES.includes(inv.invoice_type))) throw new Error("Unknown invoice type");
  return INVOICE_TYPES.flatMap(type => invoiceTotalsByCurrency(invoices.filter(inv => inv.invoice_type === type)).map(row => ({ ...row, type })));
}
export type InvoiceStatusInput = { id: string; propertyId: string; userId: string; updatedAt: string; invoiceNumber: string };
