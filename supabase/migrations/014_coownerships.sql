-- ============================================================
-- COOWNERSHIPS — Copropriétés gérées par un syndic
-- ============================================================
-- MVP vertical syndic : une organisation de type 'syndic' gère N
-- copropriétés (immeubles). Chaque copropriété contient N lots
-- avec leurs quotes-parts (millièmes). Charges et appels de fonds
-- seront ajoutés en commits ultérieurs.
--
-- Dépend de : 003_create_organizations.sql, 010_org_verticals.sql,
-- 010b (is_org_member / is_org_admin).

-- ============================================================
-- 1. COOWNERSHIPS — Immeubles sous gestion
-- ============================================================

CREATE TABLE IF NOT EXISTS coownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité
  name TEXT NOT NULL,
  slug TEXT,
  address TEXT,
  commune TEXT,
  cadastre_ref TEXT,

  -- Caractéristiques
  total_tantiemes INT NOT NULL DEFAULT 1000, -- millièmes (souvent 1000 ou 10000)
  nb_lots INT NOT NULL DEFAULT 0, -- dénormalisé, actualisé via trigger
  year_built INT,
  nb_floors INT,
  has_elevator BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking BOOLEAN NOT NULL DEFAULT FALSE,
  heating_type TEXT, -- 'individual' | 'central_gas' | 'central_oil' | 'heat_pump'...

  -- Juridique
  date_rc TEXT,            -- date de la création du règlement de copropriété
  registre_commerce TEXT,  -- N° RCS le cas échéant

  -- Dernière AG
  last_ag_date DATE,
  next_ag_date DATE,

  -- Meta
  vertical_config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS coownerships_org_idx ON coownerships(org_id);

-- ============================================================
-- 2. COOWNERSHIP_UNITS — Lots (appartements, commerces, parkings)
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,

  -- Identification
  lot_number TEXT NOT NULL,       -- ex. "Lot 3", "Lot 12A"
  unit_type TEXT NOT NULL DEFAULT 'apartment'
    CHECK (unit_type IN ('apartment','commercial','office','parking','cellar','other')),
  floor INT,
  surface_m2 NUMERIC,
  nb_rooms INT,

  -- Quote-part (millièmes)
  tantiemes INT NOT NULL DEFAULT 0, -- sur total_tantiemes de la copro

  -- Copropriétaire actuel
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  owner_address TEXT,
  acquisition_date DATE,

  -- Occupation
  occupancy TEXT NOT NULL DEFAULT 'owner_occupied'
    CHECK (occupancy IN ('owner_occupied','rented','vacant','seasonal')),
  tenant_name TEXT,

  -- Meta
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (coownership_id, lot_number)
);

CREATE INDEX IF NOT EXISTS units_coownership_idx ON coownership_units(coownership_id);

-- ============================================================
-- 3. Trigger pour tenir nb_lots à jour dans coownerships
-- ============================================================

CREATE OR REPLACE FUNCTION coownership_refresh_nb_lots()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.coownership_id, OLD.coownership_id);
  UPDATE coownerships
  SET nb_lots = (SELECT COUNT(*) FROM coownership_units WHERE coownership_id = target_id),
      updated_at = NOW()
  WHERE id = target_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS units_refresh_nb_lots ON coownership_units;
CREATE TRIGGER units_refresh_nb_lots
  AFTER INSERT OR DELETE ON coownership_units
  FOR EACH ROW EXECUTE FUNCTION coownership_refresh_nb_lots();

-- ============================================================
-- 4. RLS — accès réservé aux membres de l'organisation syndic
-- ============================================================

ALTER TABLE coownerships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coowns_select_members" ON coownerships;
DROP POLICY IF EXISTS "coowns_insert_members" ON coownerships;
DROP POLICY IF EXISTS "coowns_update_members" ON coownerships;
DROP POLICY IF EXISTS "coowns_delete_admins" ON coownerships;

CREATE POLICY "coowns_select_members" ON coownerships FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "coowns_insert_members" ON coownerships FOR INSERT
  WITH CHECK (is_org_member(org_id));
CREATE POLICY "coowns_update_members" ON coownerships FOR UPDATE
  USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "coowns_delete_admins" ON coownerships FOR DELETE
  USING (is_org_admin(org_id));

ALTER TABLE coownership_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "units_select_coown_members" ON coownership_units;
DROP POLICY IF EXISTS "units_insert_coown_members" ON coownership_units;
DROP POLICY IF EXISTS "units_update_coown_members" ON coownership_units;
DROP POLICY IF EXISTS "units_delete_coown_members" ON coownership_units;

CREATE POLICY "units_select_coown_members" ON coownership_units FOR SELECT
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_units.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "units_insert_coown_members" ON coownership_units FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_units.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "units_update_coown_members" ON coownership_units FOR UPDATE
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_units.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "units_delete_coown_members" ON coownership_units FOR DELETE
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_units.coownership_id AND is_org_member(c.org_id)));

-- Triggers touch updated_at
CREATE OR REPLACE FUNCTION coownerships_touch()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coownerships_touch_trigger ON coownerships;
CREATE TRIGGER coownerships_touch_trigger BEFORE UPDATE ON coownerships
  FOR EACH ROW EXECUTE FUNCTION coownerships_touch();

DROP TRIGGER IF EXISTS units_touch_trigger ON coownership_units;
CREATE TRIGGER units_touch_trigger BEFORE UPDATE ON coownership_units
  FOR EACH ROW EXECUTE FUNCTION coownerships_touch();
