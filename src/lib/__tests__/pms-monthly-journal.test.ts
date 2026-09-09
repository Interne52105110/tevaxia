import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { aggregateMonthlyJournal, journalPeriod, loadMonthlyJournal, type JournalCharge } from "../pms/monthly-journal";
const charge = (id: string, patch: Partial<JournalCharge> = {}): JournalCharge => ({ id, category: "room", line_ht: "100.00", line_tva: "3.00", line_ttc: "103.00", posted_at: "2026-09-01T10:00:00Z", voided: false, ...patch });
const aggregate = (charges: JournalCharge[]) => aggregateMonthlyJournal("p", "Hotel", 2026, 9, charges, []);
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({ data: { user: { id: "u" } }, error: null }); });
describe("monthly posting journal", () => {
  it("separates tourism tax and preserves signed cents and all categories", () => {
    const r = aggregate([charge("1"), charge("2", { category: "meeting_room", line_ht: ".10".replace(/^\./, "0."), line_tva: "0.02", line_ttc: "0.12" }), charge("3", { line_ht: "-20.01", line_tva: "-0.60", line_ttc: "-20.61" }), charge("4", { category: "taxe_sejour", line_ht: "6.00", line_tva: "0.00", line_ttc: "6.00" }), charge("5", { category: "future_category", line_ht: "0.20", line_tva: "0", line_ttc: "0.20" })]);
    expect(r.operating).toMatchObject({ ht: 80.29, vat: 2.42, gross: 82.71, count: 4 });
    expect(r.taxes.gross).toBe(6); expect(r.total.gross).toBe(88.71);
    expect(r.rows).toHaveLength(4); expect(r.occupancy).toBeNull();
  });
  it("uses UTC posting boundaries including fractional final seconds and excludes voids", () => {
    const r = aggregate([charge("1", { posted_at: "2026-09-30T23:59:59.999999Z" }), charge("2", { posted_at: "2026-10-01T00:00:00Z" }), charge("3", { posted_at: "2026-09-01T01:00:00+02:00" }), charge("4", { voided: true })]);
    expect(r.total.count).toBe(1); expect(r.total.gross).toBe(103);
    expect(journalPeriod(2024, 2)).toEqual({ start: "2024-02-01", end: "2024-02-29", nextStart: "2024-03-01", days: 29 });
    expect(journalPeriod(2026, 12).nextStart).toBe("2027-01-01");
  });
  it("sums observed daily inventory without extrapolating missing days", () => {
    const r = aggregateMonthlyJournal("p", "Hotel", 2026, 9, [], [{ audit_date: "2026-09-01", total_rooms: 10, occupied_rooms: 5, closed: true }, { audit_date: "2026-09-03", total_rooms: 20, occupied_rooms: 10, closed: false }]);
    expect(r).toMatchObject({ recordedDays: 2, closedDays: 1, available: 30, occupied: 15, occupancy: 50 });
    expect(aggregateMonthlyJournal("p", "Hotel", 2026, 9, [], [{ audit_date: "2026-09-01", total_rooms: 10, occupied_rooms: 0, closed: true }]).occupancy).toBe(0);
  });
  it("rejects invalid periods, amounts, duplicate lines and inconsistent inventories", () => {
    expect(() => journalPeriod(2026, 13)).toThrow();
    for (const line_ht of [NaN, Infinity, "", "1.001", "1e3"]) expect(() => aggregate([charge("1", { line_ht })])).toThrow();
    expect(() => aggregate([charge("1", { line_ttc: 999 })])).toThrow();
    expect(() => aggregate([charge("1"), charge("1")])).toThrow();
    const a = { audit_date: "2026-09-01", total_rooms: 10, occupied_rooms: 11, closed: false };
    expect(() => aggregateMonthlyJournal("p", "Hotel", 2026, 9, [], [a])).toThrow();
    expect(() => aggregateMonthlyJournal("p", "Hotel", 2026, 9, [], [{ ...a, occupied_rooms: 0 }, { ...a, occupied_rooms: 0 }])).toThrow();
  });
});
function query(result: unknown) {
  const q: Record<string, unknown> = {};
  for (const method of ["select", "eq", "gte", "lte", "lt", "order", "range"]) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  q.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return q;
}
describe("complete and authenticated reads", () => {
  it("reads beyond 1000 rows, uses exclusive month end and property scope", async () => {
    const all = Array.from({ length: 1001 }, (_, i) => charge(String(i)));
    const queries = [query({ data: { id: "p", name: "Hotel" }, error: null }), query({ data: [], count: 0 }), ...[all.slice(0, 500), all.slice(500, 1000), all.slice(1000)].map(data => query({ data, count: 1001 }))];
    for (const q of queries) mock.from.mockReturnValueOnce(q);
    const r = await loadMonthlyJournal("u", "p", 2026, 9);
    expect(r.total).toMatchObject({ count: 1001, ht: 100100, gross: 103103 });
    expect(queries[0].eq).toHaveBeenCalledWith("user_id", "u");
    expect(queries[2].eq).toHaveBeenCalledWith("pms_folios.property_id", "p");
    expect(queries[2].lt).toHaveBeenCalledWith("posted_at", "2026-10-01T00:00:00Z");
    expect(queries[4].range).toHaveBeenCalledWith(1000, 1499);
    expect(mock.auth).toHaveBeenCalledTimes(2);
  });
  it("does not read data under another identity or conceal failed reads", async () => {
    mock.auth.mockResolvedValueOnce({ data: { user: { id: "other" } } });
    await expect(loadMonthlyJournal("u", "p", 2026, 9)).rejects.toThrow(); expect(mock.from).not.toHaveBeenCalled();
    mock.from.mockReturnValueOnce(query({ data: { id: "p", name: "Hotel" } })).mockReturnValueOnce(query({ error: new Error("denied") }));
    await expect(loadMonthlyJournal("u", "p", 2026, 9)).rejects.toThrow("denied");
  });
  it("refuses truncated results instead of reporting partial totals", async () => {
    mock.from.mockReturnValueOnce(query({ data: { id: "p", name: "Hotel" } })).mockReturnValueOnce(query({ data: [], count: 0 })).mockReturnValueOnce(query({ data: [charge("1")], count: 1001 }));
    await expect(loadMonthlyJournal("u", "p", 2026, 9)).rejects.toThrow("Incomplete journal read");
  });
  it("discards a report if authentication changes during loading", async () => {
    mock.auth.mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValueOnce({ data: { user: { id: "other" } } });
    mock.from.mockReturnValueOnce(query({ data: { id: "p", name: "Hotel" } })).mockReturnValueOnce(query({ data: [], count: 0 })).mockReturnValueOnce(query({ data: [], count: 0 }));
    await expect(loadMonthlyJournal("u", "p", 2026, 9)).rejects.toThrow("Authentication changed");
  });
});
