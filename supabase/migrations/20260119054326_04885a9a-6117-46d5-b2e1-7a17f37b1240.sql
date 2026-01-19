-- ==========================================
-- GEOVALUE SCREENER V2.0 - SIGNALS & PORTFOLIO EXPANSION
-- ==========================================

-- ==========================================
-- PRIVATE BETS (Billionaire/VC backed private companies)
-- ==========================================
CREATE TABLE public.private_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  tech_category TEXT NOT NULL, -- 'Geothermal', 'Fusion', 'LDES', 'Nuclear', etc.
  description TEXT,
  thesis TEXT,
  key_investors TEXT[] DEFAULT '{}',
  confidence TEXT DEFAULT 'medium', -- high/medium/low
  status TEXT DEFAULT 'active', -- active/acquired/ipo/defunct
  funding_stage TEXT, -- 'Series A', 'Series B', etc.
  last_funding_date DATE,
  last_funding_amount BIGINT,
  headquarters TEXT,
  website_url TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on private_bets
ALTER TABLE public.private_bets ENABLE ROW LEVEL SECURITY;

-- Anyone can read private_bets (public data)
CREATE POLICY "Anyone can read private_bets"
  ON public.private_bets FOR SELECT
  USING (true);

-- Admins can manage private_bets
CREATE POLICY "Admins can manage private_bets"
  ON public.private_bets FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ==========================================
-- PUBLIC PROXIES (Public companies that benefit from private bets)
-- ==========================================
CREATE TABLE public.public_proxies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  private_bet_id UUID NOT NULL REFERENCES public.private_bets(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'proxy', 'supplier', 'competitor', 'partner'
  exposure_category TEXT, -- 'drilling/services', 'power electronics', 'grid', 'specialty metals', etc.
  exposure_strength INTEGER DEFAULT 3, -- 1-5
  thesis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(private_bet_id, stock_id)
);

-- Enable RLS on public_proxies
ALTER TABLE public.public_proxies ENABLE ROW LEVEL SECURITY;

-- Anyone can read public_proxies
CREATE POLICY "Anyone can read public_proxies"
  ON public.public_proxies FOR SELECT
  USING (true);

-- Admins can manage public_proxies
CREATE POLICY "Admins can manage public_proxies"
  ON public.public_proxies FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ==========================================
-- WHALE 13F FILERS (Institutional investors to track)
-- ==========================================
CREATE TABLE public.whale_filers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cik TEXT UNIQUE, -- SEC Central Index Key
  filing_manager_name TEXT,
  description TEXT,
  focus_areas TEXT[] DEFAULT '{}', -- 'tech', 'energy', 'climate', etc.
  aum_billions DECIMAL,
  is_active BOOLEAN DEFAULT true,
  last_filing_date DATE,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on whale_filers
ALTER TABLE public.whale_filers ENABLE ROW LEVEL SECURITY;

-- Anyone can read whale_filers
CREATE POLICY "Anyone can read whale_filers"
  ON public.whale_filers FOR SELECT
  USING (true);

-- Admins can manage whale_filers
CREATE POLICY "Admins can manage whale_filers"
  ON public.whale_filers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ==========================================
-- WHALE 13F HOLDINGS (Parsed 13F positions)
-- ==========================================
CREATE TABLE public.whale_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filer_id UUID NOT NULL REFERENCES public.whale_filers(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  company_name TEXT,
  shares BIGINT NOT NULL DEFAULT 0,
  value_usd BIGINT NOT NULL DEFAULT 0,
  shares_change BIGINT DEFAULT 0, -- QoQ change
  value_change BIGINT DEFAULT 0,
  change_type TEXT, -- 'new', 'increased', 'decreased', 'sold', 'unchanged'
  percent_of_portfolio DECIMAL,
  filing_quarter TEXT, -- 'Q4 2024', 'Q1 2025', etc.
  filing_date DATE,
  report_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on whale_holdings
ALTER TABLE public.whale_holdings ENABLE ROW LEVEL SECURITY;

-- Anyone can read whale_holdings
CREATE POLICY "Anyone can read whale_holdings"
  ON public.whale_holdings FOR SELECT
  USING (true);

-- Admins can manage whale_holdings
CREATE POLICY "Admins can manage whale_holdings"
  ON public.whale_holdings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ==========================================
-- BROKERAGE CONNECTIONS (Plaid/manual connections)
-- ==========================================
CREATE TABLE public.brokerage_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_name TEXT NOT NULL, -- 'Robinhood', 'Fidelity', etc.
  institution_id TEXT, -- Plaid institution ID
  connection_type TEXT NOT NULL DEFAULT 'manual', -- 'plaid', 'manual', 'csv_import'
  plaid_item_id TEXT, -- Encrypted/tokenized
  plaid_access_token TEXT, -- Encrypted, stored server-side only
  status TEXT DEFAULT 'active', -- 'active', 'disconnected', 'error'
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on brokerage_connections
ALTER TABLE public.brokerage_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own brokerage_connections"
  ON public.brokerage_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brokerage_connections"
  ON public.brokerage_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brokerage_connections"
  ON public.brokerage_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brokerage_connections"
  ON public.brokerage_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- BROKERAGE HOLDINGS (Synced positions)
-- ==========================================
CREATE TABLE public.brokerage_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.brokerage_connections(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  name TEXT,
  quantity DECIMAL NOT NULL DEFAULT 0,
  cost_basis_per_share DECIMAL,
  current_price DECIMAL,
  current_value DECIMAL,
  unrealized_pl DECIMAL,
  unrealized_pl_percent DECIMAL,
  asset_type TEXT DEFAULT 'equity', -- 'equity', 'etf', 'crypto', 'option'
  is_crypto BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on brokerage_holdings
ALTER TABLE public.brokerage_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brokerage_holdings"
  ON public.brokerage_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brokerage_holdings"
  ON public.brokerage_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brokerage_holdings"
  ON public.brokerage_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brokerage_holdings"
  ON public.brokerage_holdings FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- BROKERAGE TRANSACTIONS (Buy/sell history)
-- ==========================================
CREATE TABLE public.brokerage_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.brokerage_connections(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES public.brokerage_holdings(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'dividend', 'transfer_in', 'transfer_out'
  quantity DECIMAL NOT NULL,
  price_per_share DECIMAL,
  total_amount DECIMAL,
  fees DECIMAL DEFAULT 0,
  transaction_date DATE NOT NULL,
  settlement_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on brokerage_transactions
ALTER TABLE public.brokerage_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brokerage_transactions"
  ON public.brokerage_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brokerage_transactions"
  ON public.brokerage_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brokerage_transactions"
  ON public.brokerage_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brokerage_transactions"
  ON public.brokerage_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- USER SIGNAL PREFERENCES
-- ==========================================
CREATE TABLE public.user_signal_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enable_whale_signal_boost BOOLEAN DEFAULT true,
  tracked_filer_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_signal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signal_preferences"
  ON public.user_signal_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal_preferences"
  ON public.user_signal_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signal_preferences"
  ON public.user_signal_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_private_bets_category ON public.private_bets(tech_category);
CREATE INDEX idx_public_proxies_private_bet ON public.public_proxies(private_bet_id);
CREATE INDEX idx_public_proxies_stock ON public.public_proxies(stock_id);
CREATE INDEX idx_whale_holdings_filer ON public.whale_holdings(filer_id);
CREATE INDEX idx_whale_holdings_quarter ON public.whale_holdings(filing_quarter);
CREATE INDEX idx_brokerage_holdings_user ON public.brokerage_holdings(user_id);
CREATE INDEX idx_brokerage_transactions_user ON public.brokerage_transactions(user_id);
CREATE INDEX idx_brokerage_transactions_date ON public.brokerage_transactions(transaction_date);

-- ==========================================
-- UPDATE TRIGGERS
-- ==========================================
CREATE TRIGGER update_private_bets_updated_at
  BEFORE UPDATE ON public.private_bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whale_filers_updated_at
  BEFORE UPDATE ON public.whale_filers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brokerage_connections_updated_at
  BEFORE UPDATE ON public.brokerage_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_signal_preferences_updated_at
  BEFORE UPDATE ON public.user_signal_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();