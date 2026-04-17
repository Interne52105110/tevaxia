import { supabase, isSupabaseConfigured } from "./supabase";

export type ConsentCategory =
  | "marketing_emails"
  | "analytics_usage"
  | "third_party_sharing"
  | "profile_personalization"
  | "audit_legal";

export interface UserConsent {
  id: string;
  user_id: string;
  category: ConsentCategory;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  policy_version: string;
  source: string | null;
  notes: string | null;
}

export interface ConsentHistoryEntry {
  id: number;
  user_id: string;
  category: ConsentCategory;
  previous_granted: boolean | null;
  new_granted: boolean;
  changed_at: string;
  policy_version: string;
  source: string | null;
}

const CURRENT_POLICY_VERSION = "1.0";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listMyConsents(): Promise<UserConsent[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("user_consents")
    .select("*")
    .order("category");
  if (error) return [];
  return (data ?? []) as UserConsent[];
}

export async function setConsent(category: ConsentCategory, granted: boolean, source: "signup" | "settings" | "banner" = "settings"): Promise<void> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const { error } = await client
    .from("user_consents")
    .upsert({
      user_id: user.id,
      category,
      granted,
      policy_version: CURRENT_POLICY_VERSION,
      source,
      revoked_at: granted ? null : new Date().toISOString(),
    }, { onConflict: "user_id,category" });
  if (error) throw error;
}

export async function listMyConsentHistory(limit = 50): Promise<ConsentHistoryEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("user_consent_history")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ConsentHistoryEntry[];
}

export const CONSENT_CATEGORIES: { category: ConsentCategory; defaultGranted: boolean; required: boolean }[] = [
  { category: "marketing_emails", defaultGranted: false, required: false },
  { category: "analytics_usage", defaultGranted: false, required: false },
  { category: "third_party_sharing", defaultGranted: false, required: false },
  { category: "profile_personalization", defaultGranted: true, required: false },
  { category: "audit_legal", defaultGranted: true, required: true }, // conservation logs = obligation légale
];
