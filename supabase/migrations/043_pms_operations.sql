-- ============================================================
-- PMS — OPÉRATIONS (factures / housekeeping / night audit)
-- ============================================================
-- Factures conformes loi TVA LU du 12.02.1979 art. 61-63
-- + Règlement grand-ducal 24.03.2023 (facturation électronique).

create type pms_invoice_type as enum (
  'standard',   -- facture séjour client
  'deposit',    -- acompte
  'credit',     -- avoir
  'proforma'    -- devis chiffré, pas de numéro définitif
);

create type pms_housekeeping_status as enum (
  'pending',
  'in_progress',
  'done',
  'inspected',
  'skipped'
);

create type pms_housekeeping_task_type as enum (
  'checkout_clean', -- ménage complet après départ
  'stayover',       -- ménage quotidien client in-house
  'deep_clean',     -- nettoyage en profondeur
  'inspection',     -- contrôle qualité
  'maintenance',    -- intervention technique
  'linen_change'    -- changement linge
);

-- ============================================================
-- Factures
-- ============================================================
create table if not exists pms_invoices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  reservation_id uuid references pms_reservations(id) on delete set null,
  guest_id uuid references pms_guests(id) on delete set null,
  invoice_number text not null, -- FAC-2026-00001
  invoice_type pms_invoice_type not null default 'standard',
  issue_date date not null default current_date,
  due_date date,
  -- Destinataire (copie à l'émission, n'évolue pas si guest modifié)
  customer_name text not null,
  customer_address text,
  customer_vat_number text,
  -- Montants TTC
  hebergement_ht numeric(12,2) not null default 0,
  hebergement_tva_rate numeric(4,2) not null default 3.00,
  hebergement_tva numeric(12,2) not null default 0,
  fb_ht numeric(12,2) not null default 0,
  fb_tva_rate numeric(4,2) not null default 17.00,
  fb_tva numeric(12,2) not null default 0,
  other_ht numeric(12,2) not null default 0,
  other_tva_rate numeric(4,2) not null default 17.00,
  other_tva numeric(12,2) not null default 0,
  -- Taxe séjour (HT, hors TVA par construction)
  taxe_sejour numeric(10,2) not null default 0,
  total_ht numeric(12,2) not null default 0,
  total_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  -- Statut paiement
  paid boolean not null default false,
  paid_at timestamptz,
  -- Notes / conditions
  notes text,
  legal_footer text, -- recopié depuis property.legal_footer à l'émission
  -- Immutabilité : une fois émise, impossible à modifier
  issued boolean not null default false,
  issued_at timestamptz,
  -- PDF
  pdf_storage_path text,
  pdf_hash_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, invoice_number)
);

create index if not exists pms_inv_prop_idx on pms_invoices(property_id, issue_date desc);
create index if not exists pms_inv_res_idx on pms_invoices(reservation_id) where reservation_id is not null;
create index if not exists pms_inv_number_idx on pms_invoices(property_id, invoice_number);

alter table pms_invoices enable row level security;

create policy "pms_inv_crud_via_prop" on pms_invoices
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_invoices.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_invoices.property_id and p.user_id = auth.uid())
  );

-- Trigger : une fois issued = true, blocage des updates sur champs matériels
create or replace function pms_invoice_immutable() returns trigger language plpgsql as $$
begin
  if old.issued = true and (
    new.total_ttc <> old.total_ttc
    or new.total_ht <> old.total_ht
    or new.customer_name <> old.customer_name
    or new.invoice_number <> old.invoice_number
    or new.issue_date <> old.issue_date
  ) then
    raise exception 'invoice % is immutable (issued=true)', old.invoice_number;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pms_inv_immut on pms_invoices;
create trigger pms_inv_immut before update on pms_invoices
  for each row execute function pms_invoice_immutable();

-- RPC : génère prochain numéro facture (séquence par property)
create or replace function pms_next_invoice_number(p_property_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_prefix text;
  v_next int;
  v_year int := extract(year from current_date);
begin
  if not exists (
    select 1 from pms_properties where id = p_property_id and user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  select invoice_prefix, invoice_next_number into v_prefix, v_next
  from pms_properties where id = p_property_id for update;

  update pms_properties set invoice_next_number = v_next + 1 where id = p_property_id;

  return coalesce(v_prefix, 'FAC-') || v_year || '-' || lpad(v_next::text, 5, '0');
end;
$$;

grant execute on function pms_next_invoice_number(uuid) to authenticated;

-- ============================================================
-- Housekeeping
-- ============================================================
create table if not exists pms_housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  room_id uuid not null references pms_rooms(id) on delete cascade,
  reservation_id uuid references pms_reservations(id) on delete set null,
  task_date date not null default current_date,
  task_type pms_housekeeping_task_type not null,
  status pms_housekeeping_status not null default 'pending',
  priority smallint not null default 1, -- 1 low, 2 med, 3 high (VIP, rush)
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_to_label text, -- fallback si staff non-user Supabase (sous-traitant)
  estimated_minutes smallint default 30,
  actual_minutes smallint,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  inspected_at timestamptz,
  inspected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pms_hk_prop_date_idx on pms_housekeeping_tasks(property_id, task_date, status);
create index if not exists pms_hk_room_idx on pms_housekeeping_tasks(room_id, task_date);
create index if not exists pms_hk_assigned_idx on pms_housekeeping_tasks(assigned_to, status) where assigned_to is not null;

alter table pms_housekeeping_tasks enable row level security;

create policy "pms_hk_crud_via_prop" on pms_housekeeping_tasks
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_housekeeping_tasks.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_housekeeping_tasks.property_id and p.user_id = auth.uid())
  );

create policy "pms_hk_org_rw" on pms_housekeeping_tasks
  for all using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_housekeeping_tasks.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_housekeeping_tasks.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

drop trigger if exists pms_hk_touch on pms_housekeeping_tasks;
create trigger pms_hk_touch before update on pms_housekeeping_tasks
  for each row execute function pms_touch();

-- ============================================================
-- Night audit (snapshot journalier pour analytics)
-- ============================================================
create table if not exists pms_night_audits (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  audit_date date not null,
  -- Inventaire (snapshot minuit)
  total_rooms int not null,
  occupied_rooms int not null default 0,
  arrivals_count int not null default 0,
  departures_count int not null default 0,
  stayovers_count int not null default 0,
  no_shows_count int not null default 0,
  -- Revenus hébergement
  room_revenue numeric(12,2) not null default 0,
  fb_revenue numeric(12,2) not null default 0,
  other_revenue numeric(12,2) not null default 0,
  total_revenue numeric(12,2) not null default 0,
  taxe_sejour_collected numeric(10,2) not null default 0,
  -- KPI dérivés (calculables mais stockés pour rapidité)
  occupancy_pct numeric(5,2) generated always as (
    case when total_rooms > 0 then (occupied_rooms::numeric / total_rooms * 100) else 0 end
  ) stored,
  adr numeric(10,2) generated always as (
    case when occupied_rooms > 0 then (room_revenue / occupied_rooms) else 0 end
  ) stored,
  revpar numeric(10,2) generated always as (
    case when total_rooms > 0 then (room_revenue / total_rooms) else 0 end
  ) stored,
  notes text,
  closed boolean not null default false, -- audit verrouillé
  closed_at timestamptz,
  closed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, audit_date)
);

create index if not exists pms_na_prop_date_idx on pms_night_audits(property_id, audit_date desc);

alter table pms_night_audits enable row level security;

create policy "pms_na_crud_via_prop" on pms_night_audits
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_night_audits.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_night_audits.property_id and p.user_id = auth.uid())
  );

drop trigger if exists pms_na_touch on pms_night_audits;
create trigger pms_na_touch before update on pms_night_audits
  for each row execute function pms_touch();

-- RPC : génère un night audit pour une date donnée (idempotent — upsert)
create or replace function pms_run_night_audit(p_property_id uuid, p_date date)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_total_rooms int;
  v_occupied int;
  v_arrivals int;
  v_departures int;
  v_stayovers int;
  v_room_rev numeric;
  v_taxe_sej numeric;
  v_prop_tx numeric;
  v_id uuid;
begin
  if not exists (
    select 1 from pms_properties where id = p_property_id and user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  select count(*) into v_total_rooms
  from pms_rooms where property_id = p_property_id and active = true;

  select count(*) into v_occupied
  from pms_reservations res
  join pms_reservation_rooms rr on rr.reservation_id = res.id
  where res.property_id = p_property_id
    and res.status in ('confirmed','checked_in')
    and p_date >= res.check_in and p_date < res.check_out;

  select count(*) into v_arrivals
  from pms_reservations res
  where res.property_id = p_property_id
    and res.status in ('confirmed','checked_in')
    and res.check_in = p_date;

  select count(*) into v_departures
  from pms_reservations res
  where res.property_id = p_property_id
    and res.status in ('checked_out','checked_in')
    and res.check_out = p_date;

  v_stayovers := greatest(0, v_occupied - v_arrivals);

  -- Revenu hébergement estimé : somme des nightly_rate des lignes actives ce jour
  select coalesce(sum(rr.nightly_rate), 0) into v_room_rev
  from pms_reservations res
  join pms_reservation_rooms rr on rr.reservation_id = res.id
  where res.property_id = p_property_id
    and res.status in ('confirmed','checked_in','checked_out')
    and p_date >= res.check_in and p_date < res.check_out;

  -- Taxe séjour : property.taxe_sejour_eur × nb adultes occupants actifs ce jour
  select taxe_sejour_eur into v_prop_tx from pms_properties where id = p_property_id;
  select coalesce(sum(res.nb_adults), 0) * coalesce(v_prop_tx, 0) into v_taxe_sej
  from pms_reservations res
  where res.property_id = p_property_id
    and res.status in ('confirmed','checked_in','checked_out')
    and p_date >= res.check_in and p_date < res.check_out;

  insert into pms_night_audits as na (
    property_id, audit_date, total_rooms, occupied_rooms,
    arrivals_count, departures_count, stayovers_count,
    room_revenue, taxe_sejour_collected, total_revenue
  ) values (
    p_property_id, p_date, v_total_rooms, v_occupied,
    v_arrivals, v_departures, v_stayovers,
    v_room_rev, v_taxe_sej, v_room_rev
  )
  on conflict (property_id, audit_date) do update set
    total_rooms = excluded.total_rooms,
    occupied_rooms = excluded.occupied_rooms,
    arrivals_count = excluded.arrivals_count,
    departures_count = excluded.departures_count,
    stayovers_count = excluded.stayovers_count,
    room_revenue = excluded.room_revenue,
    taxe_sejour_collected = excluded.taxe_sejour_collected,
    total_revenue = excluded.total_revenue,
    updated_at = now()
  where na.closed = false
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function pms_run_night_audit(uuid, date) to authenticated;
