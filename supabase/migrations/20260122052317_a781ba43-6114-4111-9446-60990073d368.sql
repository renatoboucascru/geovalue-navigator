-- ===================================================
-- GeoValue Screener v2.2: Database Schema Migration
-- Paper Trading, News, Comments, Sentiment, Volume Data
-- ===================================================

-- 1. Add volume/trader mode columns to stocks table
ALTER TABLE public.stocks
ADD COLUMN IF NOT EXISTS volume bigint,
ADD COLUMN IF NOT EXISTS avg_volume_10d bigint,
ADD COLUMN IF NOT EXISTS avg_volume_30d bigint,
ADD COLUMN IF NOT EXISTS relative_volume numeric,
ADD COLUMN IF NOT EXISTS dollar_volume bigint,
ADD COLUMN IF NOT EXISTS atr_14 numeric,
ADD COLUMN IF NOT EXISTS day_range_percent numeric,
ADD COLUMN IF NOT EXISTS premarket_change_percent numeric,
ADD COLUMN IF NOT EXISTS afterhours_change_percent numeric;

-- 2. Paper Trading Tables
-- Paper Accounts
CREATE TABLE IF NOT EXISTS public.paper_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Paper Portfolio',
  starting_balance numeric NOT NULL DEFAULT 100000,
  current_cash numeric NOT NULL DEFAULT 100000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Paper Orders
CREATE TABLE IF NOT EXISTS public.paper_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  stock_id uuid REFERENCES public.stocks(id),
  ticker text NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity numeric NOT NULL,
  limit_price numeric,
  filled_price numeric,
  filled_quantity numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  filled_at timestamptz,
  expires_at timestamptz
);

-- Paper Holdings
CREATE TABLE IF NOT EXISTS public.paper_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  stock_id uuid REFERENCES public.stocks(id),
  ticker text NOT NULL,
  shares numeric NOT NULL DEFAULT 0,
  avg_cost_basis numeric NOT NULL DEFAULT 0,
  realized_pl numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, ticker)
);

-- Paper Performance Daily (for equity curve)
CREATE TABLE IF NOT EXISTS public.paper_performance_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_equity numeric NOT NULL,
  cash numeric NOT NULL,
  holdings_value numeric NOT NULL,
  daily_pl numeric DEFAULT 0,
  daily_pl_percent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

-- 3. News & Sentiment Tables
-- News Items (cached from Finnhub)
CREATE TABLE IF NOT EXISTS public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  headline text NOT NULL,
  summary text,
  source text,
  url text,
  image_url text,
  published_at timestamptz NOT NULL,
  related_tickers text[],
  category text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sentiment Scores (AI-generated)
CREATE TABLE IF NOT EXISTS public.sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('news', 'comments')),
  sentiment text NOT NULL CHECK (sentiment IN ('bullish', 'neutral', 'bearish')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  key_drivers text[],
  risks text[],
  summary text,
  analyzed_items_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Comments per ticker
CREATE TABLE IF NOT EXISTS public.ticker_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticker text NOT NULL,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  is_verified_holder boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comment votes (prevent duplicate voting)
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.ticker_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 4. API Provider Status (for diagnostics)
CREATE TABLE IF NOT EXISTS public.api_provider_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  total_calls integer DEFAULT 0,
  successful_calls integer DEFAULT 0,
  failed_calls integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all new tables
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticker_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_provider_status ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Paper Trading (user-owned)
CREATE POLICY "Users can view own paper_accounts" ON public.paper_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paper_accounts" ON public.paper_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paper_accounts" ON public.paper_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paper_accounts" ON public.paper_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own paper_orders" ON public.paper_orders FOR SELECT 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own paper_orders" ON public.paper_orders FOR INSERT 
WITH CHECK (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own paper_orders" ON public.paper_orders FOR UPDATE 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own paper_orders" ON public.paper_orders FOR DELETE 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own paper_holdings" ON public.paper_holdings FOR SELECT 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own paper_holdings" ON public.paper_holdings FOR INSERT 
WITH CHECK (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own paper_holdings" ON public.paper_holdings FOR UPDATE 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own paper_holdings" ON public.paper_holdings FOR DELETE 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own paper_performance_daily" ON public.paper_performance_daily FOR SELECT 
USING (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own paper_performance_daily" ON public.paper_performance_daily FOR INSERT 
WITH CHECK (account_id IN (SELECT id FROM public.paper_accounts WHERE user_id = auth.uid()));

-- 7. RLS Policies for News & Sentiment (public read)
CREATE POLICY "Anyone can read news_items" ON public.news_items FOR SELECT USING (true);
CREATE POLICY "Service can manage news_items" ON public.news_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read sentiment_scores" ON public.sentiment_scores FOR SELECT USING (true);
CREATE POLICY "Service can manage sentiment_scores" ON public.sentiment_scores FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS Policies for Comments
CREATE POLICY "Anyone can read ticker_comments" ON public.ticker_comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Users can insert own ticker_comments" ON public.ticker_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ticker_comments" ON public.ticker_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ticker_comments" ON public.ticker_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage ticker_comments" ON public.ticker_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own comment_votes" ON public.comment_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comment_votes" ON public.comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comment_votes" ON public.comment_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment_votes" ON public.comment_votes FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS Policies for API Status (admin only for write, anyone can read)
CREATE POLICY "Anyone can read api_provider_status" ON public.api_provider_status FOR SELECT USING (true);
CREATE POLICY "Admins can manage api_provider_status" ON public.api_provider_status FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_items_ticker ON public.news_items(ticker);
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON public.news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_scores_ticker ON public.sentiment_scores(ticker);
CREATE INDEX IF NOT EXISTS idx_ticker_comments_ticker ON public.ticker_comments(ticker);
CREATE INDEX IF NOT EXISTS idx_ticker_comments_created_at ON public.ticker_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_orders_account_id ON public.paper_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_holdings_account_id ON public.paper_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_stocks_volume ON public.stocks(volume);
CREATE INDEX IF NOT EXISTS idx_stocks_relative_volume ON public.stocks(relative_volume);

-- 11. Trigger for updated_at
CREATE TRIGGER update_paper_accounts_updated_at BEFORE UPDATE ON public.paper_accounts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paper_holdings_updated_at BEFORE UPDATE ON public.paper_holdings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticker_comments_updated_at BEFORE UPDATE ON public.ticker_comments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_provider_status_updated_at BEFORE UPDATE ON public.api_provider_status 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insert default provider status records
INSERT INTO public.api_provider_status (provider, is_active) VALUES 
  ('fmp', true),
  ('finnhub', true)
ON CONFLICT (provider) DO NOTHING;