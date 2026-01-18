-- =============================================
-- GeoValue Screener v2.0 Database Schema
-- =============================================

-- 1. Create app_role enum for admin/user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. User roles table (required for admin access control)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Sectors table (taxonomy)
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- 6. Themes table (for scenarios like Iran/Gulf)
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_scenario BOOLEAN DEFAULT FALSE,
  tailwind_scores JSONB DEFAULT '{}',
  notes TEXT,
  risk_caveats TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- 7. Stocks table (core reference data)
CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT,
  exchange TEXT,
  roles TEXT[] DEFAULT '{}',
  
  -- Market data (cached from API)
  price DECIMAL,
  price_change DECIMAL,
  price_change_percent DECIMAL,
  market_cap BIGINT,
  
  -- Valuation metrics
  pe_ratio DECIMAL,
  forward_pe DECIMAL,
  ev_ebitda DECIMAL,
  price_fcf DECIMAL,
  price_sales DECIMAL,
  
  -- Fundamentals
  debt_equity DECIMAL,
  dividend_yield DECIMAL,
  beta DECIMAL,
  revenue_growth DECIMAL,
  gross_margin DECIMAL,
  operating_margin DECIMAL,
  fcf_margin DECIMAL,
  net_debt_ebitda DECIMAL,
  roic DECIMAL,
  
  -- Scoring
  valuation_flag TEXT CHECK (valuation_flag IN ('green', 'yellow', 'red', 'na')),
  valuation_basis TEXT,
  composite_score DECIMAL,
  
  -- Relationship data
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  publicly_traded BOOLEAN DEFAULT TRUE,
  geo_concentration_risk INT CHECK (geo_concentration_risk BETWEEN 1 AND 5),
  scenario_tailwind INT CHECK (scenario_tailwind BETWEEN 0 AND 5),
  
  -- Iran/Gulf scenario
  iran_gulf_category TEXT,
  
  -- Metadata
  data_freshness TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Index for ticker lookups
CREATE INDEX idx_stocks_ticker ON public.stocks(ticker);

-- 8. Stock-Sector junction table
CREATE TABLE public.stock_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(stock_id, sector_id)
);
ALTER TABLE public.stock_sectors ENABLE ROW LEVEL SECURITY;

-- 9. Stock-Theme junction table
CREATE TABLE public.stock_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.themes(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(stock_id, theme_id)
);
ALTER TABLE public.stock_themes ENABLE ROW LEVEL SECURITY;

-- 10. Supplier mappings (customer → supplier relationships)
CREATE TABLE public.supplier_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  supplier_role TEXT NOT NULL,
  value_chain_layer TEXT,
  dependency_strength INT CHECK (dependency_strength BETWEEN 1 AND 5),
  geo_concentration_risk INT CHECK (geo_concentration_risk BETWEEN 1 AND 5),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  publicly_traded BOOLEAN DEFAULT TRUE,
  notes TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  evidence_type TEXT,
  last_verified_date TIMESTAMPTZ,
  needs_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, supplier_id, supplier_role)
);
ALTER TABLE public.supplier_mappings ENABLE ROW LEVEL SECURITY;

-- Indexes for supplier lookups
CREATE INDEX idx_supplier_mappings_customer ON public.supplier_mappings(customer_id);
CREATE INDEX idx_supplier_mappings_supplier ON public.supplier_mappings(supplier_id);

-- 11. Valuation thresholds (per sector/theme)
CREATE TABLE public.valuation_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.themes(id) ON DELETE CASCADE,
  green_max_pe DECIMAL,
  yellow_max_pe DECIMAL,
  green_max_forward_pe DECIMAL,
  yellow_max_forward_pe DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sector_id IS NOT NULL OR theme_id IS NOT NULL)
);
ALTER TABLE public.valuation_thresholds ENABLE ROW LEVEL SECURITY;

-- 12. User portfolios
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  risk_profile TEXT CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_portfolios_user ON public.portfolios(user_id);

-- 13. Portfolio holdings
CREATE TABLE public.portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  shares DECIMAL DEFAULT 0,
  cost_basis DECIMAL,
  target_allocation_pct DECIMAL,
  target_allocation_usd DECIMAL,
  locked BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, stock_id)
);
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_holdings_portfolio ON public.portfolio_holdings(portfolio_id);

-- 14. User watchlists
CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);

-- 15. Watchlist items with alert triggers
CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  alert_on_green BOOLEAN DEFAULT FALSE,
  alert_on_price_drop_pct DECIMAL,
  alert_on_beta_exceeds DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, stock_id)
);
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- 16. User alerts (triggered notifications)
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_alerts_user ON public.user_alerts(user_id);

-- 17. Saved screens/filters
CREATE TABLE public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_saved_filters_user ON public.saved_filters(user_id);

-- =============================================
-- RLS Policies
-- =============================================

-- User roles: users can view their own, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can manage their own
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Sectors: public read, admin write
CREATE POLICY "Anyone can read sectors" ON public.sectors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sectors" ON public.sectors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Themes: public read, admin write
CREATE POLICY "Anyone can read themes" ON public.themes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage themes" ON public.themes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Stocks: public read, admin write
CREATE POLICY "Anyone can read stocks" ON public.stocks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stocks" ON public.stocks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Stock-Sectors: public read, admin write
CREATE POLICY "Anyone can read stock_sectors" ON public.stock_sectors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stock_sectors" ON public.stock_sectors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Stock-Themes: public read, admin write
CREATE POLICY "Anyone can read stock_themes" ON public.stock_themes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stock_themes" ON public.stock_themes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Supplier mappings: public read, admin write
CREATE POLICY "Anyone can read supplier_mappings" ON public.supplier_mappings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage supplier_mappings" ON public.supplier_mappings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Valuation thresholds: public read, admin write
CREATE POLICY "Anyone can read valuation_thresholds" ON public.valuation_thresholds
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage valuation_thresholds" ON public.valuation_thresholds
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Portfolios: users own their portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio holdings: accessible via portfolio ownership
CREATE POLICY "Users can view own holdings" ON public.portfolio_holdings
  FOR SELECT USING (
    portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own holdings" ON public.portfolio_holdings
  FOR INSERT WITH CHECK (
    portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own holdings" ON public.portfolio_holdings
  FOR UPDATE USING (
    portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own holdings" ON public.portfolio_holdings
  FOR DELETE USING (
    portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
  );

-- Watchlists: users own their watchlists
CREATE POLICY "Users can view own watchlists" ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists" ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON public.watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist items: accessible via watchlist ownership
CREATE POLICY "Users can view own watchlist items" ON public.watchlist_items
  FOR SELECT USING (
    watchlist_id IN (SELECT id FROM public.watchlists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own watchlist items" ON public.watchlist_items
  FOR INSERT WITH CHECK (
    watchlist_id IN (SELECT id FROM public.watchlists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own watchlist items" ON public.watchlist_items
  FOR UPDATE USING (
    watchlist_id IN (SELECT id FROM public.watchlists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own watchlist items" ON public.watchlist_items
  FOR DELETE USING (
    watchlist_id IN (SELECT id FROM public.watchlists WHERE user_id = auth.uid())
  );

-- User alerts: private to user
CREATE POLICY "Users can view own alerts" ON public.user_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.user_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.user_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.user_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Saved filters: private to user
CREATE POLICY "Users can view own saved_filters" ON public.saved_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_filters" ON public.saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_filters" ON public.saved_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_filters" ON public.saved_filters
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON public.portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_mappings_updated_at
  BEFORE UPDATE ON public.supplier_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_valuation_thresholds_updated_at
  BEFORE UPDATE ON public.valuation_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Auto-create profile on user signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Also create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default watchlist
  INSERT INTO public.watchlists (user_id, name)
  VALUES (NEW.id, 'My Watchlist');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();