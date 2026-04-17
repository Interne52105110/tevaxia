-- ============================================================
-- ORG AGENCY STATS — dashboard admin pour agences
-- ============================================================
-- RPC agrégée utilisée par /profil/organisation (section stats).
-- Retourne comptage membres, clés API actives, appels API 30j,
-- top 5 membres par activité. Accès réservé aux admins de l'org.

create or replace function org_agency_stats(p_org_id uuid, p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_members_count int;
  v_keys_active int;
  v_calls_total bigint;
  v_calls_errors bigint;
  v_top_members jsonb;
  v_daily jsonb;
begin
  -- Vérifier que l'appelant est admin de l'org
  select exists(
    select 1 from org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Access denied: admin role required';
  end if;

  -- Nombre de membres
  select count(*) into v_members_count
  from org_members
  where org_id = p_org_id;

  -- Clés API actives de l'org
  select count(*) into v_keys_active
  from api_keys
  where org_id = p_org_id and active = true;

  -- Total appels + erreurs sur p_days
  select
    coalesce(count(*), 0),
    coalesce(count(*) filter (where status_code >= 400), 0)
  into v_calls_total, v_calls_errors
  from api_calls ac
  join api_keys ak on ak.id = ac.api_key_id
  where ak.org_id = p_org_id
    and ac.created_at >= now() - (p_days || ' days')::interval;

  -- Top 5 membres par activité (via user_id des clés API)
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_top_members
  from (
    select
      ak.user_id,
      count(ac.id) as calls
    from api_keys ak
    left join api_calls ac on ac.api_key_id = ak.id
      and ac.created_at >= now() - (p_days || ' days')::interval
    where ak.org_id = p_org_id
    group by ak.user_id
    order by calls desc
    limit 5
  ) t;

  -- Série journalière
  select coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb) into v_daily
  from (
    select
      date_trunc('day', ac.created_at)::date as day,
      count(*) as total
    from api_calls ac
    join api_keys ak on ak.id = ac.api_key_id
    where ak.org_id = p_org_id
      and ac.created_at >= now() - (p_days || ' days')::interval
    group by 1
    order by 1
  ) d;

  return jsonb_build_object(
    'members_count', v_members_count,
    'keys_active', v_keys_active,
    'calls_total', v_calls_total,
    'calls_errors', v_calls_errors,
    'error_rate', case when v_calls_total > 0 then round((v_calls_errors::numeric / v_calls_total) * 100, 1) else 0 end,
    'top_members', v_top_members,
    'daily', v_daily,
    'period_days', p_days
  );
end;
$$;

grant execute on function org_agency_stats(uuid, int) to authenticated;
