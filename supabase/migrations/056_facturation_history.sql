-- ============================================================
-- 056 — Facturation : historique des Factur-X générées (12 mois)
-- ============================================================
-- Table factur_x_history : stocke pour chaque utilisateur authentifié
-- les métadonnées des Factur-X générées, pour la recherche/réédition.
-- La rétention est gérée par purge cron quotidienne (> 12 mois).
-- Le XML et le PDF ne sont PAS stockés ici — seulement les métadonnées
-- structurées. Le contenu peut être régénéré depuis ces données.
-- ============================================================

create table if not exists public.factur_x_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Identifiant lisible
  invoice_number text not null,
  invoice_date date not null,
  due_date date,

  -- Acteurs (résumés pour recherche)
  seller_name text not null,
  seller_country text,
  buyer_name text not null,
  buyer_country text,

  -- Totaux (pour filtres / stats)
  currency text not null default 'EUR',
  total_ht numeric(14, 2) not null,
  total_tva numeric(14, 2) not null,
  total_ttc numeric(14, 2) not null,

  -- Template métier utilisé
  template text default 'generic',

  -- Données complètes pour réédition (JSON FacturXInvoice)
  invoice_data jsonb not null,

  -- Métadonnées système
  created_at timestamptz not null default now(),
  -- Date au-delà de laquelle la ligne sera purgée (par défaut +12 mois)
  expires_at timestamptz not null default (now() + interval '12 months')
);

create index if not exists factur_x_history_user_idx on public.factur_x_history(user_id, created_at desc);
create index if not exists factur_x_history_expires_idx on public.factur_x_history(expires_at);

-- RLS : chaque user voit uniquement son propre historique
alter table public.factur_x_history enable row level security;

create policy "own_history_select" on public.factur_x_history
  for select using (auth.uid() = user_id);

create policy "own_history_insert" on public.factur_x_history
  for insert with check (auth.uid() = user_id);

create policy "own_history_update" on public.factur_x_history
  for update using (auth.uid() = user_id);

create policy "own_history_delete" on public.factur_x_history
  for delete using (auth.uid() = user_id);

-- Purge automatique : fonction appelable par cron quotidien
create or replace function public.purge_expired_factur_x_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.factur_x_history where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on table public.factur_x_history is
  'Historique des Factur-X générées par les utilisateurs. Rétention 12 mois (plan Essentiel+/Pro). Purge via purge_expired_factur_x_history().';
