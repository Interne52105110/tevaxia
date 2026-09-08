begin;

create or replace function public.protect_client_entitlements()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated') then
    if TG_TABLE_NAME = 'api_keys' then
      if (TG_OP = 'INSERT' and NEW.tier <> 'free') or
         (TG_OP = 'UPDATE' and NEW.tier is distinct from OLD.tier) then
        raise exception 'API tier is managed by the server';
      end if;
    else
      if (TG_OP = 'INSERT' and (NEW.daily_usage <> 0 or NEW.last_usage_date <> current_date)) or
         (TG_OP = 'UPDATE' and (NEW.daily_usage is distinct from OLD.daily_usage or NEW.last_usage_date is distinct from OLD.last_usage_date)) then
        raise exception 'AI usage is managed by the server';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists protect_api_tier on public.api_keys;
create trigger protect_api_tier before insert or update on public.api_keys
for each row execute function public.protect_client_entitlements();
drop trigger if exists protect_ai_usage on public.user_ai_settings;
create trigger protect_ai_usage before insert or update on public.user_ai_settings
for each row execute function public.protect_client_entitlements();

create or replace function public.reserve_ai_usage(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare used integer;
begin
  insert into public.user_ai_settings(user_id, ai_provider) values(p_user_id, 'gemini') on conflict(user_id) do nothing;
  update public.user_ai_settings
  set daily_usage = case when last_usage_date = current_date then daily_usage + 1 else 1 end,
      last_usage_date = current_date
  where user_id = p_user_id and (last_usage_date <> current_date or daily_usage < 5)
  returning daily_usage into used;
  if used is null then return -1; end if;
  return 5 - used;
end;
$$;
revoke all on function public.reserve_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid) to service_role;
commit;
