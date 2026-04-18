-- ============================================================
-- SYNDIC — Vote en ligne via portail copropriétaire
-- ============================================================
-- RPC pour permettre à un copropriétaire de voter sur les résolutions
-- d'une AG via son token portail, sans compte Supabase.
--
-- Sécurité :
--   - Le token portail doit être valide (non révoqué, non expiré)
--   - Le vote est lié à son unit_id (si token = lot spécifique)
--   - Un vote ne peut pas être modifié après que l'AG soit clôturée
--   - Log automatique dans audit trail de la modification

-- Fonction : liste des résolutions d'une AG avec statut vote du copropriétaire
create or replace function portal_list_assembly_resolutions(
  p_token text, p_assembly_id uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token coownership_portal_tokens;
  v_assembly coownership_assemblies;
  v_resolutions jsonb;
begin
  -- Auth par token
  select * into v_token from coownership_portal_tokens
  where token = p_token and revoked_at is null and expires_at > now();
  if not found then return jsonb_build_object('error', 'invalid_token'); end if;

  -- Vérif AG appartient à cette copropriété
  select * into v_assembly from coownership_assemblies
  where id = p_assembly_id and coownership_id = v_token.coownership_id;
  if not found then return jsonb_build_object('error', 'assembly_not_found'); end if;

  -- Incrémente view_count (audit)
  update coownership_portal_tokens
    set view_count = view_count + 1, last_viewed_at = now()
  where id = v_token.id;

  -- Résolutions + vote actuel du lot (si applicable)
  select jsonb_agg(jsonb_build_object(
    'id', r.id,
    'number', r.number,
    'title', r.title,
    'description', r.description,
    'majority_type', r.majority_type,
    'result', r.result,
    'votes_yes_tantiemes', r.votes_yes_tantiemes,
    'votes_no_tantiemes', r.votes_no_tantiemes,
    'votes_abstain_tantiemes', r.votes_abstain_tantiemes,
    'votes_absent_tantiemes', r.votes_absent_tantiemes,
    'my_vote', (
      select v.vote from assembly_votes v
      where v.resolution_id = r.id and v.unit_id = v_token.unit_id
      limit 1
    ),
    'my_voted_at', (
      select v.voted_at from assembly_votes v
      where v.resolution_id = r.id and v.unit_id = v_token.unit_id
      limit 1
    )
  ) order by r.number) into v_resolutions
  from assembly_resolutions r
  where r.assembly_id = p_assembly_id;

  return jsonb_build_object(
    'assembly', jsonb_build_object(
      'id', v_assembly.id,
      'title', v_assembly.title,
      'assembly_type', v_assembly.assembly_type,
      'scheduled_at', v_assembly.scheduled_at,
      'location', v_assembly.location,
      'virtual_url', v_assembly.virtual_url,
      'status', v_assembly.status,
      'quorum_pct', v_assembly.quorum_pct
    ),
    'resolutions', coalesce(v_resolutions, '[]'::jsonb),
    'unit_id', v_token.unit_id
  );
end;
$$;

grant execute on function portal_list_assembly_resolutions(text, uuid) to anon, authenticated;

-- Fonction : enregistre un vote individuel via token portail
create or replace function portal_cast_vote(
  p_token text, p_resolution_id uuid, p_vote text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token coownership_portal_tokens;
  v_assembly coownership_assemblies;
  v_vote_id uuid;
begin
  if p_vote not in ('yes', 'no', 'abstain', 'absent') then
    return jsonb_build_object('error', 'invalid_vote_value');
  end if;

  -- Auth token
  select * into v_token from coownership_portal_tokens
  where token = p_token and revoked_at is null and expires_at > now();
  if not found then return jsonb_build_object('error', 'invalid_token'); end if;

  if v_token.unit_id is null then
    return jsonb_build_object('error', 'token_not_unit_specific');
  end if;

  -- Vérifie que la résolution appartient à une AG active de cette copropriété
  select a.* into v_assembly
  from assembly_resolutions r
  join coownership_assemblies a on a.id = r.assembly_id
  where r.id = p_resolution_id and a.coownership_id = v_token.coownership_id;
  if not found then return jsonb_build_object('error', 'resolution_not_found'); end if;

  if v_assembly.status = 'closed' or v_assembly.status = 'cancelled' then
    return jsonb_build_object('error', 'assembly_not_votable', 'status', v_assembly.status);
  end if;

  -- Update le vote existant (seed_votes a créé une ligne 'absent' à la création de la résolution)
  update assembly_votes
    set vote = p_vote,
        voted_at = case when p_vote = 'absent' then null else now() end,
        updated_at = now()
  where resolution_id = p_resolution_id and unit_id = v_token.unit_id
  returning id into v_vote_id;

  if v_vote_id is null then
    -- Cas rare : pas de vote seedé → on en crée un
    insert into assembly_votes (resolution_id, unit_id, vote, tantiemes_at_vote, voter_name, voted_at)
    select p_resolution_id, v_token.unit_id, p_vote, u.tantiemes, u.owner_name,
           case when p_vote = 'absent' then null else now() end
    from coownership_units u where u.id = v_token.unit_id
    returning id into v_vote_id;
  end if;

  return jsonb_build_object(
    'ok', true, 'vote_id', v_vote_id, 'vote', p_vote
  );
end;
$$;

grant execute on function portal_cast_vote(text, uuid, text) to anon, authenticated;

-- ============================================================
-- Vue : AG actives visibles côté portail
-- ============================================================

create or replace view portal_visible_assemblies as
select
  a.id, a.coownership_id, a.title, a.assembly_type,
  a.scheduled_at, a.location, a.virtual_url, a.status,
  a.quorum_pct,
  (select count(*) from assembly_resolutions r where r.assembly_id = a.id) as nb_resolutions
from coownership_assemblies a
where a.status in ('convened', 'in_progress', 'closed');
