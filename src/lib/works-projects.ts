import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type WorksCategory = "entretien" | "urgent" | "gros_oeuvre" | "toiture" | "facade" | "ascenseur" | "chauffage" | "plomberie" | "electricite" | "espaces_communs" | "autre";
export type WorksStatus = "draft" | "rfq" | "quoted" | "voted" | "in_progress" | "completed" | "cancelled";

export interface WorksProject {
  id: string;
  coownership_id: string;
  title: string;
  description: string | null;
  category: WorksCategory;
  status: WorksStatus;
  budget_estimate: number | null;
  voted_amount: number | null;
  final_amount: number | null;
  majority_type: "simple" | "absolute" | "double" | "unanimity" | null;
  assembly_id: string | null;
  start_date: string | null;
  end_date: string | null;
  warranty_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorksQuote {
  id: string;
  project_id: string;
  supplier_name: string;
  supplier_contact: string | null;
  amount_ht: number;
  amount_tva: number;
  amount_ttc: number;
  delivery_weeks: number | null;
  warranty_years: number;
  notes: string | null;
  is_selected: boolean;
  received_at: string;
  created_at: string;
}

export interface WorksInvoice {
  id: string;
  project_id: string;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string | null;
  amount_ht: number;
  amount_tva: number;
  amount_ttc: number;
  paid_at: string | null;
  payment_ref: string | null;
  iban: string | null;
  is_final: boolean;
  extracted_data: Record<string, unknown> | null;
  created_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase non configuré");
  return supabase;
}

export async function listProjects(coownershipId: string): Promise<WorksProject[]> {
  const client = ensureClient();
  const { data, error } = await client.from("works_projects")
    .select("*").eq("coownership_id", coownershipId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorksProject[];
}

export async function createProject(input: Partial<WorksProject> & { coownership_id: string; title: string }): Promise<WorksProject> {
  const client = ensureClient();
  const { data, error } = await client.from("works_projects").insert(input).select().single();
  if (error) throw error;
  return data as WorksProject;
}

export async function updateProject(id: string, patch: Partial<WorksProject>): Promise<WorksProject> {
  const client = ensureClient();
  const { data, error } = await client.from("works_projects").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as WorksProject;
}

export async function deleteProject(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("works_projects").delete().eq("id", id);
  if (error) throw error;
}

export async function listQuotes(projectId: string): Promise<WorksQuote[]> {
  const client = ensureClient();
  const { data, error } = await client.from("works_quotes")
    .select("*").eq("project_id", projectId).order("received_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorksQuote[];
}

export async function addQuote(input: Omit<WorksQuote, "id" | "created_at">): Promise<WorksQuote> {
  const client = ensureClient();
  const { data, error } = await client.from("works_quotes").insert(input).select().single();
  if (error) throw error;
  return data as WorksQuote;
}

export async function selectQuote(quoteId: string, projectId: string): Promise<void> {
  const client = ensureClient();
  await client.from("works_quotes").update({ is_selected: false }).eq("project_id", projectId);
  const { error } = await client.from("works_quotes").update({ is_selected: true }).eq("id", quoteId);
  if (error) throw error;
}

export async function listInvoices(projectId: string): Promise<WorksInvoice[]> {
  const client = ensureClient();
  const { data, error } = await client.from("works_invoices")
    .select("*").eq("project_id", projectId).order("invoice_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorksInvoice[];
}

export async function addInvoice(input: Omit<WorksInvoice, "id" | "created_at">): Promise<WorksInvoice> {
  const client = ensureClient();
  const { data, error } = await client.from("works_invoices").insert(input).select().single();
  if (error) throw error;
  return data as WorksInvoice;
}

export const CATEGORY_LABELS: Record<WorksCategory, string> = {
  entretien: "Entretien courant",
  urgent: "Intervention urgente",
  gros_oeuvre: "Gros œuvre",
  toiture: "Toiture",
  facade: "Façade / ravalement",
  ascenseur: "Ascenseur",
  chauffage: "Chauffage / chaudière",
  plomberie: "Plomberie",
  electricite: "Électricité",
  espaces_communs: "Espaces communs",
  autre: "Autre",
};

export const STATUS_LABELS: Record<WorksStatus, string> = {
  draft: "Brouillon",
  rfq: "Appel d'offres en cours",
  quoted: "Devis reçus, en attente vote",
  voted: "Voté, pas démarré",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};
