import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), rpc: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: { auth: mocks, rpc: mocks.rpc } }));
import { deleteOwnAccount, ownedAccountCacheKeys } from "../delete-own-account";
import { DELETED_AUTH_EVENT, deletedAuthKey, isDeletedAuthOwner, markDeletedAuthOwner, visibleAuthUser } from "../deleted-auth-owner";

let owner: string, store: Map<string, string>, sequence = 0;
const session = (id: string) => ({ data: { session: { user: { id }, access_token: `jwt-${id}` } }, error: null });
beforeEach(() => {
  vi.resetAllMocks(); owner = `account-${++sequence}`; store = new Map();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test");
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) });
  mocks.getSession.mockImplementation(async () => session(owner)); mocks.getUser.mockResolvedValue({ data: { user: { get id() { return owner; } } }, error: null });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
  for (const key of ownedAccountCacheKeys(owner)) store.set(key, "owned");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("identity-bound account deletion", () => {
  it("rejects a session from another account before verifying or writing", async () => {
    mocks.getSession.mockResolvedValue(session("other"));
    await expect(deleteOwnAccount(owner, () => true)).rejects.toThrow("changed");
    expect(mocks.getUser).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("requires the captured token to verify the expected owner", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "other" } } });
    await expect(deleteOwnAccount(owner, () => true)).rejects.toThrow("changed");
    expect(mocks.getUser).toHaveBeenCalledWith(`jwt-${owner}`); expect(fetch).not.toHaveBeenCalled();
  });
  it("aborts a changed session before the irreversible request", async () => {
    mocks.getSession.mockResolvedValueOnce(session(owner)).mockResolvedValueOnce(session("other"));
    await expect(deleteOwnAccount(owner, () => true)).rejects.toThrow("changed"); expect(fetch).not.toHaveBeenCalled();
  });
  it("aborts if the confirmation screen was left during identity verification", async () => {
    let live = true; mocks.getUser.mockImplementation(async () => { live = false; return { data: { user: { id: owner } } }; });
    await expect(deleteOwnAccount(owner, () => live)).rejects.toThrow("changed"); expect(fetch).not.toHaveBeenCalled();
  });
  it("does not start without a current confirmation screen", async () => {
    await expect(deleteOwnAccount(owner, () => false)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
  });
  it("uses the verified bearer and only removes that owner's five caches", async () => {
    const protectedKeys = [...ownedAccountCacheKeys("other"), "tevaxia_profile", "tevaxia_valuations", "tevaxia_trash", "tevaxia_rental_properties", "tevaxia_portfolio", "tevaxia-facturation-draft", "tevaxia_profile:v2:guest"];
    protectedKeys.forEach(key => store.set(key, "preserve"));
    vi.mocked(fetch).mockImplementation(async () => { mocks.getSession.mockResolvedValue(session("other")); return new Response(null, { status: 204 }); });
    await expect(deleteOwnAccount(owner, () => true)).resolves.toEqual({ localCleanupComplete: true });
    expect(fetch).toHaveBeenCalledWith("https://example.test/rest/v1/rpc/delete_my_account", expect.objectContaining({ method: "POST", body: "{}", headers: expect.objectContaining({ Authorization: `Bearer jwt-${owner}` }) }));
    expect(fetch).toHaveBeenCalledTimes(1); expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
    expect(ownedAccountCacheKeys(owner).every(key => !store.has(key))).toBe(true);
    expect(protectedKeys.every(key => store.get(key) === "preserve")).toBe(true);
  });
  it("preserves local data after a refused response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("denied", { status: 403 }));
    await expect(deleteOwnAccount(owner, () => true)).rejects.toThrow("not confirmed");
    expect(ownedAccountCacheKeys(owner).every(key => store.has(key))).toBe(true);
  });
  it("does not retry or purge after an ambiguous network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
    await expect(deleteOwnAccount(owner, () => true)).rejects.toThrow(); expect(fetch).toHaveBeenCalledTimes(1);
    expect(ownedAccountCacheKeys(owner).every(key => store.has(key))).toBe(true);
  });
  it("reports partial local cleanup without changing confirmed server success", async () => {
    const blocked = ownedAccountCacheKeys(owner)[0];
    localStorage.removeItem = key => { if (key === blocked) throw new Error("blocked"); store.delete(key); };
    await expect(deleteOwnAccount(owner, () => true)).resolves.toEqual({ localCleanupComplete: false });
    expect(store.has(blocked)).toBe(true); expect(store.has(ownedAccountCacheKeys(owner)[1])).toBe(false);
  });
  it("rejects a missing identity", () => expect(() => ownedAccountCacheKeys("")).toThrow());
});

describe("deleted-account UI suppression", () => {
  const messages = { complete: "confirmed", partial: "local cleanup incomplete" };
  it("suppresses the deleted owner and preserves a newer account", () => {
    markDeletedAuthOwner(owner, messages, true);
    expect(visibleAuthUser({ id: owner })).toBeNull(); expect(visibleAuthUser({ id: "other" })).toEqual({ id: "other" });
    expect(store.get(deletedAuthKey(owner))).toBe("confirmed"); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("reads a confirmed marker after a reload", () => { store.set(deletedAuthKey(owner), "confirmed"); expect(isDeletedAuthOwner(owner)).toBe(true); });
  it("does not treat corrupt or missing markers as a confirmed deletion", () => { store.set(deletedAuthKey(owner), "invalid"); expect(isDeletedAuthOwner(owner)).toBe(false); expect(visibleAuthUser(null)).toBeNull(); });
  it("keeps in-memory suppression and reports blocked persistent storage", () => {
    const listener = vi.fn(); window.addEventListener(DELETED_AUTH_EVENT, listener);
    localStorage.setItem = () => { throw new Error("blocked"); };
    expect(markDeletedAuthOwner(owner, messages, true)).toBe(false); expect(isDeletedAuthOwner(owner)).toBe(true);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ owner, message: messages.partial });
  });
  it("reports partial cache cleanup even if the marker was persisted", () => {
    const listener = vi.fn(); window.addEventListener(DELETED_AUTH_EVENT, listener);
    expect(markDeletedAuthOwner(owner, messages, false)).toBe(false);
    expect((listener.mock.calls[0][0] as CustomEvent).detail.message).toBe(messages.partial);
  });
});
