import { supabase, isSupabaseConfigured } from "../supabase";
import type { CrmInteraction, CrmInteractionDirection, CrmInteractionType } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listInteractions(opts: {
  contactId?: string;
  mandateId?: string;
  limit?: number;
} = {}): Promise<CrmInteraction[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("crm_interactions").select("*");
  if (opts.contactId) q = q.eq("contact_id", opts.contactId);
  if (opts.mandateId) q = q.eq("mandate_id", opts.mandateId);
  const { data, error } = await q.order("occurred_at", { ascending: false }).limit(opts.limit ?? 100);
  if (error) return [];
  return (data ?? []) as CrmInteraction[];
}

export async function logInteraction(input: {
  contactId?: string;
  mandateId?: string;
  type: CrmInteractionType;
  direction?: CrmInteractionDirection;
  subject?: string;
  body?: string;
  outcome?: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): Promise<CrmInteraction> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("crm_interactions")
    .insert({
      user_id: user.id,
      contact_id: input.contactId ?? null,
      mandate_id: input.mandateId ?? null,
      interaction_type: input.type,
      direction: input.direction ?? "outbound",
      subject: input.subject ?? null,
      body: input.body ?? null,
      outcome: input.outcome ?? null,
      duration_seconds: input.durationSeconds ?? null,
      metadata: input.metadata ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmInteraction;
}

export async function deleteInteraction(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_interactions").delete().eq("id", id);
  if (error) throw error;
}
