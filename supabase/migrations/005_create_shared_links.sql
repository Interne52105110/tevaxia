-- ============================================================
-- SHARED LINKS — Liens publics no-login pour partager un calcul
-- ============================================================
-- Ex: un promoteur partage son bilan avec un investisseur sans
-- demander création de compte. Le bénéficiaire voit une vue
-- read-only des résultats.

create extension if not exists "pgcrypto";

create table if not exists shared_links (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  owner_user_id uuid references auth.users(id) on delete set null,
  org_id uuid references organizations(id) on delete set null,
  tool_type text not null,
  title text,
  payload jsonb not null,
  view_count int not null default 0,
  max_views int,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create index if not exists shared_links_token_idx on shared_links(token);
create index if not exists shared_links_owner_idx on shared_links(owner_user_id);

alter table shared_links enable row level security;

-- Owner peut lister/gérer les siens
create policy "owner_view_own_shared_links" on shared_links
  for select using (owner_user_id = auth.uid());

create policy "auth_create_shared_links" on shared_links
  for insert with check (auth.uid() is not null and owner_user_id = auth.uid());

create policy "owner_delete_shared_links" on shared_links
  for delete using (owner_user_id = auth.uid());

-- Note: pas de policy SELECT publique. L'accès au lien public passe par
-- le RPC get_shared_link ci-dessous (security definer).

create or replace function get_shared_link(p_token text)
returns jsonb language plpgsql security definer as $$
declare
  link shared_links%rowtype;
begin
  select * into link from shared_links where token = p_token;
  if not found then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;
  if link.expires_at < now() then
    return jsonb_build_object('success', false, 'error', 'expired');
  end if;
  if link.max_views is not null and link.view_count >= link.max_views then
    return jsonb_build_object('success', false, 'error', 'view_limit_reached');
  end if;

  update shared_links set view_count = view_count + 1 where id = link.id;

  return jsonb_build_object(
    'success', true,
    'tool_type', link.tool_type,
    'title', link.title,
    'payload', link.payload,
    'view_count', link.view_count + 1,
    'expires_at', link.expires_at
  );
end;
$$;

grant execute on function get_shared_link(text) to anon, authenticated;
