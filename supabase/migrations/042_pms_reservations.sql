-- ============================================================
-- PMS — RÉSERVATIONS (dispo tarifaire / réservations / paiements)
-- ============================================================
-- Cycle réservation : confirmed → checked_in → checked_out
-- Alt : cancelled, no_show
-- Sources : HOTREC (2024) PMS best practices, OTA Connect standards.

create type pms_reservation_status as enum (
  'quote',           -- devis en cours, pas encore confirmée
  'confirmed',       -- réservation confirmée, future
  'checked_in',      -- client in-house
  'checked_out',     -- client parti, facturation close
  'cancelled',       -- annulée (par client ou hôtel)
  'no_show'          -- client ne s'est pas présenté
);

create type pms_reservation_source as enum (
  'direct',          -- réservation directe (téléphone, email, walk-in)
  'website',         -- site web hôtel
  'booking',         -- Booking.com
  'expedia',         -- Expedia/Hotels.com
  'airbnb',          -- Airbnb
  'gha',             -- Google Hotel Ads
  'corporate',       -- compte corporate / RFP
  'tour_operator',   -- TO / agence voyage
  'other'
);

create type pms_payment_method as enum (
  'cash',
  'card',
  'bank_transfer',
  'ota_virtual',     -- carte virtuelle OTA (Booking Virtual CC)
  'voucher',
  'invoice'          -- à facturer (corporate, TO)
);

-- ============================================================
-- Tarifs saisonniers (par rate_plan × room_type × période)
-- ============================================================
create table if not exists pms_seasonal_rates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  rate_plan_id uuid not null references pms_rate_plans(id) on delete cascade,
  room_type_id uuid not null references pms_room_types(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  price numeric(10,2) not null,
  min_los smallint default 1,
  max_los smallint,
  closed_to_arrival boolean not null default false, -- CTA : pas d'arrivée ce jour
  closed_to_departure boolean not null default false, -- CTD
  stop_sell boolean not null default false, -- fermé à la vente
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists pms_sr_lookup_idx on pms_seasonal_rates(property_id, rate_plan_id, room_type_id, start_date, end_date);
create index if not exists pms_sr_dates_idx on pms_seasonal_rates(property_id, start_date, end_date);

alter table pms_seasonal_rates enable row level security;

create policy "pms_sr_crud_via_prop" on pms_seasonal_rates
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_seasonal_rates.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_seasonal_rates.property_id and p.user_id = auth.uid())
  );

create policy "pms_sr_org_read" on pms_seasonal_rates
  for select using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_seasonal_rates.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Réservations (header)
-- ============================================================
create table if not exists pms_reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  reservation_number text not null, -- auto-généré 'R-2026-00001'
  status pms_reservation_status not null default 'confirmed',
  source pms_reservation_source not null default 'direct',
  external_ref text, -- id Booking/Expedia
  -- Client principal
  guest_id uuid references pms_guests(id) on delete set null,
  booker_name text, -- si différent du guest
  booker_email text,
  booker_phone text,
  -- Dates
  check_in date not null,
  check_out date not null,
  nb_adults smallint not null default 1,
  nb_children smallint not null default 0,
  nb_nights smallint generated always as (greatest(1, (check_out - check_in))) stored,
  -- Finances
  total_amount numeric(12,2) not null default 0, -- TTC net
  amount_paid numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) default 0,
  deposit_paid boolean default false,
  currency text not null default 'EUR',
  -- Conditions
  cancellation_policy text,
  notes text,
  special_requests text,
  internal_notes text, -- visibles staff uniquement
  -- Meta
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  unique (property_id, reservation_number)
);

create index if not exists pms_res_prop_idx on pms_reservations(property_id, check_in desc);
create index if not exists pms_res_dates_idx on pms_reservations(property_id, check_in, check_out);
create index if not exists pms_res_status_idx on pms_reservations(property_id, status, check_in);
create index if not exists pms_res_guest_idx on pms_reservations(guest_id) where guest_id is not null;
create index if not exists pms_res_external_idx on pms_reservations(source, external_ref) where external_ref is not null;

alter table pms_reservations enable row level security;

create policy "pms_res_crud_via_prop" on pms_reservations
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_reservations.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_reservations.property_id and p.user_id = auth.uid())
  );

create policy "pms_res_org_rw" on pms_reservations
  for all using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_reservations.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  ) with check (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_reservations.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  );

-- ============================================================
-- Lignes de réservation (1 chambre × N nuits par ligne)
-- ============================================================
create table if not exists pms_reservation_rooms (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references pms_reservations(id) on delete cascade,
  room_id uuid references pms_rooms(id) on delete set null, -- null jusqu'au room assignment
  room_type_id uuid not null references pms_room_types(id) on delete restrict,
  rate_plan_id uuid not null references pms_rate_plans(id) on delete restrict,
  nightly_rate numeric(10,2) not null, -- tarif nuit retenu
  nb_nights smallint not null,
  nb_adults smallint not null default 1,
  nb_children smallint not null default 0,
  line_total numeric(12,2) not null, -- nightly_rate × nb_nights + suppléments
  extra_bed_count smallint default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists pms_resroom_res_idx on pms_reservation_rooms(reservation_id);
create index if not exists pms_resroom_room_idx on pms_reservation_rooms(room_id) where room_id is not null;

alter table pms_reservation_rooms enable row level security;

create policy "pms_resroom_via_res" on pms_reservation_rooms
  for all using (
    exists (
      select 1 from pms_reservations r
      join pms_properties p on p.id = r.property_id
      where r.id = pms_reservation_rooms.reservation_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from pms_reservations r
      join pms_properties p on p.id = r.property_id
      where r.id = pms_reservation_rooms.reservation_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Paiements
-- ============================================================
create table if not exists pms_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references pms_reservations(id) on delete cascade,
  amount numeric(12,2) not null,
  method pms_payment_method not null,
  paid_at timestamptz not null default now(),
  reference text, -- numéro transaction, dernier chiffres CB
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists pms_pay_res_idx on pms_payments(reservation_id, paid_at desc);

alter table pms_payments enable row level security;

create policy "pms_pay_via_res" on pms_payments
  for all using (
    exists (
      select 1 from pms_reservations r
      join pms_properties p on p.id = r.property_id
      where r.id = pms_payments.reservation_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from pms_reservations r
      join pms_properties p on p.id = r.property_id
      where r.id = pms_payments.reservation_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger : maj amount_paid sur reservation à l'insert/delete d'un payment
-- ============================================================
create or replace function pms_sync_amount_paid() returns trigger language plpgsql as $$
declare
  rid uuid;
begin
  rid := coalesce(new.reservation_id, old.reservation_id);
  update pms_reservations
    set amount_paid = coalesce((
      select sum(amount) from pms_payments where reservation_id = rid
    ), 0),
    updated_at = now()
  where id = rid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists pms_pay_sync on pms_payments;
create trigger pms_pay_sync
  after insert or update or delete on pms_payments
  for each row execute function pms_sync_amount_paid();

-- ============================================================
-- Trigger : maj updated_at réservations
-- ============================================================
drop trigger if exists pms_res_touch on pms_reservations;
create trigger pms_res_touch before update on pms_reservations
  for each row execute function pms_touch();

-- ============================================================
-- RPC : générer numéro réservation (séquence par property × année)
-- ============================================================
create or replace function pms_next_reservation_number(p_property_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from current_date);
  v_count int;
begin
  -- Vérifie que l'utilisateur possède la propriété
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
  from pms_reservations
  where property_id = p_property_id
    and extract(year from created_at) = v_year;

  return 'R-' || v_year || '-' || lpad(v_count::text, 5, '0');
end;
$$;

grant execute on function pms_next_reservation_number(uuid) to authenticated;

-- ============================================================
-- RPC : disponibilité chambre(s) sur une période
-- Retourne par room_type : total chambres vs chambres occupées par jour
-- ============================================================
create or replace function pms_availability(
  p_property_id uuid,
  p_from date,
  p_to date
) returns table (
  day date,
  room_type_id uuid,
  room_type_code text,
  total_rooms int,
  occupied_rooms int,
  available_rooms int
) language plpgsql security definer set search_path = public as $$
begin
  -- Auth check
  if not exists (
    select 1 from pms_properties where id = p_property_id and user_id = auth.uid()
  ) and not exists (
    select 1 from pms_properties p
    join org_members m on m.org_id = p.org_id
    where p.id = p_property_id and m.user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  ),
  types as (
    select rt.id, rt.code, count(r.id)::int as total
    from pms_room_types rt
    left join pms_rooms r on r.room_type_id = rt.id and r.active = true
    where rt.property_id = p_property_id and rt.active = true
    group by rt.id, rt.code
  ),
  occupancy as (
    select d.d as day, rr.room_type_id, count(*)::int as occupied
    from days d
    join pms_reservations res on res.property_id = p_property_id
      and res.status in ('confirmed','checked_in')
      and d.d >= res.check_in and d.d < res.check_out
    join pms_reservation_rooms rr on rr.reservation_id = res.id
    group by d.d, rr.room_type_id
  )
  select
    d.d,
    t.id,
    t.code,
    t.total,
    coalesce(o.occupied, 0),
    greatest(0, t.total - coalesce(o.occupied, 0))
  from days d
  cross join types t
  left join occupancy o on o.day = d.d and o.room_type_id = t.id
  order by d.d, t.code;
end;
$$;

grant execute on function pms_availability(uuid, date, date) to authenticated;
