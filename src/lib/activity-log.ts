import { supabase, isSupabaseConfigured } from "./supabase";

export interface ActivityEntry {
  id: number;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_family: string | null;
  user_agent_family: string | null;
  created_at: string;
}

function uaFamily(ua: string): string {
  if (!ua) return "other";
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "edge";
  if (s.includes("chrome/")) return "chrome";
  if (s.includes("firefox/")) return "firefox";
  if (s.includes("safari/") && !s.includes("chrome")) return "safari";
  return "other";
}

export async function logActivity(
  action: string,
  opts?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  try {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action,
      entity_type: opts?.entityType ?? null,
      entity_id: opts?.entityId ?? null,
      metadata: opts?.metadata ?? {},
      user_agent_family: uaFamily(ua),
    });
  } catch {
    // fire-and-forget, never throw in UI
  }
}

export async function listMyActivity(limit = 50): Promise<ActivityEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("user_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ActivityEntry[];
}
