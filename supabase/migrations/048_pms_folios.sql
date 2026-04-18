-- ============================================================
-- PMS — FOLIOS (running tab client in-house)
-- ============================================================
-- Le folio est l'ardoise ouverte d'un client pendant son séjour :
-- nuits d'hôtel + petit-déj + bar + parking + minibar + ... tout ce
-- qui sera facturé au check-out. Au check-out, la folio se convertit
-- en facture définitive.
--
-- TVA LU par catégorie :
--   - hébergement (room) : 3 %
--   - F&B (restaurant, bar) : 17 %
--   - autres services : 17 %
--   - taxe de séjour : 0 % (hors TVA)
--
-- Référence HOTREC PMS standards + USALI v11.

create type pms_folio_status as enum (
  'open',                -- folio ouvert, charges en cours
  'pending_settlement',  -- check-out effectué, règlement attendu
  'settled',             -- facturé et encaissé
  'cancelled'            -- folio annulé
);

create type pms_charge_category as enum (
  'room',              -- nuit d'hébergement (auto-postée)
  'taxe_sejour',       -- taxe de séjour (auto-postée)
  'extra_bed',         -- lit supplémentaire
  'breakfast',         -- petit-déjeuner
  'lunch',             -- déjeuner restaurant
  'dinner',            -- dîner restaurant
  'bar',               -- consommations bar
  'minibar',           -- minibar
  'room_service',      -- room service
  'meeting_room',      -- salle de réunion / événement
  'parking',           -- parking
  'laundry',           -- blanchisserie
  'spa',               -- spa / wellness
  'phone',             -- téléphone / appels
  'internet',          -- wifi premium / business
  'transport',         -- navette / taxi
  'cancellation_fee',  -- frais annulation
  'damage',            -- dommages / caution retenue
  'other'              -- divers
);

-- ============================================================
-- FOLIOS (1 par réservation)
-- ============================================================

create table if not exists pms_folios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  reservation_id uuid not null references pms_reservations(id) on delete cascade,
  status pms_folio_status not null default 'open',
  currency text not null default 'EUR',
  -- Agrégats (maintenus par trigger)
  subtotal_ht numeric(12,2) not null default 0,
  total_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0, -- total_ttc - payments
  -- Cycle
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  settled_at timestamptz,
  invoice_id uuid references pms_invoices(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id)
);

create index if not exists pms_folios_prop_idx on pms_folios(property_id, status);
create index if not exists pms_folios_reservation_idx on pms_folios(reservation_id);

alter table pms_folios enable row level security;

create policy "pms_folios_crud_via_prop" on pms_folios
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_folios.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_folios.property_id and p.user_id = auth.uid())
  );

create policy "pms_folios_org_rw" on pms_folios
  for all using (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_folios.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  ) with check (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_folios.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  );

-- ============================================================
-- FOLIO CHARGES (lignes postées pendant le séjour)
-- ============================================================

create table if not exists pms_folio_charges (
  id uuid primary key default gen_random_uuid(),
  folio_id uuid not null references pms_folios(id) on delete cascade,
  category pms_charge_category not null,
  description text not null,
  quantity numeric(8,2) not null default 1 check (quantity > 0),
  unit_price_ht numeric(10,2) not null check (unit_price_ht >= 0),
  tva_rate numeric(4,2) not null default 17.00,
  -- Montants calculés (maintenus par trigger)
  line_ht numeric(12,2) not null default 0,
  line_tva numeric(12,2) not null default 0,
  line_ttc numeric(12,2) not null default 0,
  -- Métadonnées
  posted_at timestamptz not null default now(),
  posted_by uuid references auth.users(id) on delete set null,
  voided boolean not null default false,  -- annulation soft (VOID)
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  void_reason text,
  -- Traçabilité
  source text, -- 'manual', 'auto_room', 'auto_taxe', 'pos_restaurant', 'pos_bar'
  external_ref text, -- ticket POS
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists pms_fc_folio_idx on pms_folio_charges(folio_id, posted_at);
create index if not exists pms_fc_category_idx on pms_folio_charges(folio_id, category) where voided = false;

alter table pms_folio_charges enable row level security;

create policy "pms_fc_crud_via_folio" on pms_folio_charges
  for all using (
    exists (select 1 from pms_folios f
            join pms_properties p on p.id = f.property_id
            where f.id = pms_folio_charges.folio_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_folios f
            join pms_properties p on p.id = f.property_id
            where f.id = pms_folio_charges.folio_id and p.user_id = auth.uid())
  );

-- ============================================================
-- TRIGGERS : calculs ligne + agrégats folio
-- ============================================================

-- Calcule line_ht, line_tva, line_ttc avant insert/update
create or replace function pms_folio_charge_compute() returns trigger language plpgsql as $$
begin
  new.line_ht := round((new.quantity * new.unit_price_ht)::numeric, 2);
  new.line_tva := round((new.line_ht * new.tva_rate / 100)::numeric, 2);
  new.line_ttc := new.line_ht + new.line_tva;
  return new;
end;
$$;
drop trigger if exists pms_fc_compute on pms_folio_charges;
create trigger pms_fc_compute before insert or update on pms_folio_charges
  for each row execute function pms_folio_charge_compute();

-- Recalcule agrégats folio après modification d'une ligne
create or replace function pms_folio_refresh_totals() returns trigger language plpgsql as $$
declare
  v_folio_id uuid;
  v_sub_ht numeric;
  v_tva numeric;
  v_ttc numeric;
  v_paid numeric;
begin
  v_folio_id := coalesce(new.folio_id, old.folio_id);
  select
    coalesce(sum(line_ht), 0),
    coalesce(sum(line_tva), 0),
    coalesce(sum(line_ttc), 0)
  into v_sub_ht, v_tva, v_ttc
  from pms_folio_charges
  where folio_id = v_folio_id and voided = false;

  -- Paiements liés à la réservation (via pms_payments existant)
  select coalesce(sum(pay.amount), 0) into v_paid
  from pms_folios f
  join pms_payments pay on pay.reservation_id = f.reservation_id
  where f.id = v_folio_id;

  update pms_folios
     set subtotal_ht = v_sub_ht,
         total_tva = v_tva,
         total_ttc = v_ttc,
         balance_due = greatest(0, v_ttc - v_paid),
         updated_at = now()
   where id = v_folio_id;

  return coalesce(new, old);
end;
$$;
drop trigger if exists pms_fc_refresh on pms_folio_charges;
create trigger pms_fc_refresh after insert or update or delete on pms_folio_charges
  for each row execute function pms_folio_refresh_totals();

-- Propagation des paiements (payment change → balance_due folio)
create or replace function pms_folio_refresh_on_payment() returns trigger language plpgsql as $$
declare
  v_res uuid;
  v_paid numeric;
begin
  v_res := coalesce(new.reservation_id, old.reservation_id);
  select coalesce(sum(amount), 0) into v_paid
  from pms_payments where reservation_id = v_res;
  update pms_folios
     set balance_due = greatest(0, total_ttc - v_paid), updated_at = now()
   where reservation_id = v_res;
  return coalesce(new, old);
end;
$$;
drop trigger if exists pms_folio_pay_refresh on pms_payments;
create trigger pms_folio_pay_refresh after insert or update or delete on pms_payments
  for each row execute function pms_folio_refresh_on_payment();

-- ============================================================
-- AUTO-POSTING : nuits + taxe séjour à l'ouverture d'un folio
-- ============================================================

create or replace function pms_folio_auto_post_room_charges(p_folio_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_folio pms_folios;
  v_res pms_reservations;
  v_prop pms_properties;
  v_n int := 0;
begin
  select * into v_folio from pms_folios where id = p_folio_id;
  if not found then raise exception 'folio not found'; end if;
  select * into v_res from pms_reservations where id = v_folio.reservation_id;
  if not found then raise exception 'reservation not found'; end if;
  select * into v_prop from pms_properties where id = v_folio.property_id;

  -- Si on a déjà posté les nuits, on ne repasse pas
  if exists (select 1 from pms_folio_charges
             where folio_id = p_folio_id and category = 'room' and source = 'auto_room') then
    return 0;
  end if;

  -- Insert 1 ligne par ligne de réservation (chaque room_type × nb_nights)
  insert into pms_folio_charges
    (folio_id, category, description, quantity, unit_price_ht, tva_rate, source)
  select
    p_folio_id,
    'room'::pms_charge_category,
    'Hébergement ' || rr.nb_nights || ' nuit(s) — ' || rt.name,
    rr.nb_nights,
    round((rr.nightly_rate / (1 + v_prop.tva_rate / 100))::numeric, 2),
    v_prop.tva_rate,
    'auto_room'
  from pms_reservation_rooms rr
  join pms_room_types rt on rt.id = rr.room_type_id
  where rr.reservation_id = v_res.id;

  get diagnostics v_n = row_count;

  -- Taxe séjour (0 % TVA) : nb_adultes × nb_nights × taxe_par_nuit
  if v_prop.taxe_sejour_eur > 0 then
    insert into pms_folio_charges
      (folio_id, category, description, quantity, unit_price_ht, tva_rate, source)
    values (
      p_folio_id,
      'taxe_sejour',
      'Taxe de séjour (' || v_res.nb_adults || ' adulte(s) × ' ||
        (v_res.check_out - v_res.check_in) || ' nuit(s))',
      v_res.nb_adults * (v_res.check_out - v_res.check_in),
      v_prop.taxe_sejour_eur,
      0.00,
      'auto_taxe'
    );
    v_n := v_n + 1;
  end if;

  return v_n;
end;
$$;

grant execute on function pms_folio_auto_post_room_charges(uuid) to authenticated;

-- Auto-crée le folio au check-in et post les charges
create or replace function pms_open_folio_on_checkin() returns trigger language plpgsql as $$
declare v_folio_id uuid;
begin
  if new.status = 'checked_in' and coalesce(old.status, '') <> 'checked_in' then
    -- Upsert folio
    insert into pms_folios (property_id, reservation_id, status)
    values (new.property_id, new.id, 'open')
    on conflict (reservation_id) do nothing;
    select id into v_folio_id from pms_folios where reservation_id = new.id;
    if v_folio_id is not null then
      perform pms_folio_auto_post_room_charges(v_folio_id);
    end if;
  elsif new.status = 'checked_out' and coalesce(old.status, '') <> 'checked_out' then
    update pms_folios
       set status = 'pending_settlement', closed_at = now(), updated_at = now()
     where reservation_id = new.id and status = 'open';
  elsif new.status = 'cancelled' and coalesce(old.status, '') <> 'cancelled' then
    update pms_folios
       set status = 'cancelled', closed_at = now(), updated_at = now()
     where reservation_id = new.id and status in ('open','pending_settlement');
  end if;
  return new;
end;
$$;
drop trigger if exists pms_open_folio_trg on pms_reservations;
create trigger pms_open_folio_trg after update on pms_reservations
  for each row execute function pms_open_folio_on_checkin();

-- ============================================================
-- RPC : FOLIO → INVOICE (settlement)
-- ============================================================

create or replace function pms_settle_folio(p_folio_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_folio pms_folios;
  v_prop pms_properties;
  v_res pms_reservations;
  v_guest pms_guests;
  v_invoice_id uuid;
  v_inv_number text;
  v_hh_ht numeric := 0; v_hh_tva numeric := 0;
  v_fb_ht numeric := 0; v_fb_tva numeric := 0;
  v_oth_ht numeric := 0; v_oth_tva numeric := 0;
  v_ts numeric := 0;
  v_customer_name text;
begin
  select * into v_folio from pms_folios where id = p_folio_id;
  if not found then raise exception 'folio not found'; end if;
  if v_folio.status = 'settled' then raise exception 'folio already settled'; end if;

  select * into v_prop from pms_properties where id = v_folio.property_id;
  select * into v_res from pms_reservations where id = v_folio.reservation_id;

  if v_res.guest_id is not null then
    select * into v_guest from pms_guests where id = v_res.guest_id;
  end if;

  -- Ventilation TVA par catégorie USALI
  select
    coalesce(sum(line_ht) filter (where category = 'room'), 0),
    coalesce(sum(line_tva) filter (where category = 'room'), 0),
    coalesce(sum(line_ht) filter (where category in ('breakfast','lunch','dinner','bar','minibar','room_service','meeting_room')), 0),
    coalesce(sum(line_tva) filter (where category in ('breakfast','lunch','dinner','bar','minibar','room_service','meeting_room')), 0),
    coalesce(sum(line_ht) filter (where category in ('parking','laundry','spa','phone','internet','transport','extra_bed','cancellation_fee','damage','other')), 0),
    coalesce(sum(line_tva) filter (where category in ('parking','laundry','spa','phone','internet','transport','extra_bed','cancellation_fee','damage','other')), 0),
    coalesce(sum(line_ht) filter (where category = 'taxe_sejour'), 0)
  into v_hh_ht, v_hh_tva, v_fb_ht, v_fb_tva, v_oth_ht, v_oth_tva, v_ts
  from pms_folio_charges
  where folio_id = p_folio_id and voided = false;

  v_customer_name := coalesce(
    nullif(trim(concat_ws(' ', v_guest.first_name, v_guest.last_name)), ''),
    v_res.booker_name,
    'Client'
  );

  v_inv_number := pms_next_invoice_number(v_folio.property_id);

  insert into pms_invoices (
    property_id, reservation_id, guest_id, invoice_number, invoice_type,
    customer_name, customer_address, customer_vat_number,
    hebergement_ht, hebergement_tva_rate, hebergement_tva,
    fb_ht, fb_tva_rate, fb_tva,
    other_ht, other_tva_rate, other_tva,
    taxe_sejour,
    total_ht, total_tva, total_ttc,
    legal_footer,
    issued, issued_at
  ) values (
    v_folio.property_id, v_folio.reservation_id, v_res.guest_id, v_inv_number, 'standard',
    v_customer_name,
    coalesce(v_guest.address, v_res.booker_name),
    null,
    v_hh_ht, v_prop.tva_rate, v_hh_tva,
    v_fb_ht, coalesce(v_prop.tva_rate_fb, 17), v_fb_tva,
    v_oth_ht, coalesce(v_prop.tva_rate_fb, 17), v_oth_tva,
    v_ts,
    v_hh_ht + v_fb_ht + v_oth_ht + v_ts,
    v_hh_tva + v_fb_tva + v_oth_tva,
    v_hh_ht + v_hh_tva + v_fb_ht + v_fb_tva + v_oth_ht + v_oth_tva + v_ts,
    v_prop.legal_footer,
    true, now()
  ) returning id into v_invoice_id;

  update pms_folios
     set status = 'settled', settled_at = now(), invoice_id = v_invoice_id, updated_at = now()
   where id = p_folio_id;

  return v_invoice_id;
end;
$$;

grant execute on function pms_settle_folio(uuid) to authenticated;

-- ============================================================
-- Touch trigger folio
-- ============================================================
drop trigger if exists pms_folios_touch on pms_folios;
create trigger pms_folios_touch before update on pms_folios
  for each row execute function pms_touch();

-- ============================================================
-- VUE : ventilation catégories pour rapport manager flash
-- ============================================================
create or replace view pms_folio_breakdown as
select
  f.id as folio_id,
  f.property_id,
  f.reservation_id,
  f.status,
  fc.category,
  count(*) filter (where fc.voided = false) as nb_lines,
  coalesce(sum(fc.line_ht) filter (where fc.voided = false), 0) as ht,
  coalesce(sum(fc.line_tva) filter (where fc.voided = false), 0) as tva,
  coalesce(sum(fc.line_ttc) filter (where fc.voided = false), 0) as ttc
from pms_folios f
left join pms_folio_charges fc on fc.folio_id = f.id
group by f.id, f.property_id, f.reservation_id, f.status, fc.category;
