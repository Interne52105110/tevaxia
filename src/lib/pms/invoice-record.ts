import type { PmsInvoice, PmsProperty } from "./types";

/** Sum recorded amounts in integer cents, keeping each currency separate. */
export function invoiceTotalsByCurrency(invoices: PmsInvoice[]) {
  const totals = new Map<string, { issued: bigint; paid: bigint }>();
  for (const inv of invoices) {
    if (!/^[A-Z]{3}$/.test(inv.currency) || typeof inv.issued !== "boolean" || typeof inv.paid !== "boolean") throw new Error("Invalid invoice status or currency");
    const cents = (value: number) => {
      const text = String(value);
      if (value == null || !/^-?\d+(\.\d{1,2})?$/.test(text)) throw new Error("Invalid invoice amount");
      const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
      return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * (text.startsWith("-") ? -1n : 1n);
    };
    const gross = cents(inv.total_ttc);
    if (cents(inv.total_ht) + cents(inv.total_tva) + cents(inv.taxe_sejour) !== gross) throw new Error("Unbalanced invoice");
    const row = totals.get(inv.currency) ?? { issued: 0n, paid: 0n };
    if (inv.issued) row.issued += gross;
    if (inv.paid) row.paid += gross;
    totals.set(inv.currency, row);
  }
  const amount = (n: bigint) => {
    if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(-Number.MAX_SAFE_INTEGER)) throw new Error("Invoice total too large");
    return Number(n) / 100;
  };
  return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([currency, row]) => ({ currency, issued: amount(row.issued), paid: amount(row.paid) }));
}


/** Reproduce recorded aggregates, never infer a legal invoice or a rate breakdown. */
export function prepareInvoiceRecord(invoice: PmsInvoice, property: PmsProperty) {
  if (!invoice.id || invoice.property_id !== property.id || !invoice.invoice_number?.trim() || !invoice.customer_name?.trim() || !property.name?.trim()) throw new Error("Invalid invoice identity");
  if (!["standard", "deposit", "credit", "proforma"].includes(invoice.invoice_type)) throw new Error("Invalid invoice type");
  const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!date(invoice.issue_date) || (invoice.due_date && !date(invoice.due_date))) throw new Error("Invalid invoice date");
  invoiceTotalsByCurrency([invoice]);
  const cents = (n: number) => {
    if (n == null || !/^-?\d+(\.\d{1,2})?$/.test(String(n))) throw new Error("Invalid recorded amount");
    return BigInt(String(n).replace(/^-/, "").split(".")[0]) * 100n * (n < 0 ? -1n : 1n)
      + BigInt((String(n).replace(/^-/, "").split(".")[1] ?? "").padEnd(2, "0")) * (n < 0 ? -1n : 1n);
  };
  const rows = [
    { key: "room", ht: invoice.hebergement_ht, vat: invoice.hebergement_tva },
    { key: "fb", ht: invoice.fb_ht, vat: invoice.fb_tva },
    { key: "other", ht: invoice.other_ht, vat: invoice.other_tva },
  ].map(row => ({ ...row, ht: Number(cents(row.ht)) / 100, vat: Number(cents(row.vat)) / 100, gross: Number(cents(row.ht) + cents(row.vat)) / 100 }));
  if (rows.reduce((sum, r) => sum + cents(r.ht), 0n) !== cents(invoice.total_ht) || rows.reduce((sum, r) => sum + cents(r.vat), 0n) !== cents(invoice.total_tva)) throw new Error("Incomplete invoice aggregates");
  return { invoice: { ...invoice }, property: { ...property }, rows: rows.filter(row => row.ht !== 0 || row.vat !== 0) };
}
export type InvoiceRecord = ReturnType<typeof prepareInvoiceRecord>;

export const INVOICE_RECORD_LABEL_KEYS = ["title", "scope", "amountScope", "number", "type", "standard", "deposit", "credit", "proforma", "state", "draft", "issued", "paid", "unpaid", "issueDate", "dueDate", "generated", "property", "customer", "groups", "category", "room", "fb", "other", "ht", "vat", "gross", "tax", "total", "notes", "terms", "missing", "download", "downloading", "downloadError"];
