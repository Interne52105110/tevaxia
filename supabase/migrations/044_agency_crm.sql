-- ============================================================
-- CRM AGENCES — Contacts / Interactions / Tâches / Documents
-- ============================================================
-- Extension du pipeline agency_mandates (migration 039) vers un CRM
-- complet. Conserve agency_mandates tel quel (mandats = fiches bien),
-- ajoute 3 concepts orthogonaux :
--   - crm_contacts : personnes/sociétés (prospect, client, partenaire)
--     qu'on peut rattacher à 0-N mandats via crm_mandate_contacts
--   - crm_interactions : log d'activité (appel, email, visite…) lié à
--     un contact et/ou un mandat
--   - crm_tasks : rappels / tâches à faire (relancer, préparer visite)
-- Conforme RGPD : tables sous RLS strict user/org, immutabilité des
-- interactions passées via trigger (pas de réécriture d'historique).

-- ============================================================
-- CONTACTS
-- ============================================================

create type crm_contact_kind as enum (
  'prospect',       -- piste identifiée, pas encore qualifiée
  'lead',           -- piste qualifiée (budget, timing, décideur)
  'acquereur',      -- acheteur engagé (sous compromis / courrier d'intention)
  'vendeur',        -- mandant vendeur
  'bailleur',       -- mandant loueur
  'locataire',      -- locataire actuel ou candidat
  'partenaire',     -- notaire, banque, courtier, artisan
  'autre'
);

create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  kind crm_contact_kind not null default 'prospect',
  -- Identité (personne physique OU morale)
  is_company boolean not null default false,
  first_name text,
  last_name text,
  company_name text,
  -- Contact
  email text,
  phone text,
  -- Coordonnées postales
  address text,
  postal_code text,
  city text,
  country text default 'LU',
  -- Préférences & qualification
  budget_min numeric,
  budget_max numeric,
  target_surface_min numeric,
  target_surface_max numeric,
  target_zones text[],              -- liste de communes/quartiers visés
  tags text[] default array[]::text[],
  notes text,
  -- RGPD
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  -- Attribution
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_company = true and company_name is not null and length(company_name) > 0)
    or (is_company = false and (coalesce(first_name, '') <> '' or coalesce(last_name, '') <> ''))
  )
);

create index if not exists crm_contacts_user_idx on crm_contacts(user_id, updated_at desc);
create index if not exists crm_contacts_org_idx on crm_contacts(org_id) where org_id is not null;
create index if not exists crm_contacts_kind_idx on crm_contacts(kind);
create index if not exists crm_contacts_email_idx on crm_contacts(email) where email is not null;
create index if not exists crm_contacts_assigned_idx on crm_contacts(assigned_to) where assigned_to is not null;

alter table crm_contacts enable row level security;

create policy "crm_contacts_crud_own" on crm_contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "crm_contacts_org_members_rw" on crm_contacts
  for all using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_contacts.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  ) with check (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_contacts.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  );

create or replace function crm_contacts_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists crm_contacts_touch_trg on crm_contacts;
create trigger crm_contacts_touch_trg before update on crm_contacts
  for each row execute function crm_contacts_touch();

-- ============================================================
-- LIAISON MANDATS ↔ CONTACTS (N:N)
-- ============================================================

create type crm_mandate_contact_role as enum (
  'client',          -- client principal du mandat
  'coacheteur',      -- co-acheteur (indivision, couple)
  'conjoint',        -- conjoint non-acheteur qui participe
  'decisionnaire',   -- dirigeant société acheteuse
  'vendeur',         -- vendeur connu si cessation
  'notaire',
  'banque',
  'courtier',
  'autre'
);

create table if not exists crm_mandate_contacts (
  mandate_id uuid not null references agency_mandates(id) on delete cascade,
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  role crm_mandate_contact_role not null default 'client',
  primary_contact boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  primary key (mandate_id, contact_id)
);

create index if not exists crm_mandate_contacts_contact_idx on crm_mandate_contacts(contact_id);

alter table crm_mandate_contacts enable row level security;

create policy "crm_mc_via_mandate" on crm_mandate_contacts
  for all using (
    exists (
      select 1 from agency_mandates m
      where m.id = crm_mandate_contacts.mandate_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from agency_mandates m
      where m.id = crm_mandate_contacts.mandate_id and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- INTERACTIONS (timeline)
-- ============================================================

create type crm_interaction_type as enum (
  'call',          -- appel téléphonique
  'email',         -- email sortant/entrant
  'sms',           -- SMS / WhatsApp
  'meeting',       -- RDV en présentiel / visio
  'visit',         -- visite d'un bien
  'offer',         -- offre / contre-proposition
  'document',      -- envoi/réception document (compromis, pièce KYC)
  'note',          -- note libre
  'task_done',     -- tâche cochée
  'status_change'  -- changement de statut mandat / contact (auto-log)
);

create type crm_interaction_direction as enum ('inbound','outbound','internal');

create table if not exists crm_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  org_id uuid references organizations(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete cascade,
  mandate_id uuid references agency_mandates(id) on delete cascade,
  interaction_type crm_interaction_type not null,
  direction crm_interaction_direction not null default 'outbound',
  occurred_at timestamptz not null default now(),
  subject text,
  body text,
  outcome text,           -- résultat : "a rappelé", "sans réponse", "offre refusée"
  duration_seconds integer,
  metadata jsonb default '{}'::jsonb, -- extensible : numéro appelé, thread email id
  created_at timestamptz not null default now()
);

create index if not exists crm_interactions_contact_idx on crm_interactions(contact_id, occurred_at desc) where contact_id is not null;
create index if not exists crm_interactions_mandate_idx on crm_interactions(mandate_id, occurred_at desc) where mandate_id is not null;
create index if not exists crm_interactions_user_date_idx on crm_interactions(user_id, occurred_at desc);

alter table crm_interactions enable row level security;

create policy "crm_inter_crud_own" on crm_interactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "crm_inter_org_read" on crm_interactions
  for select using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_interactions.org_id and m.user_id = auth.uid()
    )
  );

-- Interactions passées = immuables (pas de réécriture d'historique)
create or replace function crm_interactions_immutable() returns trigger language plpgsql as $$
begin
  if old.occurred_at < now() - interval '24 hours' then
    if new.interaction_type <> old.interaction_type
      or new.occurred_at <> old.occurred_at
      or coalesce(new.body, '') <> coalesce(old.body, '')
      or coalesce(new.subject, '') <> coalesce(old.subject, '') then
      raise exception 'Interaction older than 24h is immutable (audit trail)';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists crm_interactions_immut on crm_interactions;
create trigger crm_interactions_immut before update on crm_interactions
  for each row execute function crm_interactions_immutable();

-- ============================================================
-- TÂCHES / RAPPELS
-- ============================================================

create type crm_task_status as enum (
  'todo',
  'in_progress',
  'done',
  'cancelled'
);

create type crm_task_priority as enum ('low','normal','high','urgent');

create table if not exists crm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete cascade,
  mandate_id uuid references agency_mandates(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null check (length(title) between 1 and 255),
  description text,
  status crm_task_status not null default 'todo',
  priority crm_task_priority not null default 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_tasks_user_due_idx on crm_tasks(user_id, due_at) where status in ('todo','in_progress');
create index if not exists crm_tasks_assigned_idx on crm_tasks(assigned_to, due_at) where status in ('todo','in_progress');
create index if not exists crm_tasks_contact_idx on crm_tasks(contact_id) where contact_id is not null;
create index if not exists crm_tasks_mandate_idx on crm_tasks(mandate_id) where mandate_id is not null;

alter table crm_tasks enable row level security;

create policy "crm_tasks_crud_own" on crm_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "crm_tasks_org_rw" on crm_tasks
  for all using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_tasks.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  ) with check (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_tasks.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  );

create or replace function crm_tasks_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists crm_tasks_touch_trg on crm_tasks;
create trigger crm_tasks_touch_trg before update on crm_tasks
  for each row execute function crm_tasks_touch();

-- ============================================================
-- DOCUMENTS (métadonnées — fichier binaire dans Supabase Storage)
-- ============================================================

create table if not exists crm_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete set null,
  mandate_id uuid references agency_mandates(id) on delete set null,
  title text not null check (length(title) between 1 and 255),
  document_type text,     -- 'compromis', 'mandat_vente', 'piece_identite', 'justif_revenu'…
  storage_path text not null, -- bucket crm-docs chiffré
  file_size bigint,
  mime_type text,
  sha256 text,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists crm_docs_contact_idx on crm_documents(contact_id) where contact_id is not null;
create index if not exists crm_docs_mandate_idx on crm_documents(mandate_id) where mandate_id is not null;

alter table crm_documents enable row level security;

create policy "crm_docs_crud_own" on crm_documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "crm_docs_org_read" on crm_documents
  for select using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = crm_documents.org_id and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC : dashboard Kanban (groupe mandats par statut)
-- ============================================================

create or replace function crm_kanban_mandates()
returns table (
  status mandate_status,
  mandates jsonb
) language plpgsql security definer set search_path = public as $$
begin
  return query
  select m.status, jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'reference', m.reference,
      'property_address', m.property_address,
      'client_name', m.client_name,
      'prix_demande', m.prix_demande,
      'commission_pct', m.commission_pct,
      'end_date', m.end_date,
      'updated_at', m.updated_at
    ) order by m.updated_at desc
  ) as mandates
  from agency_mandates m
  where m.user_id = auth.uid()
     or (m.org_id is not null and exists (
          select 1 from org_members om
          where om.org_id = m.org_id and om.user_id = auth.uid()
        ))
  group by m.status;
end;
$$;

grant execute on function crm_kanban_mandates() to authenticated;
