import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

interface FMPRatio {
  symbol: string;
  date: string;
  peRatioTTM: number;
  priceToSalesRatioTTM: number;
  priceToBookRatioTTM: number;
  enterpriseValueOverEBITDATTM: number;
  debtEquityRatioTTM: number;
  freeCashFlowPerShareTTM: number;
  priceToFreeCashFlowsRatioTTM: number;
  dividendYieldTTM: number;
  returnOnEquityTTM: number;
  returnOnAssetsTTM: number;
  grossProfitMarginTTM: number;
  operatingProfitMarginTTM: number;
  netProfitMarginTTM: number;
  currentRatioTTM: number;
}

interface FMPKeyMetrics {
  symbol: string;
  date: string;
  revenueGrowth: number;
  netIncomeGrowth: number;
  roic: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  enterpriseValueOverEBITDA: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FMP_API_KEY = Deno.env.get("FMP_API_KEY");
    if (!FMP_API_KEY) {
      throw new Error("FMP_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for specific tickers or fetch all
    let tickers: string[] = [];
    
    if (req.method === "POST") {
      const body = await req.json();
      tickers = body.tickers || [];
    }

    // If no specific tickers, fetch all from database OR use default list
    if (tickers.length === 0) {
      const { data: stocks, error } = await supabase
        .from("stocks")
        .select("ticker")
        .eq("publicly_traded", true);

      if (error) throw error;
      tickers = stocks?.map((s) => s.ticker) || [];
    }

    // If still no tickers (empty database), use a default list of popular stocks
    if (tickers.length === 0) {
      tickers = [
        // AI & Chips
        "NVDA", "AMD", "MSFT", "TSM", "ASML", "AMAT", "LRCX", "KLAC", "MU", "AVGO",
        "INTC", "QCOM", "TXN", "MRVL", "ARM", "GOOGL", "META", "AMZN",
        // Defense
        "LMT", "RTX", "NOC", "GD", "BA", "LHX",
        // Energy & Nuclear
        "XOM", "CVX", "COP", "OXY", "CCJ", "UEC", "LEU", "NNE", "VST", "CEG", "SMR",
        // Space & Drones
        "RKLB", "IRDM", "KTOS", "PLTR", "RCAT", "JOBY", "ACHR",
        // Critical Minerals & Materials
        "MP", "LAC", "ALTM", "ALB", "SQM", "VALE", "RIO", "BHP", "FCX",
        // Robotics & Automation
        "ISRG", "ABB", "ROK", "EMR", "HON", "JCI",
        // Healthcare
        "UNH", "JNJ", "PFE", "ABBV", "LLY", "MRK", "TMO", "DHR", "ABT", "MDT",
        // Other Tech
        "AAPL", "CRM", "ORCL", "IBM", "SNOW", "PANW", "CRWD", "ZS", "NET", "DDOG"
      ];
    }

    // FMP allows batch quotes (up to 100 at a time)
    const batchSize = 100;
    const updates: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const tickerString = batch.join(",");

      // Fetch batch quotes
      const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${tickerString}?apikey=${FMP_API_KEY}`;
      const quoteRes = await fetch(quoteUrl);
      
      if (!quoteRes.ok) {
        errors.push(`Quote fetch failed for batch ${i}: ${quoteRes.statusText}`);
        continue;
      }

      const quotes: FMPQuote[] = await quoteRes.json();

      // Fetch ratios for each ticker in batch
      for (const quote of quotes) {
        try {
          // Get TTM ratios
          const ratioUrl = `https://financialmodelingprep.com/api/v3/ratios-ttm/${quote.symbol}?apikey=${FMP_API_KEY}`;
          const ratioRes = await fetch(ratioUrl);
          const ratios: FMPRatio[] = ratioRes.ok ? await ratioRes.json() : [];
          const ratio = ratios[0] || {};

          // Get key metrics for growth data
          const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${quote.symbol}?apikey=${FMP_API_KEY}`;
          const metricsRes = await fetch(metricsUrl);
          const metrics: any[] = metricsRes.ok ? await metricsRes.json() : [];
          const metric = metrics[0] || {};

          // Get analyst estimates for forward PE
          const estimateUrl = `https://financialmodelingprep.com/api/v3/analyst-estimates/${quote.symbol}?limit=1&apikey=${FMP_API_KEY}`;
          const estimateRes = await fetch(estimateUrl);
          const estimates: any[] = estimateRes.ok ? await estimateRes.json() : [];
          const estimate = estimates[0] || {};
          
          // Calculate forward PE
          const forwardPE = estimate.estimatedEpsAvg && estimate.estimatedEpsAvg > 0
            ? quote.price / estimate.estimatedEpsAvg
            : null;

          updates.push({
            ticker: quote.symbol,
            name: quote.name,
            price: quote.price,
            price_change: quote.change,
            price_change_percent: quote.changesPercentage,
            market_cap: quote.marketCap,
            pe_ratio: quote.pe > 0 ? quote.pe : null,
            forward_pe: forwardPE,
            ev_ebitda: ratio.enterpriseValueOverEBITDATTM || metric.enterpriseValueOverEBITDATTM || null,
            price_fcf: ratio.priceToFreeCashFlowsRatioTTM || null,
            price_sales: ratio.priceToSalesRatioTTM || null,
            debt_equity: ratio.debtEquityRatioTTM || metric.debtToEquityTTM || null,
            dividend_yield: ratio.dividendYieldTTM || null,
            gross_margin: ratio.grossProfitMarginTTM || null,
            operating_margin: ratio.operatingProfitMarginTTM || null,
            fcf_margin: null, // Calculated separately if needed
            revenue_growth: metric.revenueGrowthTTM || null,
            roic: metric.roicTTM || null,
            beta: null, // Need separate endpoint
            exchange: quote.exchange,
            last_updated: new Date().toISOString(),
            data_freshness: "live",
          });
        } catch (tickerError) {
          errors.push(`Error processing ${quote.symbol}: ${tickerError}`);
        }
      }

      // Small delay to avoid rate limiting
      if (i + batchSize < tickers.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Upsert all updates to database (insert or update)
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("stocks")
        .upsert(
          { 
            ...update,
            publicly_traded: true,
            composite_score: 50, // Default score for new stocks
          }, 
          { onConflict: "ticker" }
        );

      if (error) {
        errors.push(`DB upsert failed for ${update.ticker}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: tickers.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-stock-prices:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
