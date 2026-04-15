-- ============================================================
-- USER TIERS + CRON PURGE des lignes expirées
-- ============================================================
-- - Table `user_tiers` : free (500) / pro (10 000).
-- - Triggers cap re-écrits pour lire le tier de l'utilisateur.
-- - pg_cron job : purge quotidienne des lignes expirées (valuations,
--   rental_lots, shared_links).
--
-- Dépend de : 001, 005, 006.

-- ============================================================
-- 1. Table user_tiers
-- ============================================================

CREATE TABLE IF NOT EXISTS user_tiers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  items_cap INT NOT NULL DEFAULT 500,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;

-- Lecture : l'utilisateur voit son propre tier
CREATE POLICY "user_read_own_tier" ON user_tiers
  FOR SELECT USING (user_id = auth.uid());

-- Pas d'INSERT/UPDATE/DELETE par l'utilisateur — géré côté admin
-- (service role uniquement). Utiliser l'interface admin ou un endpoint
-- serveur pour promouvoir un utilisateur en pro/enterprise.

-- Helper : récupère le plafond effectif d'un user (défaut 500)
CREATE OR REPLACE FUNCTION get_user_items_cap(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  effective_cap INT;
BEGIN
  SELECT items_cap INTO effective_cap
  FROM user_tiers
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN COALESCE(effective_cap, 500);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. Triggers cap mis à jour (lecture dynamique du plafond)
-- ============================================================

CREATE OR REPLACE FUNCTION valuations_enforce_cap()
RETURNS TRIGGER AS $$
DECLARE
  user_cap INT;
  to_delete INT;
BEGIN
  user_cap := get_user_items_cap(NEW.user_id);

  SELECT COUNT(*) - user_cap INTO to_delete
  FROM valuations
  WHERE user_id = NEW.user_id;

  IF to_delete > 0 THEN
    DELETE FROM valuations
    WHERE id IN (
      SELECT id FROM valuations
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT to_delete
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rental_lots_enforce_cap()
RETURNS TRIGGER AS $$
DECLARE
  user_cap INT;
  to_delete INT;
BEGIN
  user_cap := get_user_items_cap(NEW.user_id);

  SELECT COUNT(*) - user_cap INTO to_delete
  FROM rental_lots
  WHERE user_id = NEW.user_id;

  IF to_delete > 0 THEN
    DELETE FROM rental_lots
    WHERE id IN (
      SELECT id FROM rental_lots
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT to_delete
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Fonction de purge hard des lignes expirées
-- ============================================================

CREATE OR REPLACE FUNCTION purge_expired_rows()
RETURNS JSONB AS $$
DECLARE
  v_valuations INT;
  v_lots INT;
  v_shared INT;
BEGIN
  DELETE FROM valuations WHERE expires_at < NOW();
  GET DIAGNOSTICS v_valuations = ROW_COUNT;

  DELETE FROM rental_lots WHERE expires_at < NOW();
  GET DIAGNOSTICS v_lots = ROW_COUNT;

  DELETE FROM shared_links WHERE expires_at < NOW();
  GET DIAGNOSTICS v_shared = ROW_COUNT;

  RETURN jsonb_build_object(
    'valuations_purged', v_valuations,
    'rental_lots_purged', v_lots,
    'shared_links_purged', v_shared,
    'ran_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Cron quotidien (pg_cron)
-- ============================================================
-- pg_cron est disponible sur Supabase (extension pré-installée,
-- à activer depuis Database → Extensions si pas déjà active).

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprime l'ancien job s'il existe, puis recrée
SELECT cron.unschedule('tevaxia-purge-expired')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tevaxia-purge-expired');

-- Exécution quotidienne à 03:00 UTC
SELECT cron.schedule(
  'tevaxia-purge-expired',
  '0 3 * * *',
  $cron$SELECT purge_expired_rows();$cron$
);

-- Pour exécuter manuellement la purge : SELECT purge_expired_rows();
