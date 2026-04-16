// ============================================================
// COOWNERSHIPS — copropriétés gérées par un syndic
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type UnitType = "apartment" | "commercial" | "office" | "parking" | "cellar" | "other";
export type Occupancy = "owner_occupied" | "rented" | "vacant" | "seasonal";

export interface Coownership {
  id: string;
  org_id: string;
  name: string;
  slug: string | null;
  address: string | null;
  commune: string | null;
  cadastre_ref: string | null;
  total_tantiemes: number;
  nb_lots: number;
  year_built: number | null;
  nb_floors: number | null;
  has_elevator: boolean;
  has_parking: boolean;
  heating_type: string | null;
  date_rc: string | null;
  registre_commerce: string | null;
  last_ag_date: string | null;
  next_ag_date: string | null;
  vertical_config: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoownershipUnit {
  id: string;
  coownership_id: string;
  lot_number: string;
  unit_type: UnitType;
  floor: number | null;
  surface_m2: number | null;
  nb_rooms: number | null;
  tantiemes: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_address: string | null;
  acquisition_date: string | null;
  occupancy: Occupancy;
  tenant_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

// ---------- Coownerships ----------

export async function listCoownerships(orgId: string): Promise<Coownership[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownerships")
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Coownership[];
}

export async function getCoownership(id: string): Promise<Coownership | null> {
  const client = ensureClient();
  const { data, error } = await client.from("coownerships").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Coownership | null) ?? null;
}

export async function createCoownership(input: {
  org_id: string;
  name: string;
  address?: string;
  commune?: string;
  total_tantiemes?: number;
}): Promise<Coownership> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const slug = slugify(input.name) + "-" + Math.random().toString(36).slice(2, 6);

  const { data, error } = await client
    .from("coownerships")
    .insert({
      org_id: input.org_id,
      name: input.name,
      slug,
      address: input.address ?? null,
      commune: input.commune ?? null,
      total_tantiemes: input.total_tantiemes ?? 1000,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Coownership;
}

export async function updateCoownership(id: string, patch: Partial<Coownership>): Promise<Coownership> {
  const client = ensureClient();
  const { data, error } = await client.from("coownerships").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Coownership;
}

export async function deleteCoownership(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("coownerships").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Units ----------

export async function listUnits(coownershipId: string): Promise<CoownershipUnit[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_units")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("lot_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CoownershipUnit[];
}

export async function createUnit(input: Omit<CoownershipUnit, "id" | "created_at" | "updated_at" | "created_by">): Promise<CoownershipUnit> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_units")
    .insert({ ...input, created_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as CoownershipUnit;
}

export async function updateUnit(id: string, patch: Partial<CoownershipUnit>): Promise<CoownershipUnit> {
  const client = ensureClient();
  const { data, error } = await client.from("coownership_units").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as CoownershipUnit;
}

export async function deleteUnit(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("coownership_units").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Helpers ----------

export function sumTantiemes(units: CoownershipUnit[]): number {
  return units.reduce((s, u) => s + (u.tantiemes ?? 0), 0);
}

export function tantiemesValidation(total: number, used: number): {
  valid: boolean;
  diff: number;
  usagePct: number;
} {
  const diff = total - used;
  const usagePct = total > 0 ? (used / total) * 100 : 0;
  return { valid: diff === 0, diff, usagePct };
}
