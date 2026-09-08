import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), upsert: vi.fn(), limit: vi.fn() }));
vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: () => ({
      upsert: mocks.upsert,
      select: () => ({ eq: () => ({ gt: () => ({ order: () => ({ limit: mocks.limit }) }) }) }),
    }),
  },
}));

import { listerEvaluationsAsync, syncLocalToCloud } from "../storage";

const valuation = (id: string) => ({ id, nom: id, date: "2026-09-08T10:00:00Z", type: "estimation", data: {} });

beforeEach(() => {
  vi.resetAllMocks();
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } });
});
afterEach(() => vi.unstubAllGlobals());

describe("cloud persistence", () => {
  it("counts only writes confirmed by the server", async () => {
    localStorage.setItem("tevaxia_valuations", JSON.stringify([valuation("a"), valuation("b")]));
    mocks.upsert.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "Rejected" } });
    expect(await syncLocalToCloud()).toBe(1);
  });

  it("does not report anonymous records as synchronized", async () => {
    localStorage.setItem("tevaxia_valuations", JSON.stringify([valuation("a")]));
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await syncLocalToCloud()).toBe(0);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("preserves a local save made while the cloud request is pending", async () => {
    mocks.limit.mockImplementation(async () => {
      localStorage.setItem("tevaxia_valuations", JSON.stringify([valuation("new-local")]));
      return { data: [{ ...valuation("remote"), local_id: "remote", created_at: "2026-09-08T09:00:00Z" }], error: null };
    });
    const result = await listerEvaluationsAsync();
    expect(result.items.map((item) => item.id)).toEqual(["new-local", "remote"]);
    expect(JSON.parse(localStorage.getItem("tevaxia_valuations")!).length).toBe(2);
  });

  it("does not resurrect a valuation deleted while a cloud read is pending", async () => {
    localStorage.setItem("tevaxia_valuations", JSON.stringify([valuation("deleted")]));
    mocks.limit.mockImplementation(async () => {
      localStorage.setItem("tevaxia_valuations", "[]");
      localStorage.setItem("tevaxia_trash", JSON.stringify([{ ...valuation("deleted"), deletedAt: new Date().toISOString() }]));
      return { data: [{ ...valuation("deleted"), local_id: "deleted" }], error: null };
    });
    expect((await listerEvaluationsAsync()).items).toEqual([]);
    expect(localStorage.getItem("tevaxia_valuations")).toBe("[]");
  });
});
