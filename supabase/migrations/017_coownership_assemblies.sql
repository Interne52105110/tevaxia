-- ============================================================
-- COOWNERSHIP ASSEMBLIES — AG virtuelle copropriété LU
-- ============================================================
-- Assemblées générales (ordinaire + extraordinaire) avec résolutions
-- à voter et vote électronique pondéré par tantièmes.
-- Loi du 16 mai 1975 (statut copropriété LU) : convocation min. 15 j
-- avant AG avec ordre du jour, quorum et majorités selon la nature
-- de la résolution.
--
-- Dépend de : 014_coownerships.sql (coownerships + coownership_units)

-- ============================================================
-- 1. coownership_assemblies — AG
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  assembly_type TEXT NOT NULL DEFAULT 'ordinary'
    CHECK (assembly_type IN ('ordinary','extraordinary')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  virtual_url TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','convened','in_progress','closed','cancelled')),

  convocation_sent_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Quorum exigé (en % des tantièmes représentés), LU : souvent 50 %+1
  quorum_pct NUMERIC NOT NULL DEFAULT 50,

  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assemblies_coown_idx ON coownership_assemblies(coownership_id);
CREATE INDEX IF NOT EXISTS assemblies_status_idx ON coownership_assemblies(status);

-- ============================================================
-- 2. assembly_resolutions — ordre du jour / résolutions à voter
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES coownership_assemblies(id) ON DELETE CASCADE,

  number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Type de majorité requise
  majority_type TEXT NOT NULL DEFAULT 'simple'
    CHECK (majority_type IN ('simple','absolute','double','unanimity')),

  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending','approved','rejected')),

  -- Totaux dénormalisés (mis à jour par trigger à chaque vote)
  votes_yes_tantiemes INT NOT NULL DEFAULT 0,
  votes_no_tantiemes INT NOT NULL DEFAULT 0,
  votes_abstain_tantiemes INT NOT NULL DEFAULT 0,
  votes_absent_tantiemes INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (assembly_id, number)
);

CREATE INDEX IF NOT EXISTS resolutions_assembly_idx ON assembly_resolutions(assembly_id);

-- ============================================================
-- 3. assembly_votes — votes individuels par lot
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_id UUID NOT NULL REFERENCES assembly_resolutions(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES coownership_units(id) ON DELETE CASCADE,

  vote TEXT NOT NULL DEFAULT 'absent'
    CHECK (vote IN ('yes','no','abstain','absent')),

  tantiemes_at_vote INT NOT NULL DEFAULT 0, -- snapshot des tantièmes au moment du vote

  voter_name TEXT,       -- pour traçabilité dans le PV
  proxy_from_unit_id UUID REFERENCES coownership_units(id) ON DELETE SET NULL,

  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (resolution_id, unit_id)
);

CREATE INDEX IF NOT EXISTS votes_resolution_idx ON assembly_votes(resolution_id);
CREATE INDEX IF NOT EXISTS votes_unit_idx ON assembly_votes(unit_id);

-- ============================================================
-- 4. Trigger — recompute résolution totals après chaque vote
-- ============================================================

CREATE OR REPLACE FUNCTION assembly_recompute_resolution(p_resolution_id UUID)
RETURNS VOID AS $$
DECLARE
  v_yes INT;
  v_no INT;
  v_abs INT;
  v_absent INT;
  v_total INT;
  v_quorum_pct NUMERIC;
  v_majority TEXT;
  v_result TEXT;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN vote='yes'     THEN tantiemes_at_vote ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN vote='no'      THEN tantiemes_at_vote ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN vote='abstain' THEN tantiemes_at_vote ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN vote='absent'  THEN tantiemes_at_vote ELSE 0 END),0)
  INTO v_yes, v_no, v_abs, v_absent
  FROM assembly_votes
  WHERE resolution_id = p_resolution_id;

  SELECT r.majority_type, c.total_tantiemes, a.quorum_pct
  INTO v_majority, v_total, v_quorum_pct
  FROM assembly_resolutions r
  JOIN coownership_assemblies a ON a.id = r.assembly_id
  JOIN coownerships c ON c.id = a.coownership_id
  WHERE r.id = p_resolution_id;

  -- Évaluation du résultat (seulement si un vote exprimé existe)
  IF v_yes + v_no + v_abs = 0 THEN
    v_result := 'pending';
  ELSE
    CASE v_majority
      WHEN 'simple' THEN
        v_result := CASE WHEN v_yes > v_no THEN 'approved' ELSE 'rejected' END;
      WHEN 'absolute' THEN
        -- majorité absolue des tantièmes totaux
        v_result := CASE WHEN v_yes > v_total / 2 THEN 'approved' ELSE 'rejected' END;
      WHEN 'double' THEN
        -- double majorité : > 2/3 des tantièmes exprimés
        v_result := CASE WHEN v_yes * 3 > (v_yes + v_no + v_abs) * 2 THEN 'approved' ELSE 'rejected' END;
      WHEN 'unanimity' THEN
        v_result := CASE WHEN v_no = 0 AND v_abs = 0 AND v_yes > 0 THEN 'approved' ELSE 'rejected' END;
      ELSE
        v_result := 'pending';
    END CASE;
  END IF;

  UPDATE assembly_resolutions
  SET votes_yes_tantiemes = v_yes,
      votes_no_tantiemes = v_no,
      votes_abstain_tantiemes = v_abs,
      votes_absent_tantiemes = v_absent,
      result = v_result,
      updated_at = NOW()
  WHERE id = p_resolution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_assembly_vote_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM assembly_recompute_resolution(COALESCE(NEW.resolution_id, OLD.resolution_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assembly_vote_update ON assembly_votes;
CREATE TRIGGER trg_assembly_vote_update
  AFTER INSERT OR UPDATE OR DELETE ON assembly_votes
  FOR EACH ROW EXECUTE FUNCTION trg_assembly_vote_update();

-- ============================================================
-- 5. Function : seed all votes for a resolution with all units
-- ============================================================

CREATE OR REPLACE FUNCTION assembly_seed_votes(p_resolution_id UUID)
RETURNS INT AS $$
DECLARE
  v_assembly_id UUID;
  v_coown_id UUID;
  v_count INT;
BEGIN
  SELECT r.assembly_id, a.coownership_id
  INTO v_assembly_id, v_coown_id
  FROM assembly_resolutions r
  JOIN coownership_assemblies a ON a.id = r.assembly_id
  WHERE r.id = p_resolution_id;

  INSERT INTO assembly_votes (resolution_id, unit_id, vote, tantiemes_at_vote, voter_name)
  SELECT p_resolution_id, u.id, 'absent', u.tantiemes, u.owner_name
  FROM coownership_units u
  WHERE u.coownership_id = v_coown_id
  ON CONFLICT (resolution_id, unit_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM assembly_recompute_resolution(p_resolution_id);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Touch triggers
-- ============================================================

CREATE OR REPLACE FUNCTION assemblies_touch()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assemblies_touch_trigger ON coownership_assemblies;
CREATE TRIGGER assemblies_touch_trigger BEFORE UPDATE ON coownership_assemblies
  FOR EACH ROW EXECUTE FUNCTION assemblies_touch();

DROP TRIGGER IF EXISTS resolutions_touch_trigger ON assembly_resolutions;
CREATE TRIGGER resolutions_touch_trigger BEFORE UPDATE ON assembly_resolutions
  FOR EACH ROW EXECUTE FUNCTION assemblies_touch();

DROP TRIGGER IF EXISTS votes_touch_trigger ON assembly_votes;
CREATE TRIGGER votes_touch_trigger BEFORE UPDATE ON assembly_votes
  FOR EACH ROW EXECUTE FUNCTION assemblies_touch();

-- ============================================================
-- 7. RLS — accès réservé aux membres de l'organisation
-- ============================================================

ALTER TABLE coownership_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assemblies_select" ON coownership_assemblies;
DROP POLICY IF EXISTS "assemblies_insert" ON coownership_assemblies;
DROP POLICY IF EXISTS "assemblies_update" ON coownership_assemblies;
DROP POLICY IF EXISTS "assemblies_delete" ON coownership_assemblies;

CREATE POLICY "assemblies_select" ON coownership_assemblies FOR SELECT
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_assemblies.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "assemblies_insert" ON coownership_assemblies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_assemblies.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "assemblies_update" ON coownership_assemblies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_assemblies.coownership_id AND is_org_member(c.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_assemblies.coownership_id AND is_org_member(c.org_id)));
CREATE POLICY "assemblies_delete" ON coownership_assemblies FOR DELETE
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_assemblies.coownership_id AND is_org_admin(c.org_id)));

DROP POLICY IF EXISTS "resolutions_all" ON assembly_resolutions;
CREATE POLICY "resolutions_all" ON assembly_resolutions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM coownership_assemblies a
    JOIN coownerships c ON c.id = a.coownership_id
    WHERE a.id = assembly_resolutions.assembly_id AND is_org_member(c.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM coownership_assemblies a
    JOIN coownerships c ON c.id = a.coownership_id
    WHERE a.id = assembly_resolutions.assembly_id AND is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "votes_all" ON assembly_votes;
CREATE POLICY "votes_all" ON assembly_votes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM assembly_resolutions r
    JOIN coownership_assemblies a ON a.id = r.assembly_id
    JOIN coownerships c ON c.id = a.coownership_id
    WHERE r.id = assembly_votes.resolution_id AND is_org_member(c.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM assembly_resolutions r
    JOIN coownership_assemblies a ON a.id = r.assembly_id
    JOIN coownerships c ON c.id = a.coownership_id
    WHERE r.id = assembly_votes.resolution_id AND is_org_member(c.org_id)
  ));
