-- ============================================================
-- RELANCES PAIEMENTS (gestion locative + syndic) + COLOCATION
-- ============================================================

-- Relances sur paiements locatifs impayés
CREATE TABLE IF NOT EXISTS rental_dunning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES rental_payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level IN (1, 2, 3)), -- 1=rappel J+15, 2=amiable J+30, 3=mise en demeure J+60
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('email','pdf','eidas')),
  document_sha256 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dunning_payment_idx ON rental_dunning_events(payment_id);
CREATE INDEX IF NOT EXISTS dunning_user_idx ON rental_dunning_events(user_id);

ALTER TABLE rental_dunning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_dunning" ON rental_dunning_events;
CREATE POLICY "owner_dunning" ON rental_dunning_events FOR ALL USING (user_id = auth.uid());

-- Colocation : occupants multiples par lot
CREATE TABLE IF NOT EXISTS rental_cotenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES rental_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  share_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (share_pct >= 0 AND share_pct <= 100),
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  bail_start DATE,
  bail_end DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','left','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cotenants_lot_idx ON rental_cotenants(lot_id);
CREATE INDEX IF NOT EXISTS cotenants_user_idx ON rental_cotenants(user_id);

ALTER TABLE rental_cotenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_cotenants" ON rental_cotenants;
CREATE POLICY "owner_cotenants" ON rental_cotenants FOR ALL USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION cotenants_touch() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cotenants_touch_trg ON rental_cotenants;
CREATE TRIGGER cotenants_touch_trg BEFORE UPDATE ON rental_cotenants
FOR EACH ROW EXECUTE FUNCTION cotenants_touch();

-- Relances sur appels de fonds copropriété
-- NB : le schéma réel (cf. migration 015) utilise `coownership_unit_charges`
-- (1 ligne par lot × appel) rattaché à `coownership_calls` via call_id.
CREATE TABLE IF NOT EXISTS coownership_dunning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_charge_id UUID NOT NULL REFERENCES coownership_unit_charges(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level IN (1, 2, 3)),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('email','pdf','eidas')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS copro_dunning_idx ON coownership_dunning_events(unit_charge_id);
ALTER TABLE coownership_dunning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "syndic_dunning" ON coownership_dunning_events;
CREATE POLICY "syndic_dunning" ON coownership_dunning_events FOR ALL USING (
  unit_charge_id IN (
    SELECT uc.id FROM coownership_unit_charges uc
    JOIN coownership_calls cc ON cc.id = uc.call_id
    JOIN coownerships c ON c.id = cc.coownership_id
    JOIN org_members m ON m.org_id = c.org_id
    WHERE m.user_id = auth.uid() AND m.role IN ('admin','syndic')
  )
);

-- ============================================================
-- Fix migration 025 : get_portal_data référençait des tables/colonnes
-- inexistantes (coownership_fund_call_units / fcu.amount / fc.period_label).
-- On redéfinit la fonction avec les noms réels du schéma (migration 015).
-- ============================================================
CREATE OR REPLACE FUNCTION get_portal_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token coownership_portal_tokens%ROWTYPE;
  v_coown JSONB;
  v_unit JSONB;
  v_recent_assemblies JSONB;
  v_recent_calls JSONB;
BEGIN
  SELECT * INTO v_token FROM coownership_portal_tokens
   WHERE token = p_token AND revoked_at IS NULL AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  UPDATE coownership_portal_tokens
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE id = v_token.id;

  SELECT to_jsonb(c) INTO v_coown
    FROM (SELECT name, address, commune, total_tantiemes, nb_lots, year_built,
                 last_ag_date, next_ag_date, works_fund_balance
          FROM coownerships WHERE id = v_token.coownership_id) c;

  IF v_token.unit_id IS NOT NULL THEN
    SELECT to_jsonb(u) INTO v_unit
      FROM (SELECT lot_number, unit_type, floor, surface_m2, nb_rooms,
                   tantiemes, owner_name, owner_email, occupancy
            FROM coownership_units WHERE id = v_token.unit_id) u;
  END IF;

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

  IF v_token.unit_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', uc.id, 'period', uc.label,
        'amount_due', uc.amount_due, 'amount_paid', uc.amount_paid,
        'paid', uc.paid_at IS NOT NULL,
        'due_date', uc.due_date
      ) ORDER BY uc.due_date DESC
    ) INTO v_recent_calls
    FROM (
      SELECT uc.id, uc.amount_due, uc.amount_paid, uc.paid_at,
             cc.label, cc.due_date
      FROM coownership_unit_charges uc
      JOIN coownership_calls cc ON cc.id = uc.call_id
      WHERE uc.unit_id = v_token.unit_id
      ORDER BY cc.due_date DESC
      LIMIT 6
    ) uc;
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
