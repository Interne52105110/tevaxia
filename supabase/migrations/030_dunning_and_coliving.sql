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
CREATE TABLE IF NOT EXISTS coownership_dunning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_call_unit_id UUID NOT NULL REFERENCES coownership_fund_call_units(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level IN (1, 2, 3)),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('email','pdf','eidas')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS copro_dunning_idx ON coownership_dunning_events(fund_call_unit_id);
ALTER TABLE coownership_dunning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "syndic_dunning" ON coownership_dunning_events;
CREATE POLICY "syndic_dunning" ON coownership_dunning_events FOR ALL USING (
  fund_call_unit_id IN (
    SELECT fcu.id FROM coownership_fund_call_units fcu
    JOIN coownership_fund_calls fc ON fc.id = fcu.fund_call_id
    JOIN coownerships c ON c.id = fc.coownership_id
    JOIN org_members m ON m.org_id = c.org_id
    WHERE m.user_id = auth.uid() AND m.role IN ('admin','syndic')
  )
);
