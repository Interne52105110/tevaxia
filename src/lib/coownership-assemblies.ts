// ============================================================
// COOWNERSHIP ASSEMBLIES — AG virtuelle copropriété (lib CRUD)
// ============================================================
// Gestion des assemblées générales : convocation, résolutions,
// vote électronique pondéré par tantièmes, procès-verbal.

import { supabase, isSupabaseConfigured } from "./supabase";

export type AssemblyType = "ordinary" | "extraordinary";
export type AssemblyStatus = "draft" | "convened" | "in_progress" | "closed" | "cancelled";
export type MajorityType = "simple" | "absolute" | "double" | "unanimity";
export type VoteValue = "yes" | "no" | "abstain" | "absent";
export type ResolutionResult = "pending" | "approved" | "rejected";

export interface Assembly {
  id: string;
  coownership_id: string;
  title: string;
  assembly_type: AssemblyType;
  scheduled_at: string;
  location: string | null;
  virtual_url: string | null;
  status: AssemblyStatus;
  convocation_sent_at: string | null;
  closed_at: string | null;
  quorum_pct: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resolution {
  id: string;
  assembly_id: string;
  number: number;
  title: string;
  description: string | null;
  majority_type: MajorityType;
  result: ResolutionResult;
  votes_yes_tantiemes: number;
  votes_no_tantiemes: number;
  votes_abstain_tantiemes: number;
  votes_absent_tantiemes: number;
  created_at: string;
  updated_at: string;
}

export interface AssemblyVote {
  id: string;
  resolution_id: string;
  unit_id: string;
  vote: VoteValue;
  tantiemes_at_vote: number;
  voter_name: string | null;
  proxy_from_unit_id: string | null;
  voted_at: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

// ---------- Assemblies ----------

export async function listAssemblies(coownershipId: string): Promise<Assembly[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_assemblies")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Assembly[];
}

export async function getAssembly(id: string): Promise<Assembly | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_assemblies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Assembly | null) ?? null;
}

export async function createAssembly(input: {
  coownership_id: string;
  title: string;
  assembly_type?: AssemblyType;
  scheduled_at: string;
  location?: string;
  virtual_url?: string;
  quorum_pct?: number;
  notes?: string;
}): Promise<Assembly> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_assemblies")
    .insert({
      coownership_id: input.coownership_id,
      title: input.title,
      assembly_type: input.assembly_type ?? "ordinary",
      scheduled_at: input.scheduled_at,
      location: input.location ?? null,
      virtual_url: input.virtual_url ?? null,
      quorum_pct: input.quorum_pct ?? 50,
      notes: input.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Assembly;
}

export async function updateAssembly(id: string, patch: Partial<Assembly>): Promise<Assembly> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_assemblies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Assembly;
}

export async function deleteAssembly(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("coownership_assemblies").delete().eq("id", id);
  if (error) throw error;
}

export async function sendConvocation(id: string): Promise<Assembly> {
  return updateAssembly(id, { status: "convened", convocation_sent_at: new Date().toISOString() });
}

export async function openAssembly(id: string): Promise<Assembly> {
  return updateAssembly(id, { status: "in_progress" });
}

export async function closeAssembly(id: string): Promise<Assembly> {
  return updateAssembly(id, { status: "closed", closed_at: new Date().toISOString() });
}

// ---------- Resolutions ----------

export async function listResolutions(assemblyId: string): Promise<Resolution[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("assembly_resolutions")
    .select("*")
    .eq("assembly_id", assemblyId)
    .order("number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Resolution[];
}

export async function createResolution(input: {
  assembly_id: string;
  title: string;
  description?: string;
  majority_type?: MajorityType;
}): Promise<Resolution> {
  const client = ensureClient();
  // Auto-increment number
  const existing = await listResolutions(input.assembly_id);
  const nextNumber = existing.length > 0 ? Math.max(...existing.map((r) => r.number)) + 1 : 1;

  const { data, error } = await client
    .from("assembly_resolutions")
    .insert({
      assembly_id: input.assembly_id,
      number: nextNumber,
      title: input.title,
      description: input.description ?? null,
      majority_type: input.majority_type ?? "simple",
    })
    .select("*")
    .single();
  if (error) throw error;

  // Seed absent votes for all units
  await client.rpc("assembly_seed_votes", { p_resolution_id: (data as Resolution).id });

  return data as Resolution;
}

export async function updateResolution(id: string, patch: Partial<Resolution>): Promise<Resolution> {
  const client = ensureClient();
  const { data, error } = await client
    .from("assembly_resolutions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Resolution;
}

export async function deleteResolution(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("assembly_resolutions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Votes ----------

export async function listVotes(resolutionId: string): Promise<AssemblyVote[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("assembly_votes")
    .select("*")
    .eq("resolution_id", resolutionId)
    .order("voter_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AssemblyVote[];
}

export async function setVote(voteId: string, vote: VoteValue): Promise<AssemblyVote> {
  const client = ensureClient();
  const { data, error } = await client
    .from("assembly_votes")
    .update({
      vote,
      voted_at: vote === "absent" ? null : new Date().toISOString(),
    })
    .eq("id", voteId)
    .select("*")
    .single();
  if (error) throw error;
  return data as AssemblyVote;
}

// ---------- Helpers ----------

export const MAJORITY_LABEL: Record<MajorityType, string> = {
  simple: "Majorité simple (+ de votes favorables que défavorables)",
  absolute: "Majorité absolue (> 50 % du total des tantièmes)",
  double: "Double majorité (> 2/3 des tantièmes exprimés)",
  unanimity: "Unanimité",
};

export const VOTE_LABEL: Record<VoteValue, string> = {
  yes: "Pour",
  no: "Contre",
  abstain: "Abstention",
  absent: "Absent",
};

export const STATUS_LABEL: Record<AssemblyStatus, string> = {
  draft: "Brouillon",
  convened: "Convoquée",
  in_progress: "En cours",
  closed: "Clôturée",
  cancelled: "Annulée",
};

export function quorumReached(resolutions: Resolution[], totalTantiemes: number, quorumPct: number): boolean {
  if (resolutions.length === 0) return false;
  const r = resolutions[0];
  const expressed = r.votes_yes_tantiemes + r.votes_no_tantiemes + r.votes_abstain_tantiemes;
  return totalTantiemes > 0 && (expressed / totalTantiemes) * 100 >= quorumPct;
}
