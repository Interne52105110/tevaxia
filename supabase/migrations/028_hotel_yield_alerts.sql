-- ============================================================
-- YIELD ALERTS HÔTELIER — règles d'alerte sur ADR/occupation/forecast
-- ============================================================
-- Permet à un hôtelier de configurer des seuils qui déclenchent email/push
-- en cas de divergence significative (pickup vs forecast, ADR compset).

CREATE TABLE IF NOT EXISTS hotel_yield_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'pickup_deviation',      -- pickup diverge forecast de X%
    'adr_compset_change',    -- ADR du compset varie de X%
    'occupancy_drop',        -- taux d'occupation tombe sous Y%
    'revpar_delta',          -- RevPAR dévie de baseline
    'gop_margin_below'       -- GOP margin sous benchmark catégorie
  )),

  threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 10.0, -- seuil % déclenchement
  threshold_days INT NOT NULL DEFAULT 7,             -- fenêtre d'observation
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INT NOT NULL DEFAULT 0,

  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_push BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hotel_alerts_hotel_idx ON hotel_yield_alerts(hotel_id);
CREATE INDEX IF NOT EXISTS hotel_alerts_user_idx ON hotel_yield_alerts(user_id);

-- Historique des déclenchements
CREATE TABLE IF NOT EXISTS hotel_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES hotel_yield_alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observed_value NUMERIC(10,2),
  threshold_value NUMERIC(10,2),
  message TEXT,
  notified_email BOOLEAN NOT NULL DEFAULT FALSE,
  notified_push BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS hotel_alert_events_alert_idx ON hotel_alert_events(alert_id, triggered_at DESC);

ALTER TABLE hotel_yield_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_alert_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_hotel_alerts" ON hotel_yield_alerts;
CREATE POLICY "owner_manage_hotel_alerts" ON hotel_yield_alerts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_read_alert_events" ON hotel_alert_events;
CREATE POLICY "owner_read_alert_events" ON hotel_alert_events FOR SELECT USING (
  alert_id IN (SELECT id FROM hotel_yield_alerts WHERE user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION hotel_yield_alerts_touch()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hotel_yield_alerts_touch_trg ON hotel_yield_alerts;
CREATE TRIGGER hotel_yield_alerts_touch_trg BEFORE UPDATE ON hotel_yield_alerts
FOR EACH ROW EXECUTE FUNCTION hotel_yield_alerts_touch();
