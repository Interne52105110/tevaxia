import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), update: vi.fn(), insert: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }));
vi.mock("./supabase", () => ({ isSupabaseConfigured: true, supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
import { savePeriod, createHotel } from "./hotels";
import { prepareHotelPeriod } from "./hotel-period";
const input = () => prepareHotelPeriod({ period_start: "2026-01-01", period_end: "2026-03-31", notes: "Documented accounts" }, "hotel");
describe("hotel period persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const query = { update: mocks.update, insert: mocks.insert, eq: mocks.eq, select: mocks.select, single: mocks.single };
    for (const fn of [mocks.from, mocks.update, mocks.insert, mocks.eq, mocks.select]) fn.mockReturnValue(query);
    mocks.single.mockResolvedValue({ data: { id: "period" }, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
  });
  it("blocks writes when authentication fails or no user is returned", async () => {
    for (const auth of [{ data: { user: null }, error: null }, { data: { user: { id: "user" } }, error: new Error("expired") }]) {
      mocks.getUser.mockResolvedValue(auth); await expect(savePeriod(input())).rejects.toThrow("Authentication");
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("revalidates at the persistence boundary and rejects missing sources", async () => {
    await expect(savePeriod({ ...input(), notes: "" })).rejects.toThrow("periodReference");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("scopes updates to both record and hotel and replaces stale derived totals", async () => {
    await savePeriod({ ...input(), id: "period", revenue_total: 999 });
    expect(mocks.eq).toHaveBeenCalledWith("id", "period"); expect(mocks.eq).toHaveBeenCalledWith("hotel_id", "hotel");
    expect(mocks.update.mock.calls[0][0].revenue_total).toBeNull();
  });
  it("sets the authenticated author and propagates database errors", async () => {
    await savePeriod(input()); expect(mocks.insert.mock.calls[0][0].created_by).toBe("user");
    mocks.single.mockResolvedValue({ data: null, error: new Error("write denied") });
    await expect(savePeriod(input())).rejects.toThrow("write denied");
  });
  it("validates hotel creation and requires an authenticated author", async () => {
    for (const rooms of [0, -1, 1.5, NaN, 100001]) await expect(createHotel({ org_id: "org", name: "Hotel", nb_chambres: rooms })).rejects.toThrow("Invalid hotel");
    await expect(createHotel({ org_id: "org", name: "  ", nb_chambres: 10 })).rejects.toThrow("Invalid hotel");
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createHotel({ org_id: "org", name: "Hotel", nb_chambres: 10 })).rejects.toThrow("Authentication");
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
    await createHotel({ org_id: "org", name: " Hotel ", nb_chambres: 10 });
    expect(mocks.insert.mock.calls[0][0]).toMatchObject({ name: "Hotel", nb_chambres: 10, created_by: "user" });
  });
});
