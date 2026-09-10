import { supabase } from "./supabase";
import { portfolioStorageKey } from "./manual-portfolio";
import { valuationStorageKey } from "./storage";
import { profileStorageKey } from "./profile";
import { rentalStorageKey } from "./gestion-locative";
import { invoiceDraftKey } from "./facturation/draft";

export function ownedAccountCacheKeys(owner: string): string[] {
  if (!owner) throw new Error("Missing account identity");
  return [portfolioStorageKey(owner), valuationStorageKey(owner), profileStorageKey(owner), rentalStorageKey(owner), invoiceDraftKey(owner)];
}

/** The irreversible request always uses the explicitly verified, captured JWT. */
export async function deleteOwnAccount(owner: string, stillCurrent: () => boolean): Promise<{ localCleanupComplete: boolean }> {
  if (!supabase || !owner || !stillCurrent()) throw new Error("Account deletion unavailable");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Account deletion unavailable");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (session.error || !token || session.data.session?.user.id !== owner) throw new Error("Account changed");
  const verified = await supabase.auth.getUser(token);
  if (verified.error || verified.data.user?.id !== owner) throw new Error("Account changed");
  const current = await supabase.auth.getSession();
  if (current.error || current.data.session?.user.id !== owner || !stillCurrent()) throw new Error("Account changed");
  const response = await fetch(`${url}/rest/v1/rpc/delete_my_account`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}", cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Account deletion not confirmed");
  // Never clear guest, unassigned legacy or another user's data. Do not run
  // SDK signOut here: it reads the current session again after acquiring a lock.
  let localCleanupComplete = true;
  for (const cacheKey of ownedAccountCacheKeys(owner)) {
    try { localStorage.removeItem(cacheKey); } catch { localCleanupComplete = false; }
  }
  return { localCleanupComplete };
}
