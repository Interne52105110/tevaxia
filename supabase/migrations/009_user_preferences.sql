-- ============================================================
-- USER PREFERENCES — notifications, consentement, langue
-- ============================================================
-- Préférences granulaires par utilisateur. RLS owner-only.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notifications email
  notify_market_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  notify_monthly_digest BOOLEAN NOT NULL DEFAULT FALSE,
  notify_security BOOLEAN NOT NULL DEFAULT TRUE,
  notify_product_news BOOLEAN NOT NULL DEFAULT FALSE,

  -- Consentements RGPD granulaires
  consent_analytics BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_third_party BOOLEAN NOT NULL DEFAULT FALSE,

  -- Préférences UI
  ui_language TEXT,
  ui_theme TEXT NOT NULL DEFAULT 'system' CHECK (ui_theme IN ('system','light','dark')),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_upsert_own_preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION user_preferences_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_touch_trigger ON user_preferences;
CREATE TRIGGER user_preferences_touch_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION user_preferences_touch();
