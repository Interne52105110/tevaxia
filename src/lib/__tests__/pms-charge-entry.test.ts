import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }));
vi.mock("../supabase", () => ({ isSupabaseConfigured: true, supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { prepareCharge, type ChargeDraft } from "../pms/charge-entry";
import { postCharge, openFolio, listFolioCharges, groupChargesByCategory } from "../pms/folios";
import type { PmsFolioCharge } from "../pms/types";
const draft: ChargeDraft = { category: "breakfast", description: "Breakfast", quantity: "1", unit_price_ht: "100", tva_rate: "3", notes: "Menu and tax basis reference" };
const id = "11111111-1111-4111-8111-111111111111";
const input = () => ({ id, folio_id: "f", category: draft.category, description: draft.description, quantity: 1, unit_price_ht: 100, tva_rate: 3, notes: draft.notes });
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({ data: { user: { id: "u" } }, error: null }); });
describe("explicit charge calculation", () => {
  it("does not infer the tax rate from the category", () => {
    expect(prepareCharge(draft)).toMatchObject({ ht: 100, vat: 3, gross: 103 });
    expect(prepareCharge({ ...draft, category: "bar", tva_rate: "17" }).gross).toBe(117);
    expect(prepareCharge({ ...draft, category: "bar", tva_rate: "3" }).gross).toBe(103);
    expect(() => prepareCharge({ ...draft, tva_rate: "" })).toThrow();
  });
  it("rounds net first and then VAT, as the database trigger does", () => {
    expect(prepareCharge({ ...draft, quantity: "1.15", unit_price_ht: "8.01", tva_rate: "17" })).toMatchObject({ ht: 9.21, vat: 1.57, gross: 10.78 });
    expect(prepareCharge({ ...draft, quantity: "0.5", unit_price_ht: "0.01" })).toMatchObject({ ht: 0.01, vat: 0, gross: 0.01 });
    expect(prepareCharge({ ...draft, unit_price_ht: "0", tva_rate: "0" }).gross).toBe(0);
  });
  it("rejects missing references, invalid decimals and values the schema cannot store", () => {
    for (const patch of [{ notes: "" }, { description: " " }, { quantity: "0" }, { quantity: "1.001" }, { unit_price_ht: "-1" }, { unit_price_ht: "NaN" }, { unit_price_ht: "100000000" }, { tva_rate: "100" }, { quantity: "999999.99", unit_price_ht: "99999999.99" }]) expect(() => prepareCharge({ ...draft, ...patch })).toThrow();
  });
  it("sums recorded cents without binary decimal drift", () => {
    const charges = [.1, .2].map(line_ht => ({ category: "bar", line_ht, line_tva: 0, line_ttc: line_ht, voided: false } as PmsFolioCharge));
    expect(groupChargesByCategory(charges).bar.ht).toBe(.3);
    expect(() => groupChargesByCategory([{ ...charges[0], line_ht: NaN }])).toThrow();
  });
});
function query(result: unknown) {
  const q: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "range", "upsert", "insert"]) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result); q.maybeSingle = vi.fn(async () => result);
  q.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return q;
}
describe("folio writes and complete reads", () => {
  it("validates before any write and records explicit rate and identity", async () => {
    const f = query({ data: { id: "f", status: "open" } }), p = query({ data: { ...input(), posted_by: "u" } });
    mock.from.mockReturnValueOnce(f).mockReturnValueOnce(p);
    await postCharge(input(), "u");
    expect(f.eq).toHaveBeenCalledWith("pms_properties.user_id", "u");
    expect(p.insert).toHaveBeenCalledWith(expect.objectContaining({ id, tva_rate: 3, unit_price_ht: 100, posted_by: "u", notes: draft.notes }));
    expect(mock.auth).toHaveBeenCalledTimes(2);
  });
  it("rejects unauthenticated, changed identities and closed folios", async () => {
    mock.auth.mockResolvedValueOnce({ data: { user: null } });
    await expect(postCharge(input(), "u")).rejects.toThrow(); expect(mock.from).not.toHaveBeenCalled();
    mock.from.mockReturnValueOnce(query({ data: { id: "f", status: "settled" } }));
    await expect(postCharge(input(), "u")).rejects.toThrow("closed");
    mock.auth.mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValueOnce({ data: { user: { id: "other" } } });
    mock.from.mockReturnValueOnce(query({ data: { id: "f", status: "open" } }));
    await expect(postCharge(input(), "u")).rejects.toThrow("Authentication changed");
  });
  it("does not replace missing rate or quantity with defaults", async () => {
    await expect(postCharge({ ...input(), tva_rate: NaN }, "u")).rejects.toThrow();
    await expect(postCharge({ ...input(), quantity: 0 }, "u")).rejects.toThrow();
    await expect(postCharge({ ...input(), notes: "" }, "u")).rejects.toThrow();
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("reuses a matching recorded UUID after an ambiguous network retry", async () => {
    const recorded = { ...input(), posted_by: "u", source: "manual", external_ref: null, voided: false };
    mock.from.mockReturnValueOnce(query({ data: { id: "f", status: "open" } })).mockReturnValueOnce(query({ error: { code: "23505" } })).mockReturnValueOnce(query({ data: recorded }));
    expect(await postCharge(input(), "u")).toEqual(recorded);
  });
  it("refuses a duplicate UUID with different data", async () => {
    mock.from.mockReturnValueOnce(query({ data: { id: "f", status: "open" } })).mockReturnValueOnce(query({ error: { code: "23505" } })).mockReturnValueOnce(query({ data: { ...input(), unit_price_ht: 200, source: "manual" } }));
    await expect(postCharge(input(), "u")).rejects.toEqual({ code: "23505" });
  });
  it("opening an existing folio never changes its settled status", async () => {
    const upsert = query({ data: null });
    mock.from.mockReturnValueOnce(query({ data: { id: "r" } })).mockReturnValueOnce(upsert).mockReturnValueOnce(query({ data: { id: "f", property_id: "p", status: "settled" } }));
    expect((await openFolio("p", "r")).status).toBe("settled");
    expect(upsert.upsert).toHaveBeenCalledWith(expect.anything(), { onConflict: "reservation_id", ignoreDuplicates: true });
  });
  it("refuses an inaccessible or mismatched reservation before opening", async () => {
    mock.from.mockReturnValueOnce(query({ error: new Error("denied") }));
    await expect(openFolio("p", "r")).rejects.toThrow(); expect(mock.from).toHaveBeenCalledTimes(1);
  });
  it("loads more than a thousand folio lines without silent truncation", async () => {
    const all = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }));
    for (const data of [all.slice(0,500), all.slice(500,1000), all.slice(1000)]) mock.from.mockReturnValueOnce(query({ data, count: 1001 }));
    expect(await listFolioCharges("f")).toHaveLength(1001);
    mock.from.mockReturnValueOnce(query({ data: all.slice(0,2), count: 1001 }));
    await expect(listFolioCharges("f")).rejects.toThrow("Incomplete folio");
  });
});
