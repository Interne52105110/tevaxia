import { supabase, isSupabaseConfigured } from "../supabase";

export type PmsGroupStatus =
  | "prospect" | "tentative" | "confirmed"
  | "partially_booked" | "complete" | "cancelled" | "completed";

export type PmsGroupBillingMode = "master_account" | "individual" | "split";

export interface PmsGroup {
  id: string;
  property_id: string;
  code: string;
  name: string;
  status: PmsGroupStatus;
  organizer_name: string;
  organizer_email: string | null;
  organizer_phone: string | null;
  organizer_company: string | null;
  check_in: string;
  check_out: string;
  nb_nights: number;
  rooms_blocked: number;
  rooms_booked: number;
  negotiated_rate: number | null;
  total_expected_revenue: number | null;
  billing_mode: PmsGroupBillingMode;
  deposit_required: number | null;
  deposit_paid: number;
  deposit_due_date: string | null;
  cutoff_date: string | null;
  cancellation_policy: string | null;
  notes: string | null;
  has_meeting_room: boolean;
  meeting_room_setup: string | null;
  meeting_room_capacity: number | null;
  fb_package: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const GROUP_STATUS_LABELS: Record<PmsGroupStatus, string> = {
  prospect: "Prospect",
  tentative: "Option posée",
  confirmed: "Confirmé",
  partially_booked: "Partiellement réservé",
  complete: "Complet",
  cancelled: "Annulé",
  completed: "Terminé",
};

export const GROUP_STATUS_COLORS: Record<PmsGroupStatus, string> = {
  prospect: "bg-slate-100 text-slate-700",
  tentative: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-900",
  partially_booked: "bg-indigo-100 text-indigo-900",
  complete: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
  completed: "bg-gray-100 text-gray-700",
};

export const BILLING_MODE_LABELS: Record<PmsGroupBillingMode, string> = {
  master_account: "Compte unique (corporate)",
  individual: "Chaque participant paye",
  split: "Split (chambres corporate, F&B indiv.)",
};

export const MEETING_SETUP_LABELS: Record<string, string> = {
  theatre: "Théâtre",
  classroom: "Salle de classe",
  u_shape: "U-shape",
  banquet: "Banquet",
  cocktail: "Cocktail",
  boardroom: "Board room",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listGroups(propertyId: string): Promise<PmsGroup[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("pms_groups")
    .select("*")
    .eq("property_id", propertyId)
    .order("check_in", { ascending: false });
  return (data ?? []) as PmsGroup[];
}

export async function getGroup(id: string): Promise<PmsGroup | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("pms_groups").select("*").eq("id", id).maybeSingle();
  return (data as PmsGroup | null) ?? null;
}

export async function nextGroupCode(propertyId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_next_group_code", { p_property_id: propertyId });
  if (error) throw error;
  return data as string;
}

export async function createGroup(input: Partial<PmsGroup> & {
  property_id: string;
  name: string;
  organizer_name: string;
  check_in: string;
  check_out: string;
  rooms_blocked: number;
}): Promise<PmsGroup> {
  const client = ensureClient();
  const code = input.code ?? await nextGroupCode(input.property_id);
  const { data: { user } } = await client.auth.getUser();

  const totalExpected = input.negotiated_rate
    ? Number(input.negotiated_rate) * input.rooms_blocked *
      Math.max(1, Math.floor((new Date(input.check_out).getTime() - new Date(input.check_in).getTime()) / 86400000))
    : null;

  const { data, error } = await client
    .from("pms_groups")
    .insert({
      ...input,
      code,
      total_expected_revenue: input.total_expected_revenue ?? totalExpected,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsGroup;
}

export async function updateGroup(id: string, patch: Partial<PmsGroup>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_groups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_groups").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Helpers purs
// ============================================================

export function computeGroupRevenue(
  roomsBlocked: number,
  nights: number,
  negotiatedRate: number | null,
): number {
  if (!negotiatedRate || roomsBlocked <= 0 || nights <= 0) return 0;
  return Math.round(roomsBlocked * nights * negotiatedRate * 100) / 100;
}

export function groupFillRate(rooms_booked: number, rooms_blocked: number): number {
  if (rooms_blocked <= 0) return 0;
  return Math.round((rooms_booked / rooms_blocked) * 1000) / 10;
}

export function daysUntilCutoff(cutoff_date: string | null): number | null {
  if (!cutoff_date) return null;
  return Math.floor((new Date(cutoff_date).getTime() - Date.now()) / 86400000);
}

export function cutoffAlert(cutoff_date: string | null, fill_rate: number): {
  severity: "none" | "info" | "warning" | "critical";
  message: string;
} {
  const days = daysUntilCutoff(cutoff_date);
  if (days === null) return { severity: "none", message: "" };
  if (days < 0) return { severity: "critical", message: `Date limite dépassée depuis ${Math.abs(days)}j — chambres à libérer.` };
  if (days <= 3) return { severity: "critical", message: `Date limite dans ${days}j — relance urgente organisateur.` };
  if (days <= 7 && fill_rate < 80) {
    return { severity: "warning", message: `Date limite dans ${days}j et seulement ${fill_rate}% de remplissage.` };
  }
  if (days <= 14) return { severity: "info", message: `Date limite dans ${days}j.` };
  return { severity: "none", message: "" };
}
