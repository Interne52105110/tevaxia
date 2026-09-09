import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }));
vi.mock("../supabase", () => ({ isSupabaseConfigured: true, supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { listInvoices, invoiceTotalsByCurrency } from "../pms/invoices";
function query(result: unknown) {
  const q: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "range"]) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  q.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return q;
}
const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), property_id: "p", invoice_type: "standard", currency: "EUR", issued: true, paid: false, total_ht: 100, total_tva: 3, taxe_sejour: 0, total_ttc: 103 }));
function property() { const q = query({ data: { id: "p" } }); mock.from.mockReturnValueOnce(q); return q; }
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({ data: { user: { id: "u" } } }); });
it("loads every page beyond 500 and 1000 for display and backup", async () => {
  const p = property();
  const pages = [rows.slice(0, 500), rows.slice(500, 1000), rows.slice(1000)].map(data => query({ data, count: 1001 }));
  pages.forEach(q => mock.from.mockReturnValueOnce(q));
  expect(await listInvoices("p", "u")).toEqual(rows);
  expect(p.eq).toHaveBeenCalledWith("user_id", "u");
  expect(pages[2].range).toHaveBeenCalledWith(1000, 1499);
  expect(pages[0].eq).toHaveBeenCalledWith("property_id", "p");
  expect(pages[0].order).toHaveBeenCalledWith("id");
});
it("distinguishes a confirmed empty set from a query failure", async () => {
  property(); mock.from.mockReturnValueOnce(query({ data: [], count: 0 }));
  expect(await listInvoices("p")).toEqual([]);
  property(); mock.from.mockReturnValueOnce(query({ error: new Error("offline") }));
  await expect(listInvoices("p")).rejects.toThrow("offline");
});
it("refuses truncated or uncounted data", async () => {
  for (const result of [{ data: rows.slice(0, 2), count: 1001 }, { data: [], count: null }, { data: [], count: 200001 }]) {
    property(); mock.from.mockReturnValueOnce(query(result));
    await expect(listInvoices("p")).rejects.toThrow();
  }
});
it("rejects duplicates, foreign rows and changing page counts", async () => {
  for (const data of [[rows[0], rows[0]], [{ id: "x", property_id: "other" }]]) {
    property(); mock.from.mockReturnValueOnce(query({ data, count: data.length }));
    await expect(listInvoices("p")).rejects.toThrow("Invalid invoice page");
  }
  property(); mock.from.mockReturnValueOnce(query({ data: rows.slice(0, 500), count: 1001 })).mockReturnValueOnce(query({ data: rows.slice(500), count: 1002 }));
  await expect(listInvoices("p")).rejects.toThrow("changing");
});
it("does not query under a different identity or an inaccessible property", async () => {
  await expect(listInvoices("p", "other")).rejects.toThrow("Authentication changed");
  expect(mock.from).not.toHaveBeenCalled();
  mock.from.mockReturnValueOnce(query({ data: null, error: new Error("denied") }));
  await expect(listInvoices("p")).rejects.toThrow("Property unavailable");
});
it("discards loaded invoices when authentication changes", async () => {
  mock.auth.mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValueOnce({ data: { user: { id: "other" } } });
  property(); mock.from.mockReturnValueOnce(query({ data: [], count: 0 }));
  await expect(listInvoices("p")).rejects.toThrow("Authentication changed");
});

it("keeps different currencies separate and preserves cent-level credits", () => {
  const data = [
    { ...rows[0], total_ht: 0.1, total_tva: 0, total_ttc: 0.1, paid: true },
    { ...rows[0], total_ht: 0.2, total_tva: 0, total_ttc: 0.2, paid: true },
    { ...rows[0], total_ht: -0.1, total_tva: 0, total_ttc: -0.1 },
    { ...rows[0], currency: "USD", paid: true },
  ];
  expect(invoiceTotalsByCurrency(data as Parameters<typeof invoiceTotalsByCurrency>[0])).toEqual([{ currency: "EUR", issued: 0.2, paid: 0.3 }, { currency: "USD", issued: 103, paid: 103 }]);
});
it("does not treat unknown or unbalanced amounts as zero", () => {
  for (const patch of [{ total_ttc: null }, { total_ttc: NaN }, { total_ht: 99 }, { total_ttc: 103.001 }, { currency: "" }]) {
    expect(() => invoiceTotalsByCurrency([{ ...rows[0], ...patch }] as Parameters<typeof invoiceTotalsByCurrency>[0])).toThrow();
  }
});
