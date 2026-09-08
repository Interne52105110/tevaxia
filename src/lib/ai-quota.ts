import { createClient } from "@supabase/supabase-js";

/** Reserve before provider execution; concurrent calls share one database counter. */
export async function reserveAiUsage(userId: string): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Quota service unavailable");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.rpc("reserve_ai_usage", { p_user_id: userId });
  if (error || typeof data !== "number") throw new Error("Quota reservation failed");
  return data;
}
