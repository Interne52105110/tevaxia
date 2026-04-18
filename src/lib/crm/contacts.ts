import { supabase, isSupabaseConfigured } from "../supabase";
import type { CrmContact, CrmContactKind } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listContacts(opts: { search?: string; kind?: CrmContactKind } = {}): Promise<CrmContact[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("crm_contacts").select("*");
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.search && opts.search.length > 1) {
    q = q.or(`last_name.ilike.%${opts.search}%,first_name.ilike.%${opts.search}%,company_name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);
  }
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(200);
  if (error) return [];
  return (data ?? []) as CrmContact[];
}

export async function getContact(id: string): Promise<CrmContact | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("crm_contacts").select("*").eq("id", id).single();
  if (error) return null;
  return data as CrmContact;
}

export async function createContact(input: Partial<CrmContact>): Promise<CrmContact> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("crm_contacts")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmContact;
}

export async function updateContact(id: string, patch: Partial<CrmContact>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function linkContactToMandate(args: {
  contactId: string;
  mandateId: string;
  role?: string;
  primary?: boolean;
}): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_mandate_contacts").insert({
    contact_id: args.contactId,
    mandate_id: args.mandateId,
    role: args.role ?? "client",
    primary_contact: args.primary ?? false,
  });
  if (error) throw error;
}

export async function unlinkContactFromMandate(contactId: string, mandateId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("crm_mandate_contacts")
    .delete()
    .eq("contact_id", contactId)
    .eq("mandate_id", mandateId);
  if (error) throw error;
}

export async function listContactsForMandate(mandateId: string): Promise<Array<CrmContact & { role: string; primary_contact: boolean }>> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("crm_mandate_contacts")
    .select("role, primary_contact, contact:crm_contacts(*)")
    .eq("mandate_id", mandateId);
  if (error) return [];
  type Row = { role: string; primary_contact: boolean; contact: CrmContact | null };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.contact)
    .map((r) => ({ ...(r.contact as CrmContact), role: r.role, primary_contact: r.primary_contact }));
}
