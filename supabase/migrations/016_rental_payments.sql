-- ============================================================
-- RENTAL PAYMENTS — Suivi des paiements de loyers + quittances
-- ============================================================
-- Extension de rental_lots pour tracer les paiements mensuels reçus
-- du locataire et générer les quittances conformes à la loi LU.
--
-- Dépend de : 006_cloud_sync_valuations_and_lots.sql

CREATE TABLE IF NOT EXISTS rental_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES rental_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Période couverte (généralement un mois)
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  -- Montants
  amount_rent NUMERIC NOT NULL DEFAULT 0,       -- loyer principal HC
  amount_charges NUMERIC NOT NULL DEFAULT 0,    -- charges locatives
  amount_total NUMERIC NOT NULL DEFAULT 0,      -- calculé = rent + charges

  -- Paiement
  paid_at DATE,
  payment_method TEXT CHECK (payment_method IN ('virement','cheque','prelevement','espece','autre')),
  payment_reference TEXT,

  -- Statut dérivé
  status TEXT NOT NULL DEFAULT 'due'
    CHECK (status IN ('due','partial','paid','late','cancelled')),

  -- Quittance
  receipt_issued_at TIMESTAMPTZ,
  receipt_sha256 TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (lot_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS rental_payments_lot_idx ON rental_payments(lot_id);
CREATE INDEX IF NOT EXISTS rental_payments_user_idx ON rental_payments(user_id);
CREATE INDEX IF NOT EXISTS rental_payments_status_idx ON rental_payments(status);
CREATE INDEX IF NOT EXISTS rental_payments_period_idx ON rental_payments(period_year, period_month);

ALTER TABLE rental_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_payments_owner_all" ON rental_payments;
CREATE POLICY "rental_payments_owner_all" ON rental_payments
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION rental_payments_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.amount_total := COALESCE(NEW.amount_rent, 0) + COALESCE(NEW.amount_charges, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rental_payments_touch_trigger ON rental_payments;
CREATE TRIGGER rental_payments_touch_trigger
  BEFORE INSERT OR UPDATE ON rental_payments
  FOR EACH ROW EXECUTE FUNCTION rental_payments_touch();
