-- ============================================================
-- COPROPRIÉTAIRE PORTAL — tokens d'accès read-only par lot
-- ============================================================
-- Permet au syndic d'envoyer un lien magique (sans création de compte)
-- à chaque copropriétaire pour qu'il accède à son espace perso :
-- charges, PV d'AG, règlement, historique paiements, docs.

CREATE TABLE IF NOT EXISTS coownership_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES coownership_units(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portal_tokens_coown_idx ON coownership_portal_tokens(coownership_id);
CREATE INDEX IF NOT EXISTS portal_tokens_token_idx ON coownership_portal_tokens(token);
CREATE INDEX IF NOT EXISTS portal_tokens_unit_idx ON coownership_portal_tokens(unit_id);

ALTER TABLE coownership_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Le syndic (org owner) peut gérer tous les tokens de ses copropriétés
DROP POLICY IF EXISTS "syndic_manage_portal_tokens" ON coownership_portal_tokens;
CREATE POLICY "syndic_manage_portal_tokens" ON coownership_portal_tokens
  FOR ALL USING (
    coownership_id IN (
      SELECT c.id FROM coownerships c
      JOIN org_members m ON m.org_id = c.org_id
      WHERE m.user_id = auth.uid() AND m.role IN ('admin','syndic')
    )
  );

-- Public read (pour la route /copropriete/[token]) — le token fait foi
-- On utilise une RPC avec SECURITY DEFINER plutôt que SELECT public.

CREATE OR REPLACE FUNCTION get_portal_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token coownership_portal_tokens%ROWTYPE;
  v_coown JSONB;
  v_unit JSONB;
  v_fund_balance NUMERIC;
  v_recent_assemblies JSONB;
  v_recent_calls JSONB;
BEGIN
  SELECT * INTO v_token FROM coownership_portal_tokens
   WHERE token = p_token AND revoked_at IS NULL AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  -- Update view count
  UPDATE coownership_portal_tokens
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE id = v_token.id;

  -- Coownership info
  SELECT to_jsonb(c) INTO v_coown
    FROM (SELECT name, address, commune, total_tantiemes, nb_lots, year_built,
                 last_ag_date, next_ag_date, works_fund_balance
          FROM coownerships WHERE id = v_token.coownership_id) c;

  -- Unit info (if linked)
  IF v_token.unit_id IS NOT NULL THEN
    SELECT to_jsonb(u) INTO v_unit
      FROM (SELECT lot_number, unit_type, floor, surface_m2, nb_rooms,
                   tantiemes, owner_name, owner_email, occupancy
            FROM coownership_units WHERE id = v_token.unit_id) u;
  END IF;

  -- Recent assemblies (up to 5)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id, 'title', title, 'type', assembly_type,
      'scheduled_at', scheduled_at, 'status', status
    ) ORDER BY scheduled_at DESC
  ) INTO v_recent_assemblies
  FROM (
    SELECT id, title, assembly_type, scheduled_at, status
    FROM coownership_assemblies
    WHERE coownership_id = v_token.coownership_id
    ORDER BY scheduled_at DESC
    LIMIT 5
  ) a;

  -- Recent fund calls for this unit
  IF v_token.unit_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', fcu.id, 'period', fc.period_label,
        'amount', fcu.amount, 'paid', fcu.paid_at IS NOT NULL,
        'due_date', fc.due_date
      ) ORDER BY fc.due_date DESC
    ) INTO v_recent_calls
    FROM (
      SELECT fcu.id, fcu.amount, fcu.paid_at, fc.period_label, fc.due_date
      FROM coownership_fund_call_units fcu
      JOIN coownership_fund_calls fc ON fc.id = fcu.fund_call_id
      WHERE fcu.unit_id = v_token.unit_id
      ORDER BY fc.due_date DESC
      LIMIT 6
    ) fcu_list;
  END IF;

  RETURN jsonb_build_object(
    'coownership', v_coown,
    'unit', v_unit,
    'assemblies', COALESCE(v_recent_assemblies, '[]'::jsonb),
    'fund_calls', COALESCE(v_recent_calls, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_portal_data(TEXT) TO anon, authenticated;
