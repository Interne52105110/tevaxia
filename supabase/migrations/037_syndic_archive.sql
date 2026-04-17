-- ============================================================
-- ARCHIVAGE CONFORME 10 ANS — COPROPRIÉTÉ / SYNDIC
-- ============================================================
-- La loi du 16 mai 1975 modifiée impose au syndic luxembourgeois la
-- conservation des documents copropriété pendant 10 ans (art. 13bis,
-- cf. également règl. gr.-d. 13 juin 1975). Cette migration crée :
--
--   1. `coownership_archives` — entrées horodatées avec checksum SHA-256
--      et URL Supabase Storage (bucket "coownership-archives").
--   2. Trigger d'immutabilité empêchant toute modification / suppression
--      avant l'expiration légale des 10 ans (archived_at + 10y).
--
-- Pattern simple : on stocke les fichiers dans Supabase Storage chiffré
-- au repos (AES-256, par défaut), on tracke les métadonnées et le hash
-- dans cette table. La rétention minimale est verrouillée côté DB.

create type coownership_archive_type as enum (
  'pv_ag',          -- procès-verbal d'assemblée générale
  'facture',        -- factures fournisseurs
  'contrat',        -- contrats (assurance, chauffage, ascenseur)
  'devis',          -- devis travaux
  'reglement',      -- règlement de copropriété, modifications
  'compta_clot',    -- comptes annuels clôturés
  'audit',          -- audit, commissaire aux comptes
  'correspondance', -- courriers formels (mises en demeure, etc.)
  'autre'
);

create table if not exists coownership_archives (
  id uuid primary key default gen_random_uuid(),
  coownership_id uuid not null references coownerships(id) on delete restrict,
  archive_type coownership_archive_type not null,
  title text not null check (length(title) between 1 and 255),
  description text,
  period_start date, -- début exercice / période concernée
  period_end date,
  storage_path text not null, -- chemin bucket Supabase Storage
  file_size bigint,
  sha256 text not null, -- checksum pour intégrité (hex lowercase)
  archived_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '10 years'),
  metadata jsonb default '{}'::jsonb
);

create index if not exists archives_coown_idx
  on coownership_archives(coownership_id, archived_at desc);
create index if not exists archives_type_idx
  on coownership_archives(archive_type);
create index if not exists archives_retention_idx
  on coownership_archives(retention_until);

alter table coownership_archives enable row level security;

-- Les membres de l'org syndic (rôles admin/syndic/conseil_syndical) peuvent LIRE.
create policy "syndic_read_archives" on coownership_archives
  for select using (
    exists (
      select 1 from coownerships c
      join org_members m on m.org_id = c.org_id
      where c.id = coownership_archives.coownership_id
        and m.user_id = auth.uid()
        and m.role in ('admin','syndic','conseil_syndical')
    )
  );

-- Seuls admin / syndic peuvent CRÉER une archive.
create policy "syndic_insert_archive" on coownership_archives
  for insert with check (
    exists (
      select 1 from coownerships c
      join org_members m on m.org_id = c.org_id
      where c.id = coownership_archives.coownership_id
        and m.user_id = auth.uid()
        and m.role in ('admin','syndic')
    )
  );

-- INTERDICTION de modifier : les archives sont immuables pour respecter
-- la piste d'audit (Art. 13bis loi 16.05.1975 + obligations probantes).
create or replace function archive_is_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'Les archives sont immuables (conservation 10 ans loi 16.05.1975)';
  return null;
end;
$$;
drop trigger if exists archive_no_update on coownership_archives;
create trigger archive_no_update before update on coownership_archives
  for each row execute function archive_is_immutable();

-- INTERDICTION de supprimer avant expiration du délai de rétention.
create or replace function archive_retention_check() returns trigger language plpgsql as $$
begin
  if old.retention_until > now() then
    raise exception 'Archive protégée jusqu''au % (10 ans conformément loi 16.05.1975)', old.retention_until;
  end if;
  return old;
end;
$$;
drop trigger if exists archive_retention_trigger on coownership_archives;
create trigger archive_retention_trigger before delete on coownership_archives
  for each row execute function archive_retention_check();

-- Vue d'audit : documents qui expirent prochainement (pour purge RGPD contrôlée)
create or replace view coownership_archives_expiring as
select
  id, coownership_id, archive_type, title,
  archived_at, retention_until,
  (retention_until - now())::interval as time_remaining
from coownership_archives
where retention_until < now() + interval '6 months'
order by retention_until asc;
