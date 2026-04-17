-- ============================================================
-- JOURNAL D'ACTIVITÉ + CONSENTEMENTS RGPD GRANULAIRES
-- ============================================================
-- Traçabilité des actions user (login, exports, CRUD sensibles) avec
-- rétention 1 an côté app. Consentements RGPD Art. 7 stockés par
-- catégorie (marketing, analytics, tiers) pour pouvoir être révoqués
-- individuellement.

-- ----------- Journal d'activité -----------
create table if not exists user_activity_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (length(action) between 1 and 100),
  entity_type text, -- 'lot', 'evaluation', 'shared_link', 'webhook', ...
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  ip_family text, -- /24 pour v4, /48 pour v6 (min pour RGPD)
  user_agent_family text, -- 'chrome', 'safari', 'firefox', 'edge', 'other'
  created_at timestamptz not null default now()
);

create index if not exists user_activity_log_user_idx
  on user_activity_log(user_id, created_at desc);
create index if not exists user_activity_log_action_idx
  on user_activity_log(action, created_at desc);

alter table user_activity_log enable row level security;

create policy "users_view_own_activity" on user_activity_log
  for select using (user_id = auth.uid());

create policy "users_create_own_activity" on user_activity_log
  for insert with check (user_id = auth.uid());

-- Auto-purge : entries > 1 an supprimées à chaque nouvelle insertion.
-- Pour des volumes importants, remplacer par un cron Supabase.
create or replace function purge_old_activity() returns trigger language plpgsql as $$
begin
  delete from user_activity_log
    where user_id = new.user_id
      and created_at < now() - interval '1 year';
  return new;
end;
$$;
drop trigger if exists activity_log_purge_trigger on user_activity_log;
create trigger activity_log_purge_trigger after insert on user_activity_log
  for each row execute function purge_old_activity();

-- ----------- Consentements RGPD granulaires -----------
create type consent_category as enum (
  'marketing_emails',     -- newsletters, promos
  'analytics_usage',      -- PostHog, telemetry produit
  'third_party_sharing',  -- partage data avec partenaires (ex. IA externe)
  'profile_personalization', -- tracking pour perso UI
  'audit_legal'           -- conservation logs pour opposabilité (toujours on)
);

create table if not exists user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category consent_category not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  policy_version text not null default '1.0', -- version CGU/politique au moment du consentement
  source text default 'settings', -- 'signup' | 'settings' | 'banner'
  notes text,
  unique (user_id, category)
);

create index if not exists user_consents_user_idx on user_consents(user_id);

alter table user_consents enable row level security;

create policy "users_view_own_consents" on user_consents
  for select using (user_id = auth.uid());

create policy "users_upsert_own_consents" on user_consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Historique des modifications de consentement (piste d'audit RGPD Art. 7.1)
create table if not exists user_consent_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category consent_category not null,
  previous_granted boolean,
  new_granted boolean not null,
  changed_at timestamptz not null default now(),
  policy_version text not null default '1.0',
  source text default 'settings'
);

create index if not exists user_consent_history_user_idx
  on user_consent_history(user_id, changed_at desc);

alter table user_consent_history enable row level security;

create policy "users_view_own_consent_history" on user_consent_history
  for select using (user_id = auth.uid());

-- Trigger : à chaque INSERT/UPDATE de user_consents, on log le changement
create or replace function log_consent_change() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into user_consent_history (user_id, category, previous_granted, new_granted, policy_version, source)
      values (new.user_id, new.category, null, new.granted, new.policy_version, coalesce(new.source, 'settings'));
  elsif tg_op = 'UPDATE' and old.granted is distinct from new.granted then
    insert into user_consent_history (user_id, category, previous_granted, new_granted, policy_version, source)
      values (new.user_id, new.category, old.granted, new.granted, new.policy_version, coalesce(new.source, 'settings'));
  end if;
  return new;
end;
$$;
drop trigger if exists consent_history_trigger on user_consents;
create trigger consent_history_trigger after insert or update on user_consents
  for each row execute function log_consent_change();
