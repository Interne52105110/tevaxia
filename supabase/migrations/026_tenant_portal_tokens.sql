-- ============================================================
-- TENANT PORTAL — tokens d'accès read-only pour les locataires
-- ============================================================
-- Permet au bailleur d'envoyer un lien magique (sans création de compte)
-- à son locataire pour qu'il accède à son espace personnel :
-- détails bail, quittances passées, paiements à régler, historique.

CREATE TABLE IF NOT EXISTS tenant_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES rental_lots(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_name TEXT,
  tenant_email TEXT,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenant_portal_lot_idx ON tenant_portal_tokens(lot_id);
CREATE INDEX IF NOT EXISTS tenant_portal_token_idx ON tenant_portal_tokens(token);
CREATE INDEX IF NOT EXISTS tenant_portal_owner_idx ON tenant_portal_tokens(owner_id);

ALTER TABLE tenant_portal_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_tenant_tokens" ON tenant_portal_tokens;
CREATE POLICY "owner_manage_tenant_tokens" ON tenant_portal_tokens
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RPC SECURITY DEFINER pour la lecture publique via token
CREATE OR REPLACE FUNCTION get_tenant_portal_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token tenant_portal_tokens%ROWTYPE;
  v_lot JSONB;
  v_payments JSONB;
BEGIN
  SELECT * INTO v_token FROM tenant_portal_tokens
   WHERE token = p_token AND revoked_at IS NULL AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  UPDATE tenant_portal_tokens
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE id = v_token.id;

  SELECT to_jsonb(l) INTO v_lot
    FROM (SELECT name, address, commune, surface, nb_chambres, classe_energie, est_meuble
          FROM rental_lots WHERE id = v_token.lot_id) l;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'period', period_year || '-' || LPAD(period_month::text, 2, '0'),
      'amount_rent', amount_rent,
      'amount_charges', amount_charges,
      'amount_total', amount_total,
      'status', status,
      'paid_at', paid_at,
      'receipt_issued_at', receipt_issued_at
    ) ORDER BY period_year DESC, period_month DESC
  ) INTO v_payments
  FROM (
    SELECT id, period_year, period_month, amount_rent, amount_charges, amount_total,
           status, paid_at, receipt_issued_at
    FROM rental_payments
    WHERE lot_id = v_token.lot_id
    ORDER BY period_year DESC, period_month DESC
    LIMIT 24
  ) p;

  RETURN jsonb_build_object(
    'lot', v_lot,
    'tenant_name', v_token.tenant_name,
    'payments', COALESCE(v_payments, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_tenant_portal_data(TEXT) TO anon, authenticated;
