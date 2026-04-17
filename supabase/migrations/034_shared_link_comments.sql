-- ============================================================
-- SHARED LINK COMMENTS — questions/commentaires visiteurs
-- ============================================================
-- Permet à un visiteur de laisser un commentaire/question sur un
-- lien partagé sans s'inscrire. L'owner voit les commentaires dans
-- /profil/liens-partages.
--
-- RGPD : email et nom sont optionnels, rate-limit côté RPC (1 par
-- minute par token). Les commentaires expirent avec le lien parent
-- (cascade via FK).

create table if not exists shared_link_comments (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references shared_links(id) on delete cascade,
  visitor_name text,
  visitor_email text,
  message text not null check (length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists shared_link_comments_link_idx
  on shared_link_comments(link_id, created_at desc);

alter table shared_link_comments enable row level security;

-- Owner du lien voit les commentaires de ses propres liens
create policy "owner_sees_own_link_comments" on shared_link_comments
  for select using (
    exists (
      select 1 from shared_links sl
      where sl.id = shared_link_comments.link_id
        and sl.owner_user_id = auth.uid()
    )
  );

-- RPC anonyme pour poster un commentaire (valide le token, rate-limit 1/min/token)
create or replace function post_shared_link_comment(
  p_token text,
  p_message text,
  p_visitor_name text default null,
  p_visitor_email text default null
) returns jsonb language plpgsql security definer as $$
declare
  link shared_links%rowtype;
  recent_count int;
begin
  if p_message is null or length(trim(p_message)) = 0 then
    return jsonb_build_object('success', false, 'error', 'empty_message');
  end if;
  if length(p_message) > 4000 then
    return jsonb_build_object('success', false, 'error', 'message_too_long');
  end if;

  select * into link from shared_links where token = p_token;
  if not found then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;
  if link.expires_at < now() then
    return jsonb_build_object('success', false, 'error', 'expired');
  end if;

  -- Rate-limit basique : 1 commentaire par token par minute
  select count(*) into recent_count
    from shared_link_comments
    where link_id = link.id and created_at > now() - interval '1 minute';
  if recent_count >= 1 then
    return jsonb_build_object('success', false, 'error', 'rate_limited');
  end if;

  -- Sanitisation basique (on laisse le texte brut, affiché avec échappement côté client)
  insert into shared_link_comments (link_id, visitor_name, visitor_email, message)
  values (
    link.id,
    nullif(trim(coalesce(p_visitor_name, '')), ''),
    nullif(trim(coalesce(p_visitor_email, '')), ''),
    trim(p_message)
  );

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function post_shared_link_comment(text, text, text, text) to anon, authenticated;

-- RPC pour owner : liste des commentaires d'un lien avec check ownership
create or replace function list_shared_link_comments(p_link_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  link_owner uuid;
  comments jsonb;
begin
  select owner_user_id into link_owner from shared_links where id = p_link_id;
  if link_owner is null or link_owner <> auth.uid() then
    return jsonb_build_object('success', false, 'error', 'unauthorized');
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', id,
    'visitor_name', visitor_name,
    'visitor_email', visitor_email,
    'message', message,
    'created_at', created_at
  ) order by created_at desc) into comments
  from shared_link_comments where link_id = p_link_id;

  return jsonb_build_object('success', true, 'comments', coalesce(comments, '[]'::jsonb));
end;
$$;

grant execute on function list_shared_link_comments(uuid) to authenticated;
