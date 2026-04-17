import { supabase, isSupabaseConfigured } from "./supabase";

export type ArchiveType =
  | "pv_ag" | "facture" | "contrat" | "devis" | "reglement"
  | "compta_clot" | "audit" | "correspondance" | "autre";

export interface CoownershipArchive {
  id: string;
  coownership_id: string;
  archive_type: ArchiveType;
  title: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  storage_path: string;
  file_size: number | null;
  sha256: string;
  archived_by: string | null;
  archived_at: string;
  retention_until: string;
  metadata: Record<string, unknown>;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await globalThis.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listArchives(coownershipId: string): Promise<CoownershipArchive[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("coownership_archives")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("archived_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as CoownershipArchive[];
}

export async function uploadArchive(input: {
  coownershipId: string;
  archiveType: ArchiveType;
  title: string;
  description?: string;
  periodStart?: string;
  periodEnd?: string;
  file: File;
}): Promise<CoownershipArchive> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const hash = await sha256Hex(input.file);
  const safeName = input.file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `${input.coownershipId}/${Date.now()}_${hash.slice(0, 12)}_${safeName}`;

  const { error: uploadErr } = await client.storage
    .from("coownership-archives")
    .upload(storagePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload Storage : ${uploadErr.message}`);

  const { data, error } = await client
    .from("coownership_archives")
    .insert({
      coownership_id: input.coownershipId,
      archive_type: input.archiveType,
      title: input.title,
      description: input.description ?? null,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      storage_path: storagePath,
      file_size: input.file.size,
      sha256: hash,
      archived_by: user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CoownershipArchive;
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.storage
    .from("coownership-archives")
    .createSignedUrl(storagePath, 60 * 10); // 10 minutes
  if (error) throw error;
  return data.signedUrl;
}
