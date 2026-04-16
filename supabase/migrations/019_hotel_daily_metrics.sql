-- ============================================================
-- HOTEL_DAILY_METRICS — Métriques journalières pour forecast
-- ============================================================
-- Données quotidiennes (occupation + ADR + RevPAR) indispensables
-- pour les modèles de prévision Holt-Winters / ARIMA à horizon 90 j.
-- Une ligne = un hôtel pour une date donnée.
--
-- Dépend de : 013_hotels.sql

CREATE TABLE IF NOT EXISTS hotel_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  metric_date DATE NOT NULL,
  occupancy NUMERIC CHECK (occupancy BETWEEN 0 AND 1), -- 0-1
  adr NUMERIC CHECK (adr >= 0),                        -- €
  revpar NUMERIC CHECK (revpar >= 0),                  -- €

  -- Context for quality
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','csv_import','pms_sync','forecast_seed')),
  notes TEXT,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (hotel_id, metric_date)
);

CREATE INDEX IF NOT EXISTS hotel_metrics_hotel_idx ON hotel_daily_metrics(hotel_id);
CREATE INDEX IF NOT EXISTS hotel_metrics_date_idx ON hotel_daily_metrics(metric_date);

-- Trigger — auto compute revpar si manquant
CREATE OR REPLACE FUNCTION hotel_metrics_compute_revpar()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.revpar IS NULL AND NEW.occupancy IS NOT NULL AND NEW.adr IS NOT NULL THEN
    NEW.revpar := NEW.occupancy * NEW.adr;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hotel_metrics_touch ON hotel_daily_metrics;
CREATE TRIGGER hotel_metrics_touch BEFORE INSERT OR UPDATE ON hotel_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION hotel_metrics_compute_revpar();

-- RLS
ALTER TABLE hotel_daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_metrics_all" ON hotel_daily_metrics;
CREATE POLICY "hotel_metrics_all" ON hotel_daily_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_id AND is_org_member(h.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_id AND is_org_member(h.org_id)));
