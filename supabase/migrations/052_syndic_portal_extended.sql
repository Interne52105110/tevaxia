-- ============================================================
-- SYNDIC — Portail copropriétaire étendu (compte + relances)
-- ============================================================
-- Complète l'API existante get_portal_data avec :
--   - Solde copropriétaire (vue owner_balance)
--   - Détail impayés par appel avec jours de retard
--   - Historique relances reçues par le lot (preuve eIDAS)
--   - Liste des exercices comptables disponibles (annexes AG)
--
-- Accès : uniquement via token portail (coownership_portal_tokens)
-- donc pas d'exposition de données sensibles à un tiers non autorisé.

create or replace function get_portal_account(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token coownership_portal_tokens;
  v_coown coownerships;
  v_unit coownership_units;
  v_balance record;
  v_unpaid jsonb;
  v_reminders jsonb;
  v_years jsonb;
begin
  -- Charge token et vérifie validité
  select * into v_token from coownership_portal_tokens
  where token = p_token and revoked_at is null and expires_at > now();
  if not found then
    return jsonb_build_object('error', 'invalid_or_expired_token');
  end if;

  -- Incrémente compteur vues (non bloquant)
  update coownership_portal_tokens
    set view_count = view_count + 1, last_viewed_at = now()
  where id = v_token.id;

  select * into v_coown from coownerships where id = v_token.coownership_id;
  if v_token.unit_id is not null then
    select * into v_unit from coownership_units where id = v_token.unit_id;
  end if;

  -- Solde (si lot spécifique) ou global (si accès copropriété entière)
  if v_unit.id is not null then
    select
      coalesce(sum(ch.amount_due), 0) as total_due,
      coalesce(sum(ch.amount_paid), 0) as total_paid,
      coalesce(sum(ch.amount_due - ch.amount_paid), 0) as outstanding,
      count(*) filter (where ch.amount_paid < ch.amount_due) as nb_unpaid
    into v_balance
    from coownership_unit_charges ch
    join coownership_calls c on c.id = ch.call_id
    where ch.unit_id = v_unit.id and c.status in ('issued','partially_paid','paid','overdue');

    -- Détail impayés
    select jsonb_agg(jsonb_build_object(
      'charge_id', ch.id,
      'call_label', c.label,
      'due_date', c.due_date,
      'amount_due', ch.amount_due,
      'amount_paid', ch.amount_paid,
      'outstanding', (ch.amount_due - ch.amount_paid),
      'days_late', greatest(0, (current_date - c.due_date)::int),
      'payment_reference', ch.payment_reference
    ) order by c.due_date desc) into v_unpaid
    from coownership_unit_charges ch
    join coownership_calls c on c.id = ch.call_id
    where ch.unit_id = v_unit.id
      and (ch.amount_due - ch.amount_paid) > 0
      and c.status in ('issued','partially_paid','overdue');

    -- Relances reçues (pour transparence)
    select jsonb_agg(jsonb_build_object(
      'palier', r.palier,
      'sent_at', r.sent_at,
      'channel', r.channel,
      'amount_outstanding', r.amount_outstanding,
      'late_interest', r.late_interest,
      'penalty', r.penalty,
      'total_claimed', r.total_claimed
    ) order by r.sent_at desc) into v_reminders
    from coownership_reminders r
    where r.unit_id = v_unit.id;
  else
    v_balance := row(0, 0, 0, 0);
    v_unpaid := '[]'::jsonb;
    v_reminders := '[]'::jsonb;
  end if;

  -- Exercices disponibles (pour annexes comptables)
  select jsonb_agg(jsonb_build_object(
    'year_id', id,
    'year', year,
    'status', status,
    'closed_at', closed_at
  ) order by year desc) into v_years
  from coownership_accounting_years
  where coownership_id = v_token.coownership_id;

  return jsonb_build_object(
    'coownership_name', v_coown.name,
    'lot_number', v_unit.lot_number,
    'owner_name', v_unit.owner_name,
    'tantiemes', v_unit.tantiemes,
    'total_tantiemes', v_coown.total_tantiemes,
    'balance', jsonb_build_object(
      'total_due', coalesce(v_balance.total_due, 0),
      'total_paid', coalesce(v_balance.total_paid, 0),
      'outstanding', coalesce(v_balance.outstanding, 0),
      'nb_unpaid', coalesce(v_balance.nb_unpaid, 0)
    ),
    'unpaid', coalesce(v_unpaid, '[]'::jsonb),
    'reminders', coalesce(v_reminders, '[]'::jsonb),
    'years', coalesce(v_years, '[]'::jsonb)
  );
end;
$$;

grant execute on function get_portal_account(text) to anon, authenticated;
