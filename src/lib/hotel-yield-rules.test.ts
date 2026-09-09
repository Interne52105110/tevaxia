import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), single: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { auth: { getUser: m.getUser }, from: m.from } }));
import { validateYieldDraft, saveYieldRule, removeYieldRule, loadYieldRules, type YieldDraft } from "./hotel-yield-rules";
const draft = (): YieldDraft => ({ hotel_id: "hotel", alert_type: "occupancy_drop", threshold_pct: 0, threshold_days: 7, is_active: false });
describe("hotel yield rule settings", () => {
  beforeEach(() => {
    vi.resetAllMocks(); const q = { select: m.select, eq: m.eq, order: m.order, insert: m.insert, update: m.update, delete: m.delete, single: m.single };
    for (const f of [m.from, m.select, m.eq, m.insert, m.update, m.delete]) f.mockReturnValue(q);
    m.single.mockResolvedValue({ data: { id: "id" }, error: null });
    m.order.mockResolvedValue({ data: [], error: null });
    m.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
  });
  it("validates precision, occupation bounds and days while allowing negative GOP", () => {
    expect(validateYieldDraft(draft()).threshold_pct).toBe(0);
    expect(validateYieldDraft({ ...draft(), alert_type: "gop_margin_below", threshold_pct: -20.25 }).threshold_pct).toBe(-20.25);
    for (const patch of [{ threshold_pct: NaN }, { threshold_pct: 101 }, { threshold_pct: -1 }, { threshold_pct: .001 }, { threshold_days: 0 }, { threshold_days: 1.5 }, { threshold_days: 367 }]) expect(() => validateYieldDraft({ ...draft(), ...patch })).toThrow();
  });
  it("blocks a changed account before querying or mutating records", async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: "other" } }, error: null });
    await expect(saveYieldRule("user", draft())).rejects.toThrow("Authentication changed");
    await expect(removeYieldRule("user", "rule", "hotel")).rejects.toThrow("Authentication changed");
    expect(m.from).not.toHaveBeenCalled();
  });
  it("rejects an inaccessible hotel and does not insert", async () => {
    m.single.mockResolvedValue({ data: null, error: new Error("denied") });
    await expect(saveYieldRule("user", draft())).rejects.toThrow("Hotel unavailable"); expect(m.insert).not.toHaveBeenCalled();
  });
  it("creates without automatically enabling email or push", async () => {
    await saveYieldRule("user", draft());
    expect(m.insert).toHaveBeenCalledWith({ ...draft(), user_id: "user", notify_email: false, notify_push: false });
  });
  it("scopes updates and deletes by user, hotel and rule and reports write failures", async () => {
    await saveYieldRule("user", { ...draft(), id: "rule" });
    expect(m.eq).toHaveBeenCalledWith("user_id", "user"); expect(m.eq).toHaveBeenCalledWith("hotel_id", "hotel"); expect(m.eq).toHaveBeenCalledWith("id", "rule");
    m.single.mockResolvedValue({ data: null, error: new Error("write failed") });
    await expect(removeYieldRule("user", "rule", "hotel")).rejects.toThrow("write failed");
  });
  it("does not treat failed reads as an empty list", async () => {
    m.order.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: null, error: new Error("read failed") });
    await expect(loadYieldRules("user")).rejects.toThrow("read failed");
  });
});
