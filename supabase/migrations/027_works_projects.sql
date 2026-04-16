-- ============================================================
-- MODULE TRAVAUX COPROPRIÉTÉ — appel d'offres → bon commande → facture → garantie
-- ============================================================

CREATE TABLE IF NOT EXISTS works_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'entretien' CHECK (category IN
    ('entretien','urgent','gros_oeuvre','toiture','facade','ascenseur',
     'chauffage','plomberie','electricite','espaces_communs','autre')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','rfq','quoted','voted','in_progress','completed','cancelled')),

  budget_estimate NUMERIC(12,2),
  voted_amount NUMERIC(12,2),
  final_amount NUMERIC(12,2),
  majority_type TEXT DEFAULT 'simple' CHECK (majority_type IN
    ('simple','absolute','double','unanimity')),

  assembly_id UUID REFERENCES coownership_assemblies(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  warranty_expires DATE,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS works_projects_coown_idx ON works_projects(coownership_id, created_at DESC);

-- Devis reçus pour un projet
CREATE TABLE IF NOT EXISTS works_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES works_projects(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  amount_ht NUMERIC(12,2) NOT NULL,
  amount_tva NUMERIC(12,2) NOT NULL,
  amount_ttc NUMERIC(12,2) NOT NULL,
  delivery_weeks INT,
  warranty_years INT DEFAULT 2,
  notes TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  received_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS works_quotes_project_idx ON works_quotes(project_id);

-- Factures reçues (lien avec OCR si présent)
CREATE TABLE IF NOT EXISTS works_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES works_projects(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount_ht NUMERIC(12,2) NOT NULL,
  amount_tva NUMERIC(12,2) NOT NULL,
  amount_ttc NUMERIC(12,2) NOT NULL,
  paid_at DATE,
  payment_ref TEXT,
  iban TEXT,
  is_final BOOLEAN NOT NULL DEFAULT FALSE, -- facture finale (vs acompte)
  extracted_data JSONB, -- données OCR brutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS works_invoices_project_idx ON works_invoices(project_id);

ALTER TABLE works_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE works_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE works_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "syndic_manage_projects" ON works_projects;
CREATE POLICY "syndic_manage_projects" ON works_projects FOR ALL USING (
  coownership_id IN (SELECT c.id FROM coownerships c
    JOIN org_members m ON m.org_id = c.org_id
    WHERE m.user_id = auth.uid() AND m.role IN ('admin','syndic'))
);

DROP POLICY IF EXISTS "syndic_manage_quotes" ON works_quotes;
CREATE POLICY "syndic_manage_quotes" ON works_quotes FOR ALL USING (
  project_id IN (SELECT id FROM works_projects)
);

DROP POLICY IF EXISTS "syndic_manage_invoices" ON works_invoices;
CREATE POLICY "syndic_manage_invoices" ON works_invoices FOR ALL USING (
  project_id IN (SELECT id FROM works_projects)
);

-- Touch triggers
CREATE OR REPLACE FUNCTION works_projects_touch()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS works_projects_touch_trg ON works_projects;
CREATE TRIGGER works_projects_touch_trg BEFORE UPDATE ON works_projects
FOR EACH ROW EXECUTE FUNCTION works_projects_touch();
