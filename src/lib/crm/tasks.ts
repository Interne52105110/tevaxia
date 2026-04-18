import { supabase, isSupabaseConfigured } from "../supabase";
import type { CrmTask, CrmTaskPriority, CrmTaskStatus } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listTasks(opts: {
  status?: CrmTaskStatus[];
  contactId?: string;
  mandateId?: string;
  overdueOnly?: boolean;
  dueWithinDays?: number;
} = {}): Promise<CrmTask[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("crm_tasks").select("*");
  if (opts.status?.length) q = q.in("status", opts.status);
  if (opts.contactId) q = q.eq("contact_id", opts.contactId);
  if (opts.mandateId) q = q.eq("mandate_id", opts.mandateId);
  if (opts.overdueOnly) q = q.lt("due_at", new Date().toISOString()).in("status", ["todo", "in_progress"]);
  if (opts.dueWithinDays != null) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + opts.dueWithinDays);
    q = q.lte("due_at", cutoff.toISOString()).in("status", ["todo", "in_progress"]);
  }
  const { data, error } = await q.order("due_at", { ascending: true, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as CrmTask[];
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: CrmTaskPriority;
  dueAt?: string;
  contactId?: string;
  mandateId?: string;
  assignedTo?: string;
}): Promise<CrmTask> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("crm_tasks")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "normal",
      due_at: input.dueAt ?? null,
      contact_id: input.contactId ?? null,
      mandate_id: input.mandateId ?? null,
      assigned_to: input.assignedTo ?? user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmTask;
}

export async function updateTask(id: string, patch: Partial<CrmTask>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function completeTask(id: string): Promise<void> {
  await updateTask(id, { status: "done" });
}

export async function deleteTask(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("crm_tasks").delete().eq("id", id);
  if (error) throw error;
}

export function isOverdue(task: Pick<CrmTask, "due_at" | "status">): boolean {
  if (!task.due_at) return false;
  if (task.status === "done" || task.status === "cancelled") return false;
  return new Date(task.due_at).getTime() < Date.now();
}
