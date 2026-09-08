begin;
create table if not exists public.banking_connections (
  session_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_ids text[] not null,
  valid_until timestamptz not null
);
create table if not exists public.banking_auth_states (
  state uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table public.banking_connections enable row level security;
alter table public.banking_auth_states enable row level security;
revoke all on public.banking_connections, public.banking_auth_states from public, anon, authenticated;
grant all on public.banking_connections, public.banking_auth_states to service_role;
commit;
