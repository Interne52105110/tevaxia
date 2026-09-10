import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: { auth: mocks } }));
import { defaultNotificationPreferences, loadNotificationPreferences, saveNotificationPreferences, type PreferencesSnapshot } from "../notification-preferences";
const timestamp = "2026-09-10T00:00:00Z";
const row = () => ({ user_id: "a", ...defaultNotificationPreferences(), consent_marketing: true, updated_at: timestamp });
const baseline = (): PreferencesSnapshot => ({ preferences: { ...defaultNotificationPreferences(), consent_marketing: true }, updatedAt: timestamp });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test");
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "a" }, access_token: "jwt-a" } }, error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "a" } }, error: null });
  vi.stubGlobal("fetch", vi.fn(async (_url, options) => new Response(JSON.stringify([{ ...row(), ...(options?.body ? JSON.parse(String(options.body)) : {}) }]), { status: 200 })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("notification preferences read", () => {
  it("reads only the verified owner and returns strict booleans", async () => {
    expect(await loadNotificationPreferences("a")).toEqual(baseline());
    const [url, options] = vi.mocked(fetch).mock.calls[0]; expect(new URL(String(url)).searchParams.get("user_id")).toBe("eq.a"); expect(options?.headers).toMatchObject({ Authorization: "Bearer jwt-a" });
  });
  it("uses ungranted defaults only after a confirmed absent row", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("[]")); expect(await loadNotificationPreferences("a")).toEqual({ preferences: defaultNotificationPreferences(), updatedAt: null });
  });
  it("does not convert a read failure into empty preferences", async () => { vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 503 })); await expect(loadNotificationPreferences("a")).rejects.toThrow("read failed"); });
  it.each([{ ...row(), user_id: "b" }, { ...row(), notify_security: "false" }, { ...row(), updated_at: null }])("rejects malformed or foreign rows", async value => { vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([value]))); await expect(loadNotificationPreferences("a")).rejects.toThrow("Invalid"); });
  it("rejects duplicate rows instead of choosing one", async () => { vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([row(), row()]))); await expect(loadNotificationPreferences("a")).rejects.toThrow("Invalid"); });
  it("rejects a response after an account switch", async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: { user: { id: "a" }, access_token: "jwt-a" } } }).mockResolvedValueOnce({ data: { session: { user: { id: "b" }, access_token: "jwt-b" } } });
    await expect(loadNotificationPreferences("a")).rejects.toThrow("changed");
  });
});
describe("confirmed preferences writes", () => {
  it("patches owned notification fields using a version and field predicates", async () => {
    await saveNotificationPreferences("a", baseline(), { ...defaultNotificationPreferences(), notify_product_news: true }, false, () => true);
    const [url, options] = vi.mocked(fetch).mock.calls[0], query = new URL(String(url)).searchParams;
    expect(options?.method).toBe("PATCH"); expect(query.get("user_id")).toBe("eq.a"); expect(query.get("updated_at")).toBe("eq." + timestamp); expect(query.get("consent_marketing")).toBe("eq.true");
    const body = JSON.parse(String(options?.body)); expect(body.notify_product_news).toBe(true); expect(Object.keys(body)).toHaveLength(4); expect(body.profile_types).toBeUndefined(); expect(body.consent_marketing).toBeUndefined();
  });
  it("withdraws all old consent flags only on explicit request", async () => {
    const result = await saveNotificationPreferences("a", baseline(), defaultNotificationPreferences(), true, () => true);
    expect(result.preferences.consent_marketing).toBe(false); expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ consent_analytics: false, consent_marketing: false, consent_third_party: false });
  });
  it("does not send injected or newly granted consent fields", async () => {
    const injected = { ...defaultNotificationPreferences(), consent_analytics: true };
    await saveNotificationPreferences("a", baseline(), injected, false, () => true);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).not.toHaveProperty("consent_analytics");
  });
  it.each([403, 409, 503])("rejects HTTP %s without pretending to save", async status => { vi.mocked(fetch).mockResolvedValue(new Response("{}", { status })); await expect(saveNotificationPreferences("a", baseline(), defaultNotificationPreferences(), false, () => true)).rejects.toThrow("not confirmed"); });
  it("reports zero updated rows as a conflict", async () => { vi.mocked(fetch).mockResolvedValue(new Response("[]")); await expect(saveNotificationPreferences("a", baseline(), defaultNotificationPreferences(), false, () => true)).rejects.toThrow("not confirmed"); });
  it("requires response values to match the requested choice", async () => { vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([row()]))); await expect(saveNotificationPreferences("a", baseline(), { ...defaultNotificationPreferences(), notify_product_news: true }, false, () => true)).rejects.toThrow("not confirmed"); });
  it("creates an absent row without upserting another component's settings", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([{ ...row(), consent_marketing: false }])));
    await saveNotificationPreferences("a", { preferences: defaultNotificationPreferences(), updatedAt: null }, defaultNotificationPreferences(), false, () => true);
    const options = vi.mocked(fetch).mock.calls[0][1]; expect(options?.method).toBe("POST"); expect(options?.headers).toMatchObject({ Prefer: "return=representation" }); expect(JSON.parse(String(options?.body)).user_id).toBe("a");
  });
  it("does not write after leaving the form", async () => { await expect(saveNotificationPreferences("a", baseline(), defaultNotificationPreferences(), false, () => false)).rejects.toThrow("changed"); expect(fetch).not.toHaveBeenCalled(); });
  it("rejects non-boolean choices", async () => { await expect(saveNotificationPreferences("a", baseline(), { ...defaultNotificationPreferences(), notify_product_news: "yes" } as unknown as ReturnType<typeof defaultNotificationPreferences>, false, () => true)).rejects.toThrow("Invalid"); expect(fetch).not.toHaveBeenCalled(); });
});
