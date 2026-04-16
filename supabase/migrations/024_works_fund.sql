-- ============================================================
-- FONDS DE TRAVAUX — anticipation projet de loi LU 7763
-- ============================================================
-- Ajoute le concept de fonds de travaux obligatoire à chaque copropriété.
-- Le projet de loi 7763 (modernisation loi 16.05.1975) introduit un fonds
-- de travaux avec capitalisation minimale annuelle. Préparation du terrain
-- pour quand la loi entre en vigueur.

ALTER TABLE coownerships
  ADD COLUMN IF NOT EXISTS works_fund_target_pct NUMERIC(5,2) DEFAULT 5.0
    CHECK (works_fund_target_pct >= 0 AND works_fund_target_pct <= 100),
  ADD COLUMN IF NOT EXISTS works_fund_annual_contribution NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS works_fund_balance NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS works_fund_created_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN coownerships.works_fund_target_pct IS
  'Cotisation annuelle cible en % du budget prévisionnel (projet 7763 par défaut 5%)';
COMMENT ON COLUMN coownerships.works_fund_annual_contribution IS
  'Cotisation annuelle votée par l''AG en EUR';
COMMENT ON COLUMN coownerships.works_fund_balance IS
  'Solde courant du fonds de travaux (capitalisation nette)';

-- Table des mouvements du fonds de travaux
CREATE TABLE IF NOT EXISTS works_fund_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  movement_date DATE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('contribution','withdrawal','adjustment','interest')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  related_works_project TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS works_fund_movements_coown_idx ON works_fund_movements(coownership_id, movement_date DESC);

ALTER TABLE works_fund_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "syndic_read_works_fund" ON works_fund_movements;
CREATE POLICY "syndic_read_works_fund" ON works_fund_movements
  FOR SELECT USING (
    coownership_id IN (
      SELECT c.id FROM coownerships c
      JOIN org_members m ON m.org_id = c.org_id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "syndic_write_works_fund" ON works_fund_movements;
CREATE POLICY "syndic_write_works_fund" ON works_fund_movements
  FOR ALL USING (
    coownership_id IN (
      SELECT c.id FROM coownerships c
      JOIN org_members m ON m.org_id = c.org_id
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin','syndic')
    )
  );

-- Recalcul auto du solde lors d'un mouvement
CREATE OR REPLACE FUNCTION recalc_works_fund_balance()
RETURNS TRIGGER AS $$
DECLARE
  target_coown UUID;
BEGIN
  target_coown := COALESCE(NEW.coownership_id, OLD.coownership_id);
  UPDATE coownerships
    SET works_fund_balance = COALESCE((
      SELECT SUM(
        CASE
          WHEN movement_type IN ('contribution','adjustment','interest') THEN amount
          WHEN movement_type = 'withdrawal' THEN -amount
          ELSE 0
        END
      )
      FROM works_fund_movements
      WHERE coownership_id = target_coown
    ), 0)
    WHERE id = target_coown;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS works_fund_balance_trigger ON works_fund_movements;
CREATE TRIGGER works_fund_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON works_fund_movements
  FOR EACH ROW EXECUTE FUNCTION recalc_works_fund_balance();
