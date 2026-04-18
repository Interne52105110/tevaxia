export type CrmContactKind =
  | "prospect" | "lead" | "acquereur" | "vendeur" | "bailleur"
  | "locataire" | "partenaire" | "autre";

export type CrmMandateContactRole =
  | "client" | "coacheteur" | "conjoint" | "decisionnaire"
  | "vendeur" | "notaire" | "banque" | "courtier" | "autre";

export type CrmInteractionType =
  | "call" | "email" | "sms" | "meeting" | "visit"
  | "offer" | "document" | "note" | "task_done" | "status_change";

export type CrmInteractionDirection = "inbound" | "outbound" | "internal";

export type CrmTaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type CrmTaskPriority = "low" | "normal" | "high" | "urgent";

export interface CrmContact {
  id: string;
  user_id: string;
  org_id: string | null;
  kind: CrmContactKind;
  is_company: boolean;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  budget_min: number | null;
  budget_max: number | null;
  target_surface_min: number | null;
  target_surface_max: number | null;
  target_zones: string[] | null;
  tags: string[];
  notes: string | null;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmInteraction {
  id: string;
  user_id: string;
  org_id: string | null;
  contact_id: string | null;
  mandate_id: string | null;
  interaction_type: CrmInteractionType;
  direction: CrmInteractionDirection;
  occurred_at: string;
  subject: string | null;
  body: string | null;
  outcome: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CrmTask {
  id: string;
  user_id: string;
  org_id: string | null;
  contact_id: string | null;
  mandate_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: CrmTaskStatus;
  priority: CrmTaskPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmMandateContact {
  mandate_id: string;
  contact_id: string;
  role: CrmMandateContactRole;
  primary_contact: boolean;
  notes: string | null;
  created_at: string;
}

export interface CrmDocument {
  id: string;
  user_id: string;
  org_id: string | null;
  contact_id: string | null;
  mandate_id: string | null;
  title: string;
  document_type: string | null;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  sha256: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export function contactDisplayName(c: Pick<CrmContact, "is_company" | "company_name" | "first_name" | "last_name">): string {
  if (c.is_company) return c.company_name ?? "—";
  const parts = [c.first_name, c.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}
