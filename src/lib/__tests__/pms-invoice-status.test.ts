import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }));
vi.mock("../supabase", () => ({ isSupabaseConfigured: true, supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { issueInvoice, markInvoicePaid } from "../pms/invoices";
import { invoiceDocumentTotals } from "../pms/invoice-status";
import type { PmsInvoice } from "../pms/types";
const input = { id: "i", propertyId: "p", userId: "u", updatedAt: "2026-09-09T00:00:00Z", invoiceNumber: "INV-1" };
const invoice = { id: "i", property_id: "p", invoice_number: "INV-1", updated_at: input.updatedAt, currency: "EUR", invoice_type: "standard", issued: false, paid: false, total_ht: 100, total_tva: 3, taxe_sejour: 0, total_ttc: 103 } as PmsInvoice;
function query(result: unknown) {
 const q: Record<string, unknown> = {};
 for (const method of ["select", "eq", "update"]) q[method] = vi.fn(() => q);
 q.single = vi.fn(async () => result); q.maybeSingle = vi.fn(async () => result);
 return q;
}
function prepare(row = invoice, update: unknown = { data: { id: "i" } }) {
 const property = query({ data: { id: "p" } }), read = query({ data: row }), write = query(update);
 mock.from.mockReturnValueOnce(property).mockReturnValueOnce(read).mockReturnValueOnce(write);
 return { property, read, write };
}
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({ data: { user: { id: "u" } } }); });
it("binds an issued mark to its owner, property, reference and unchanged version", async () => {
 const q = prepare(); await issueInvoice(input);
 expect(q.property.eq).toHaveBeenCalledWith("user_id", "u"); expect(q.read.eq).toHaveBeenCalledWith("property_id", "p");
 expect(q.write.eq).toHaveBeenCalledWith("id", "i"); expect(q.write.eq).toHaveBeenCalledWith("property_id", "p");
 expect(q.write.eq).toHaveBeenCalledWith("invoice_number", input.invoiceNumber); expect(q.write.eq).toHaveBeenCalledWith("updated_at", input.updatedAt); expect(q.write.eq).toHaveBeenCalledWith("issued", false);
 expect(q.write.update).toHaveBeenCalledWith({ issued: true, issued_at: expect.any(String) });
});
it("does not rewrite a timestamp when the requested status is already set", async () => {
 const q = prepare({ ...invoice, issued: true }); await issueInvoice(input);
 expect(q.write.update).not.toHaveBeenCalled();
});
it("requires issued status both before and during a paid update", async () => {
 let q = prepare(); await expect(markInvoicePaid(input)).rejects.toThrow("not issued"); expect(q.write.update).not.toHaveBeenCalled();
 mock.from.mockReset(); q = prepare({ ...invoice, issued: true }); await markInvoicePaid(input);
 expect(q.write.eq).toHaveBeenCalledWith("issued", true); expect(q.write.eq).toHaveBeenCalledWith("paid", false);
});
it("refuses a stale version or a changed document reference before writing", async () => {
 for (const patch of [{ updated_at: "2026-09-10T00:00:00Z" }, { invoice_number: "INV-2" }]) {
  mock.from.mockReset(); const q = prepare({ ...invoice, ...patch }); await expect(issueInvoice(input)).rejects.toThrow("changed"); expect(q.write.update).not.toHaveBeenCalled();
 }
});
it("does not silently succeed when an optimistic update matches no row", async () => {
 prepare(invoice, { data: null }); mock.from.mockReturnValueOnce(query({ data: invoice }));
 await expect(issueInvoice(input)).rejects.toThrow("reload");
});
it("accepts a concurrent identical status change without rewriting it", async () => {
 prepare(invoice, { data: null }); mock.from.mockReturnValueOnce(query({ data: { ...invoice, issued: true } }));
 await expect(issueInvoice(input)).resolves.toBeUndefined();
});
it("stops before writing when authentication changes while loading", async () => {
 const q = prepare(); mock.auth.mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValueOnce({ data: { user: { id: "v" } } });
 await expect(issueInvoice(input)).rejects.toThrow("Authentication changed"); expect(q.write.update).not.toHaveBeenCalled();
});
it("reports update errors and rejects inaccessible properties", async () => {
 prepare(invoice, { error: new Error("write failed") }); await expect(issueInvoice(input)).rejects.toThrow("write failed");
 mock.from.mockReset(); mock.from.mockReturnValueOnce(query({ error: new Error("denied") })); await expect(issueInvoice(input)).rejects.toThrow("Property unavailable");
});
it("keeps deposits, standard invoices, credits and pro forma separate by currency", () => {
 const rows = [invoice, ...["deposit", "credit", "proforma"].map(invoice_type => ({ ...invoice, invoice_type, issued: true })), { ...invoice, currency: "USD", issued: true }];
 const r = invoiceDocumentTotals(rows as PmsInvoice[]);
 expect(r).toHaveLength(5); expect(r.find(row => row.type === "deposit")).toMatchObject({ issued: 103, currency: "EUR" });
 expect(r.find(row => row.type === "standard" && row.currency === "USD")?.issued).toBe(103);
 expect(() => invoiceDocumentTotals([{ ...invoice, invoice_type: "unknown" }] as unknown as PmsInvoice[])).toThrow("Unknown");
});
