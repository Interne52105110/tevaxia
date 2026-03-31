-- Valuations table for tevaxia.lu
-- Stores user-saved property valuations

CREATE TABLE IF NOT EXISTS valuations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  commune TEXT,
  asset_type TEXT,
  valeur_principale NUMERIC,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: users can only access their own valuations
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own valuations"
  ON valuations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own valuations"
  ON valuations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own valuations"
  ON valuations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own valuations"
  ON valuations FOR DELETE USING (auth.uid() = user_id);
