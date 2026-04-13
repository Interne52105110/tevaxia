-- Market price alerts
-- Users can subscribe to price alerts for specific communes
-- and get notified when the market price crosses their target.

CREATE TABLE IF NOT EXISTS public.market_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commune TEXT NOT NULL,
  target_price_m2 NUMERIC,
  direction TEXT CHECK (direction IN ('below', 'above')) DEFAULT 'below',
  active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: users can only access their own alerts
ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.market_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.market_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.market_alerts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.market_alerts FOR DELETE USING (auth.uid() = user_id);

-- Index for cron job: only scan active alerts
CREATE INDEX idx_market_alerts_active ON public.market_alerts (active) WHERE active = true;
