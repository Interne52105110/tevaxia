import {resolveRentalCloudId,requireRentalOwner} from "./rental-cloud-identity";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface TenantPortalToken {
  id: string;
  lot_id: string;
  owner_id: string;
  tenant_name: string | null;
  tenant_email: string | null;
  token: string;
  expires_at: string;
  view_count: number;
  last_viewed_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface TenantPortalData {
  lot: {
    name: string;
    address: string | null;
    commune: string | null;
    surface: number;
    nb_chambres: number | null;
    classe_energie: string;
    est_meuble: boolean;
  } | null;
  tenant_name: string | null;
  payments: Array<{
    id: string;
    period: string;
    amount_rent: number;
    amount_charges: number;
    amount_total: number;
    status: "due" | "partial" | "paid" | "late" | "cancelled";
    paid_at: string | null;
    receipt_issued_at: string | null;
  }>;
  error?: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase non configuré");
  return supabase;
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listTenantTokens(lotId: string): Promise<TenantPortalToken[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("tenant_portal_tokens")
    .select("*")
    .eq("lot_id", lotId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TenantPortalToken[];
}

export async function createTenantToken(input: {
  lot_id: string;
  tenant_name?: string | null;
  tenant_email?: string | null;
  expires_in_days?: number;
}, owner:string): Promise<TenantPortalToken> {
  const cloudId=await resolveRentalCloudId(input.lot_id,owner),client=await requireRentalOwner(owner);
  const days=input.expires_in_days??365;
  if(!Number.isInteger(days)||days<1||days>3650)throw new Error("Invalid portal expiry");
  for(const value of [input.tenant_name,input.tenant_email])if(value!==null&&value!==undefined&&typeof value!=="string")throw new Error("Invalid tenant label");
  const token = `tnt_${generateToken()}`;
  const expiresAt = new Date(Date.now() + days * 86400_000);
  const { data, error } = await client
    .from("tenant_portal_tokens")
    .insert({
      lot_id: cloudId,
      owner_id: owner,
      tenant_name: input.tenant_name ?? null,
      tenant_email: input.tenant_email ?? null,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if(error||!data||data.owner_id!==owner||data.lot_id!==cloudId||data.token!==token||data.expires_at!==expiresAt.toISOString()&&Date.parse(data.expires_at)!==expiresAt.getTime())throw new Error("Tenant portal creation not confirmed");
  await requireRentalOwner(owner);
  return {...data,lot_id:input.lot_id} as TenantPortalToken;
}

export async function revokeTenantToken(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("tenant_portal_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getTenantPortalData(token: string): Promise<TenantPortalData> {
  const client = ensureClient();
  const { data, error } = await client.rpc("get_tenant_portal_data", { p_token: token });
  if (error) throw error;
  return data as TenantPortalData;
}

export function buildTenantPortalUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/locataire/${token}`;
}
