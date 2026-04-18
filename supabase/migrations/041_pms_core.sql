-- ============================================================
-- PMS — CORE (propriétés / types chambres / chambres / tarifs / invités)
-- ============================================================
-- Property Management System hôtel/motel/chambres d'hôtes.
-- TVA hébergement LU : 3 % (art. 40 loi TVA 12.02.1979 + annexe B).
-- Taxe séjour : par commune (Luxembourg-Ville 3 €/nuit/adulte en 2026).
-- RGPD : données invités minimisées, suppression programmée 3 ans post-séjour
-- sauf obligation légale (fisc LU : 10 ans art. 16 AO).

create type pms_property_type as enum (
  'hotel',          -- > 10 chambres, service hôtelier complet
  'motel',          -- stationnement direct chambre, service réduit
  'chambres_hotes', -- gîte / B&B, ≤ 5 chambres
  'residence',      -- résidence de tourisme / aparthotel
  'auberge',        -- auberge de jeunesse
  'camping'         -- camping (emplacements + mobil-homes)
);

create type pms_room_status as enum (
  'available',     -- prête, louable
  'occupied',      -- client in-house
  'dirty',         -- check-out effectué, à nettoyer
  'clean',         -- nettoyée, en attente inspection
  'inspected',     -- inspectée, prête
  'out_of_order',  -- HS long (> 24h)
  'maintenance'    -- maintenance courte
);

create table if not exists pms_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  name text not null,
  property_type pms_property_type not null default 'hotel',
  address text,
  commune text,
  postal_code text,
  country text default 'LU',
  phone text,
  email text,
  website text,
  -- Fiscalité et opérations
  tva_rate numeric(4,2) not null default 3.00, -- TVA hébergement LU
  tva_rate_fb numeric(4,2) default 17.00,       -- TVA F&B LU (non-hébergement)
  taxe_sejour_eur numeric(6,2) default 0.00,    -- par nuit par adulte
  taxe_sejour_enfants boolean default false,    -- taxe applicable enfants
  currency text not null default 'EUR',
  check_in_time time not null default '15:00',
  check_out_time time not null default '11:00',
  -- Identification
  registration_number text, -- numéro registre commerce LU (B xxxxxx)
  vat_number text,          -- LU + 8 chiffres
  -- Facturation
  invoice_prefix text default 'FAC-',
  invoice_next_number integer not null default 1,
  legal_footer text, -- mentions légales bas de facture
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pms_properties_user_idx on pms_properties(user_id, created_at desc);
create index if not exists pms_properties_org_idx on pms_properties(org_id);

alter table pms_properties enable row level security;

create policy "pms_props_crud_own" on pms_properties
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "pms_props_org_read" on pms_properties
  for select using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = pms_properties.org_id and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Types de chambres (tarifs base + capacité)
-- ============================================================
create table if not exists pms_room_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  code text not null, -- 'STD', 'DLX', 'STE'
  name text not null,
  description text,
  capacity_adults smallint not null default 2,
  capacity_children smallint not null default 0,
  extra_bed_allowed boolean default false,
  extra_bed_price numeric(8,2),
  base_rate numeric(10,2) not null default 0, -- tarif BAR par défaut
  size_m2 numeric(6,2),
  amenities jsonb default '[]'::jsonb, -- ['wifi','minibar','safe','balcony']
  photos jsonb default '[]'::jsonb,    -- urls
  display_order smallint default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, code)
);

create index if not exists pms_rt_prop_idx on pms_room_types(property_id, display_order);

alter table pms_room_types enable row level security;

create policy "pms_rt_crud_via_prop" on pms_room_types
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_room_types.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_room_types.property_id and p.user_id = auth.uid())
  );

create policy "pms_rt_org_read" on pms_room_types
  for select using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_room_types.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Chambres physiques (numéro, étage, état temps réel)
-- ============================================================
create table if not exists pms_rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  room_type_id uuid not null references pms_room_types(id) on delete restrict,
  number text not null, -- '101', '12A'
  floor smallint,
  status pms_room_status not null default 'available',
  status_note text, -- raison OOO/maintenance
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, number)
);

create index if not exists pms_rooms_prop_idx on pms_rooms(property_id, floor, number);
create index if not exists pms_rooms_status_idx on pms_rooms(property_id, status);
create index if not exists pms_rooms_type_idx on pms_rooms(room_type_id);

alter table pms_rooms enable row level security;

create policy "pms_rooms_crud_via_prop" on pms_rooms
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_rooms.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_rooms.property_id and p.user_id = auth.uid())
  );

create policy "pms_rooms_org_read" on pms_rooms
  for select using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_rooms.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Rate plans (BAR, non-remboursable, packages, corporate)
-- ============================================================
create table if not exists pms_rate_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  code text not null, -- 'BAR', 'NR', 'CORP', 'PKG'
  name text not null,
  description text,
  refundable boolean not null default true,
  breakfast_included boolean not null default false,
  discount_pct numeric(5,2) default 0, -- % par rapport à base_rate
  min_los smallint default 1,
  max_los smallint,
  advance_booking_days smallint, -- réservation min N jours avant
  cancellation_deadline_hours smallint default 24,
  active boolean not null default true,
  display_order smallint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, code)
);

create index if not exists pms_rp_prop_idx on pms_rate_plans(property_id, display_order);

alter table pms_rate_plans enable row level security;

create policy "pms_rp_crud_via_prop" on pms_rate_plans
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_rate_plans.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_rate_plans.property_id and p.user_id = auth.uid())
  );

create policy "pms_rp_org_read" on pms_rate_plans
  for select using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_rate_plans.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Invités (CRM minimal, RGPD)
-- ============================================================
create table if not exists pms_guests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  -- Loi 31 mai 1999 (fiche de police) et règlement 17 juin 2011 Police des étrangers
  document_type text, -- 'passport', 'id_card', 'driving_licence'
  document_number text,
  document_country text, -- ISO2
  nationality text, -- ISO2
  date_of_birth date,
  address text,
  city text,
  postal_code text,
  country text, -- ISO2
  -- Marketing (Art. 6(1)(a) RGPD — consentement explicite requis)
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  language text default 'fr', -- langue pref communication
  preferences jsonb default '{}'::jsonb, -- pref oreiller, étage, etc.
  notes text,
  -- Compteurs
  total_stays smallint not null default 0,
  total_nights smallint not null default 0,
  total_spent numeric(12,2) not null default 0,
  -- Suppression RGPD programmée
  deletion_scheduled_for date, -- +3 ans après dernier séjour
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pms_guests_prop_idx on pms_guests(property_id, last_name, first_name);
create index if not exists pms_guests_email_idx on pms_guests(property_id, email) where email is not null;
create index if not exists pms_guests_deletion_idx on pms_guests(deletion_scheduled_for) where deletion_scheduled_for is not null;

alter table pms_guests enable row level security;

create policy "pms_guests_crud_via_prop" on pms_guests
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_guests.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_guests.property_id and p.user_id = auth.uid())
  );

create policy "pms_guests_org_read" on pms_guests
  for select using (
    exists (
      select 1 from pms_properties p
      join org_members m on m.org_id = p.org_id
      where p.id = pms_guests.property_id
        and p.org_id is not null
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Triggers maj updated_at
-- ============================================================
create or replace function pms_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists pms_properties_touch on pms_properties;
create trigger pms_properties_touch before update on pms_properties
  for each row execute function pms_touch();

drop trigger if exists pms_room_types_touch on pms_room_types;
create trigger pms_room_types_touch before update on pms_room_types
  for each row execute function pms_touch();

drop trigger if exists pms_rooms_touch on pms_rooms;
create trigger pms_rooms_touch before update on pms_rooms
  for each row execute function pms_touch();

drop trigger if exists pms_rate_plans_touch on pms_rate_plans;
create trigger pms_rate_plans_touch before update on pms_rate_plans
  for each row execute function pms_touch();

drop trigger if exists pms_guests_touch on pms_guests;
create trigger pms_guests_touch before update on pms_guests
  for each row execute function pms_touch();
