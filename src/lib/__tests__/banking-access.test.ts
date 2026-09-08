import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ owns: vi.fn(), transactions: vi.fn() }));
vi.mock("@/lib/banking-store", () => ({ ownsBankAccount: mocks.owns }));
vi.mock("@/lib/enable-banking", () => ({ isConfigured: () => true, getAccountTransactions: mocks.transactions }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-a" } } }) } }) }));
import { GET } from "@/app/api/psd2/transactions/route";

describe("bank account access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    mocks.transactions.mockResolvedValue([]);
  });
  it("rejects unauthenticated calls", async () => {
    expect((await GET(new Request("https://tevaxia.lu/api/psd2/transactions?accountId=b"))).status).toBe(401);
    expect(mocks.transactions).not.toHaveBeenCalled();
  });
  it("never queries the provider for another user's account", async () => {
    mocks.owns.mockResolvedValue(false);
    const res = await GET(new Request("https://tevaxia.lu/api/psd2/transactions?accountId=b", { headers: { Authorization: "Bearer test" } }));
    expect(res.status).toBe(403);
    expect(mocks.owns).toHaveBeenCalledWith("user-a", "b");
    expect(mocks.transactions).not.toHaveBeenCalled();
  });
  it("allows a verified owner", async () => {
    mocks.owns.mockResolvedValue(true);
    const res = await GET(new Request("https://tevaxia.lu/api/psd2/transactions?accountId=a", { headers: { Authorization: "Bearer test" } }));
    expect(res.status).toBe(200);
    expect(mocks.transactions).toHaveBeenCalledWith("a", undefined);
  });
});
