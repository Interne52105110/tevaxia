import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { listHistory, deleteHistoryEntry, saveToHistory } from "../facturation/history";
import type { FacturXInvoice } from "../facturation/factur-x";
function query(result: unknown) {
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["select", "eq", "order", "limit", "gt", "delete", "insert"]) q[name] = vi.fn(() => q);
  q.then = vi.fn(resolve => Promise.resolve(result).then(resolve));
  q.single = vi.fn(async () => result);
  return q;
}
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({ data: { user: { id: "u" } }, error: null }); });
it("reads beyond a short server page, binds owner and sorts the complete history", async () => {
  const first = query({ data: [{ id: "a", created_at: "2026-09-01" }] });
  const second = query({ data: [{ id: "b", created_at: "2026-09-02" }] });
  const last = query({ data: [] });
  mock.from.mockReturnValueOnce(first).mockReturnValueOnce(second).mockReturnValueOnce(last);
  expect((await listHistory(500, "u")).map(x => x.id)).toEqual(["b", "a"]);
  for (const q of [first, second, last]) expect(q.eq).toHaveBeenCalledWith("user_id", "u");
  expect(second.gt).toHaveBeenCalledWith("id", "a"); expect(last.gt).toHaveBeenCalledWith("id", "b");
});
it("never returns an empty history or partial backup after a read error", async () => {
  mock.from.mockReturnValueOnce(query({ data: [{ id: "a", created_at: "2026-09-01" }] })).mockReturnValueOnce(query({ data: null, error: { message: "offline" } }));
  await expect(listHistory(100, "u")).rejects.toThrow("read failed");
});
it("discards data returned after the account changes", async () => {
  mock.auth.mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValueOnce({ data: { user: { id: "u" } } }).mockResolvedValue({ data: { user: { id: "v" } } });
  mock.from.mockReturnValue(query({ data: [{ id: "a" }] }));
  await expect(listHistory(100, "u")).rejects.toThrow("account changed");
});
it("rejects a non-advancing server cursor rather than looping", async () => {
  mock.from.mockReturnValue(query({ data: [{ id: "a" }] }));
  await expect(listHistory()).rejects.toThrow("page order");
});
it("requires an affected owned row before reporting deletion success", async () => {
  const q = query({ data: [] }); mock.from.mockReturnValue(q);
  await expect(deleteHistoryEntry("i", "u")).rejects.toThrow("deletion failed");
  expect(q.eq).toHaveBeenCalledWith("user_id", "u"); expect(q.eq).toHaveBeenCalledWith("id", "i");
});
it("does not save an anonymous document into a subsequently signed-in account", async () => {
  expect(await saveToHistory({} as FacturXInvoice, "generic", null)).toBeNull();
  expect(mock.auth).not.toHaveBeenCalled(); expect(mock.from).not.toHaveBeenCalled();
});
it("rejects saving when the captured owner no longer matches", async () => {
  await expect(saveToHistory({} as FacturXInvoice, "generic", "old")).rejects.toThrow("account changed");
  expect(mock.from).not.toHaveBeenCalled();
});
