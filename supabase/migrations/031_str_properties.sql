-- ============================================================
-- STR PROPERTIES — portefeuille multi-biens location courte durée
-- ============================================================

CREATE TABLE IF NOT EXISTS str_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  commune TEXT,
  surface NUMERIC NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 2,
  property_type TEXT NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment','house','room','studio','villa')),
  avg_adr NUMERIC NOT NULL DEFAULT 0,
  avg_occupancy_pct NUMERIC NOT NULL DEFAULT 0,
  annual_revenue NUMERIC DEFAULT 0,
  annual_costs NUMERIC DEFAULT 0,
  eu_registry_number TEXT,
  license_status TEXT NOT NULL DEFAULT 'not_required' CHECK (license_status IN ('not_required','pending','obtained','expired')),
  primary_ota TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS str_properties_user_idx ON str_properties(user_id);

ALTER TABLE str_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_str_properties" ON str_properties;
CREATE POLICY "owner_str_properties" ON str_properties FOR ALL USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION str_properties_touch() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS str_properties_touch_trg ON str_properties;
CREATE TRIGGER str_properties_touch_trg BEFORE UPDATE ON str_properties
FOR EACH ROW EXECUTE FUNCTION str_properties_touch();
