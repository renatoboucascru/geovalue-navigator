import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

// Fetch stocks from Supabase database
export function useStocksFromDB() {
  return useQuery({
    queryKey: ['stocks-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stocks')
        .select(`
          *,
          stock_sectors(sector_id, sectors(name)),
          stock_themes(theme_id, themes(name))
        `)
        .eq('publicly_traded', true);

      if (error) throw error;
      
      // Transform to match Stock type
      return data.map((stock): Stock => ({
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        country: stock.country || 'US',
        exchange: stock.exchange || 'NYSE',
        sectors: stock.stock_sectors?.map((ss: any) => ss.sectors?.name).filter(Boolean) || ['Technology'],
        roles: stock.roles || [],
        stockType: stock.roles?.includes('supplier') ? 'supplier' : 
                   stock.roles?.includes('standalone') ? 'standalone' : 'leader',
        valueChainLayer: (stock.roles?.[0] as any) || 'Other',
        price: stock.price,
        priceChange: stock.price_change,
        priceChangePercent: stock.price_change_percent,
        marketCap: stock.market_cap,
        peRatio: stock.pe_ratio,
        forwardPE: stock.forward_pe,
        evEbitda: stock.ev_ebitda,
        priceFCF: stock.price_fcf,
        priceSales: stock.price_sales,
        debtEquity: stock.debt_equity,
        dividendYield: stock.dividend_yield,
        beta: stock.beta,
        grossMargin: stock.gross_margin,
        operatingMargin: stock.operating_margin,
        fcfMargin: stock.fcf_margin,
        revenueGrowth: stock.revenue_growth,
        roic: stock.roic,
        netDebtEBITDA: stock.net_debt_ebitda,
        confidence: (stock.confidence as any) || 'medium',
        publiclyTraded: stock.publicly_traded ?? true,
        geoConcentrationRisk: stock.geo_concentration_risk ?? 2,
        scenarioTailwind: stock.scenario_tailwind ?? 3,
        valuationFlag: (stock.valuation_flag as any) || 'na',
        compositeScore: stock.composite_score ?? 50,
        evidenceUrl: stock.evidence_url,
        notes: stock.notes,
        iranGulfCategory: stock.iran_gulf_category as any,
        valuationBasis: stock.valuation_basis,
        dataFreshness: stock.data_freshness,
        lastUpdated: stock.last_updated,
        mappingCompleteness: 80,
        edgesCount: 3,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Trigger price refresh via edge function
export function useRefreshPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tickers?: string[]) => {
      const { data, error } = await supabase.functions.invoke('fetch-stock-prices', {
        body: { tickers },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stocks-db'] });
      toast.success(`Updated ${data.updated} stock prices`);
    },
    onError: (error) => {
      toast.error(`Failed to refresh prices: ${error.message}`);
    },
  });
}

// Get last update timestamp
export function useLastPriceUpdate() {
  return useQuery({
    queryKey: ['last-price-update'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stocks')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data?.last_updated;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
