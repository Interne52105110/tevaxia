-- ============================================================
-- PMS — GROUPS / ALLOTEMENTS (mariages, séminaires, conférences)
-- ============================================================
-- Réservation en bloc de N chambres pour un événement unique :
--   - groupe (master) avec un contact principal (organisateur)
--   - liste de réservations individuelles liées au groupe via group_id
--   - rooming list (répartition nominative) gérée en interne
--   - facturation globale au groupe (corporate) ou individuelle
--
-- Usages :
--   - Mariage : 10 chambres réservées 2 nuits, payé par un seul payeur
--   - Congrès : 50 chambres corporate
--   - Séminaire entreprise : 30 chambres + salle MICE

create type pms_group_status as enum (
  'prospect',        -- en discussion
  'tentative',       -- option posée mais pas confirmée
  'confirmed',       -- confirmé, chambres bloquées
  'partially_booked',-- au moins 1 résa nominative créée
  'complete',        -- toutes les résas nominatives créées
  'cancelled',       -- annulé
  'completed'        -- événement passé, groupe archivé
);

create type pms_group_billing_mode as enum (
  'master_account',  -- tout sur un compte unique (corporate)
  'individual',      -- chaque participant paye sa chambre
  'split'            -- corporate prend chambres, participants F&B
);

create table if not exists pms_groups (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  -- Identification
  code text not null, -- auto "GRP-2026-001"
  name text not null, -- "Mariage Dupont-Schmit"
  status pms_group_status not null default 'prospect',
  -- Contact organisateur
  organizer_name text not null,
  organizer_email text,
  organizer_phone text,
  organizer_company text,
  -- Dates + capacité
  check_in date not null,
  check_out date not null,
  nb_nights smallint generated always as (greatest(1, (check_out - check_in))) stored,
  rooms_blocked smallint not null check (rooms_blocked > 0),
  rooms_booked smallint not null default 0, -- nb de réservations nominatives créées
  -- Tarification
  negotiated_rate numeric(10,2), -- tarif négocié par nuit par chambre
  total_expected_revenue numeric(12,2), -- rooms_blocked × nights × rate
  billing_mode pms_group_billing_mode not null default 'individual',
  deposit_required numeric(12,2),
  deposit_paid numeric(12,2) not null default 0,
  deposit_due_date date,
  -- Conditions
  cutoff_date date, -- date limite pour convertir les chambres bloquées en résas nominatives
  cancellation_policy text,
  notes text,
  -- MICE (si applicable)
  has_meeting_room boolean not null default false,
  meeting_room_setup text, -- 'theatre', 'classroom', 'u_shape', 'banquet'
  meeting_room_capacity smallint,
  fb_package text, -- ex "Forfait déjeuner 45€/pax", "Cocktail dinatoire"
  -- Meta
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  unique (property_id, code)
);

create index if not exists pms_groups_prop_idx on pms_groups(property_id, status);
create index if not exists pms_groups_dates_idx on pms_groups(property_id, check_in, check_out);

alter table pms_groups enable row level security;

create policy "pms_groups_crud_via_prop" on pms_groups
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_groups.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_groups.property_id and p.user_id = auth.uid())
  );

create policy "pms_groups_org_rw" on pms_groups
  for all using (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_groups.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  ) with check (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_groups.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  );

drop trigger if exists pms_groups_touch on pms_groups;
create trigger pms_groups_touch before update on pms_groups
  for each row execute function pms_touch();

-- ============================================================
-- Lien réservation → groupe
-- ============================================================

alter table pms_reservations
  add column if not exists group_id uuid references pms_groups(id) on delete set null;

create index if not exists pms_res_group_idx on pms_reservations(group_id) where group_id is not null;

-- Trigger : maintient rooms_booked sur le groupe
create or replace function pms_group_sync_rooms_booked() returns trigger language plpgsql as $$
declare v_gid uuid;
begin
  v_gid := coalesce(new.group_id, old.group_id);
  if v_gid is null then return coalesce(new, old); end if;
  update pms_groups
    set rooms_booked = (
      select count(*) from pms_reservations
      where group_id = v_gid and status in ('confirmed','checked_in','checked_out')
    ),
    updated_at = now()
  where id = v_gid;

  -- Auto-transition status
  update pms_groups
    set status = case
      when rooms_booked = 0 and status = 'confirmed' then 'confirmed'
      when rooms_booked > 0 and rooms_booked < rooms_blocked and status in ('confirmed','partially_booked') then 'partially_booked'
      when rooms_booked >= rooms_blocked and status in ('confirmed','partially_booked') then 'complete'
      else status
    end
  where id = v_gid;

  return coalesce(new, old);
end;
$$;
drop trigger if exists pms_res_group_sync on pms_reservations;
create trigger pms_res_group_sync after insert or update or delete on pms_reservations
  for each row execute function pms_group_sync_rooms_booked();

-- ============================================================
-- RPC : numéro de groupe auto-incrémenté
-- ============================================================

create or replace function pms_next_group_code(p_property_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from current_date);
  v_count int;
begin
  if not exists (
    select 1 from pms_properties where id = p_property_id and user_id = auth.uid()
  ) and not exists (
    select 1 from pms_properties p
    join org_members m on m.org_id = p.org_id
    where p.id = p_property_id and m.user_id = auth.uid() and m.role in ('admin','member')
  ) then
    raise exception 'unauthorized';
  end if;

  select count(*) + 1 into v_count
  from pms_groups
  where property_id = p_property_id
    and extract(year from created_at) = v_year;

  return 'GRP-' || v_year || '-' || lpad(v_count::text, 3, '0');
end;
$$;

grant execute on function pms_next_group_code(uuid) to authenticated;

-- ============================================================
-- Vue : résumé groupes actifs avec alerte cutoff
-- ============================================================

create or replace view pms_groups_active as
select
  g.*,
  (g.cutoff_date is not null and g.cutoff_date < current_date) as cutoff_passed,
  (g.rooms_blocked - g.rooms_booked) as rooms_remaining,
  case
    when g.status in ('cancelled','completed') then null
    when g.cutoff_date is null then null
    else g.cutoff_date - current_date
  end as days_until_cutoff,
  case
    when g.check_in <= current_date and g.check_out >= current_date then 'in_progress'
    when g.check_in > current_date then 'upcoming'
    else 'past'
  end as period_state
from pms_groups g;
