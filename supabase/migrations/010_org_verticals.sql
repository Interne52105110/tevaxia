-- ============================================================
-- ORG VERTICALS — Extension de organizations pour 4 verticaux métier
-- ============================================================
-- Permet de différencier agence immo / syndic / groupe hôtelier /
-- banque, et d'associer des rôles spécifiques à chaque vertical.
--
-- Dépend de : 003_create_organizations.sql

-- ============================================================
-- 1. Colonnes org_type + vertical_config
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'agency'
    CHECK (org_type IN ('agency', 'syndic', 'hotel_group', 'bank', 'other')),
  ADD COLUMN IF NOT EXISTS vertical_config JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS organizations_org_type_idx ON organizations(org_type);

-- ============================================================
-- 2. Extension de org_role — nouveaux rôles métier
-- ============================================================
-- Postgres ne permet pas d'ADD VALUE à un enum dans une transaction
-- partagée ; on fait des ALTER TYPE individuels.

DO $$
BEGIN
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'syndic'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'conseil_syndical'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'coproprietaire'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'locataire'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'prestataire'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'hotel_owner'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'hotel_director'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'revenue_manager'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'fb_manager'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'reception'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;

-- ============================================================
-- 3. Helper : liste des rôles valides pour un type d'organisation
-- ============================================================

CREATE OR REPLACE FUNCTION org_roles_for_type(p_org_type TEXT)
RETURNS TEXT[] AS $$
BEGIN
  CASE p_org_type
    WHEN 'agency' THEN
      RETURN ARRAY['admin', 'member', 'viewer'];
    WHEN 'syndic' THEN
      RETURN ARRAY['admin', 'syndic', 'conseil_syndical', 'coproprietaire', 'locataire', 'prestataire', 'viewer'];
    WHEN 'hotel_group' THEN
      RETURN ARRAY['admin', 'hotel_owner', 'hotel_director', 'revenue_manager', 'fb_manager', 'reception', 'viewer'];
    WHEN 'bank' THEN
      RETURN ARRAY['admin', 'member', 'viewer'];
    ELSE
      RETURN ARRAY['admin', 'member', 'viewer'];
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
