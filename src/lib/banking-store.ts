import { createClient } from "@supabase/supabase-js";

export function bankingStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Banking storage unavailable");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function ownsBankAccount(userId: string, accountId: string): Promise<boolean> {
  const { data, error } = await bankingStore().from("banking_connections")
    .select("session_id").eq("user_id", userId).contains("account_ids", [accountId])
    .gt("valid_until", new Date().toISOString()).limit(1);
  if (error) throw new Error("Bank account ownership check failed");
  return !!data?.length;
}
