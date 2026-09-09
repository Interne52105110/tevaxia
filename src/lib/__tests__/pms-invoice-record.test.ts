import { expect, it } from "vitest";
import { prepareInvoiceRecord } from "../pms/invoice-record";
import type { PmsInvoice, PmsProperty } from "../pms/types";
const property = { id: "p", name: "Current Hotel" } as PmsProperty;
const invoice = { id: "i", property_id: "p", invoice_number: "C-2026-01", customer_name: "Alice", invoice_type: "credit", currency: "EUR", issued: false, paid: false, issue_date: "2026-09-09", due_date: null, hebergement_ht: -100, hebergement_tva: -3, fb_ht: -50.5, fb_tva: -1.52, other_ht: 10, other_tva: 1.7, total_ht: -140.5, total_tva: -2.82, taxe_sejour: -4, total_ttc: -147.32 } as PmsInvoice;
it("preserves signed aggregates and recorded credit/draft status without inferring rates", () => {
  const r = prepareInvoiceRecord(invoice, property);
  expect(r.rows).toEqual([{ key: "room", ht: -100, vat: -3, gross: -103 }, { key: "fb", ht: -50.5, vat: -1.52, gross: -52.02 }, { key: "other", ht: 10, vat: 1.7, gross: 11.7 }]);
  expect(r.invoice.invoice_type).toBe("credit"); expect(r.invoice.issued).toBe(false);
  expect(r.invoice).not.toBe(invoice); expect(r.property).not.toBe(property);
});
it("keeps all four document types without turning pro forma into an issued standard invoice", () => {
  for (const invoice_type of ["standard", "credit", "deposit", "proforma"] as const) expect(prepareInvoiceRecord({ ...invoice, invoice_type }, property).invoice.invoice_type).toBe(invoice_type);
});
it("refuses category amounts that fail to reconcile with the record", () => {
  for (const patch of [{ hebergement_ht: -99 }, { fb_tva: -1 }, { total_ttc: -140 }, { fb_ht: NaN }]) expect(() => prepareInvoiceRecord({ ...invoice, ...patch }, property)).toThrow();
});
it("refuses wrong identity, missing reference and impossible calendar dates", () => {
  for (const patch of [{ property_id: "other" }, { invoice_number: "" }, { customer_name: "" }, { issue_date: "2026-02-30" }, { due_date: "not-a-date" }]) expect(() => prepareInvoiceRecord({ ...invoice, ...patch }, property)).toThrow();
});
it("retains complete notes and recorded terms instead of truncating or moving them into a fixed footer", () => {
  const notes = "Evidence ".repeat(1000) + "END-NOTES", legal_footer = "Terms ".repeat(1000) + "END-TERMS";
  expect(prepareInvoiceRecord({ ...invoice, notes, legal_footer }, property).invoice).toMatchObject({ notes, legal_footer });
});
