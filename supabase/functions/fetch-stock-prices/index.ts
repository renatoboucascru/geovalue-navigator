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

interface ProviderStatus {
  provider: string;
  isWorking: boolean;
  lastError?: string;
  statusCode?: number;
}

// Error type detection for FMP
function classifyFMPError(status: number, body: string): { type: string; message: string } {
  if (status === 401 || body.includes("Invalid API KEY")) {
    return { type: "invalid_key", message: "API key is invalid or expired" };
  }
  if (status === 403) {
    return { type: "forbidden", message: "API key lacks required permissions or plan upgrade needed" };
  }
  if (status === 429 || body.includes("rate limit") || body.includes("limit reached")) {
    return { type: "rate_limit", message: "Rate limit exceeded - please wait and retry" };
  }
  if (status >= 500) {
    return { type: "server_error", message: "FMP server error - service temporarily unavailable" };
  }
  return { type: "unknown", message: body || "Unknown error occurred" };
}

// Validate and sanitize API key
function sanitizeApiKey(key: string | undefined): string | null {
  if (!key) return null;
  // Remove whitespace, quotes, newlines that might be accidentally included
  const sanitized = key.trim().replace(/['"]/g, "").replace(/\s/g, "");
  if (sanitized.length === 0) return null;
  return sanitized;
}

// Update provider status in database
async function updateProviderStatus(
  supabase: any,
  provider: string,
  success: boolean,
  errorMessage?: string
) {
  const now = new Date().toISOString();
  
  await supabase.from("api_provider_status").upsert(
    {
      provider,
      last_success_at: success ? now : undefined,
      last_error_at: success ? undefined : now,
      last_error_message: success ? null : errorMessage,
      total_calls: supabase.rpc ? 1 : 1, // Will increment via trigger if set up
      updated_at: now,
    },
    { onConflict: "provider" }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    provider: "fmp",
    keyExists: false,
    keyMasked: null,
    endpointCalled: null,
    statusCode: null,
    errorType: null,
  };

  try {
    // Get and validate API key
    const rawApiKey = Deno.env.get("FMP_API_KEY");
    const FMP_API_KEY = sanitizeApiKey(rawApiKey);
    
    diagnostics.keyExists = !!FMP_API_KEY;
    if (FMP_API_KEY) {
      diagnostics.keyMasked = `${FMP_API_KEY.slice(0, 4)}...${FMP_API_KEY.slice(-4)}`;
    }

    if (!FMP_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "FMP_API_KEY not configured",
          errorType: "missing_key",
          diagnostics,
          help: "Add FMP_API_KEY to your secrets in the backend settings",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for specific tickers or fetch all
    let tickers: string[] = [];
    let includeVolumeData = false;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        tickers = body.tickers || [];
        includeVolumeData = body.includeVolumeData || false;
      } catch {
        // Empty body is OK
      }
    }

    // If no specific tickers, fetch all from database
    if (tickers.length === 0) {
      const { data: stocks, error } = await supabase
        .from("stocks")
        .select("ticker")
        .eq("publicly_traded", true);

      if (error) throw error;
      tickers = stocks?.map((s: any) => s.ticker) || [];
    }

    // If still no tickers (empty database), use a default list
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

    // FMP batch quotes (up to 100 at a time)
    const batchSize = 50; // Reduced for rate limiting
    const updates: any[] = [];
    const errors: string[] = [];
    let apiCallCount = 0;

    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const tickerString = batch.join(",");
      
      // Fetch batch quotes
      const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${tickerString}?apikey=${FMP_API_KEY}`;
      diagnostics.endpointCalled = quoteUrl.replace(FMP_API_KEY, "[REDACTED]");
      
      const quoteRes = await fetch(quoteUrl);
      apiCallCount++;
      diagnostics.statusCode = quoteRes.status;

      if (!quoteRes.ok) {
        const errorBody = await quoteRes.text();
        const errorInfo = classifyFMPError(quoteRes.status, errorBody);
        diagnostics.errorType = errorInfo.type;
        
        await updateProviderStatus(supabase, "fmp", false, errorInfo.message);
        
        // For auth errors, fail fast with clear message
        if (errorInfo.type === "invalid_key" || errorInfo.type === "forbidden") {
          return new Response(
            JSON.stringify({
              error: errorInfo.message,
              errorType: errorInfo.type,
              diagnostics,
              help: errorInfo.type === "invalid_key" 
                ? "Your FMP API key appears to be invalid. Please verify and update it in backend secrets."
                : "Your FMP plan may not include this endpoint. Check your subscription.",
            }),
            { status: quoteRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        errors.push(`Batch ${i}: ${errorInfo.message}`);
        continue;
      }

      let quotes: FMPQuote[];
      try {
        const responseText = await quoteRes.text();
        // Check for error response that comes as 200
        if (responseText.includes("Error Message") || responseText.includes("Invalid API KEY")) {
          const errorInfo = classifyFMPError(401, responseText);
          diagnostics.errorType = errorInfo.type;
          await updateProviderStatus(supabase, "fmp", false, errorInfo.message);
          
          return new Response(
            JSON.stringify({
              error: errorInfo.message,
              errorType: errorInfo.type,
              diagnostics,
              rawResponse: responseText.slice(0, 200),
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        quotes = JSON.parse(responseText);
      } catch (parseError) {
        errors.push(`Failed to parse response for batch ${i}`);
        continue;
      }

      // Process each quote
      for (const quote of quotes) {
        try {
          // Calculate volume metrics
          const avgVolume = quote.avgVolume || 0;
          const currentVolume = quote.volume || 0;
          const relativeVolume = avgVolume > 0 ? currentVolume / avgVolume : null;
          const dollarVolume = currentVolume * quote.price;
          const dayRangePercent = quote.previousClose > 0 
            ? ((quote.dayHigh - quote.dayLow) / quote.previousClose) * 100 
            : null;

          // Get ratios if we have time (skip for large batches to avoid rate limits)
          let ratio: any = {};
          let forwardPE: number | null = null;

          if (tickers.length <= 20) {
            // Get TTM ratios
            const ratioUrl = `https://financialmodelingprep.com/api/v3/ratios-ttm/${quote.symbol}?apikey=${FMP_API_KEY}`;
            const ratioRes = await fetch(ratioUrl);
            apiCallCount++;
            
            if (ratioRes.ok) {
              const ratios = await ratioRes.json();
              ratio = ratios[0] || {};
            }

            // Get forward estimates
            const estimateUrl = `https://financialmodelingprep.com/api/v3/analyst-estimates/${quote.symbol}?limit=1&apikey=${FMP_API_KEY}`;
            const estimateRes = await fetch(estimateUrl);
            apiCallCount++;
            
            if (estimateRes.ok) {
              const estimates = await estimateRes.json();
              const estimate = estimates[0] || {};
              if (estimate.estimatedEpsAvg && estimate.estimatedEpsAvg > 0) {
                forwardPE = quote.price / estimate.estimatedEpsAvg;
              }
            }
          }

          updates.push({
            ticker: quote.symbol,
            name: quote.name,
            price: quote.price,
            price_change: quote.change,
            price_change_percent: quote.changesPercentage,
            market_cap: quote.marketCap,
            pe_ratio: quote.pe > 0 ? quote.pe : null,
            forward_pe: forwardPE,
            ev_ebitda: ratio.enterpriseValueOverEBITDATTM || null,
            price_fcf: ratio.priceToFreeCashFlowsRatioTTM || null,
            price_sales: ratio.priceToSalesRatioTTM || null,
            debt_equity: ratio.debtEquityRatioTTM || null,
            dividend_yield: ratio.dividendYieldTTM || null,
            gross_margin: ratio.grossProfitMarginTTM || null,
            operating_margin: ratio.operatingProfitMarginTTM || null,
            exchange: quote.exchange,
            // Volume data for Trader Mode
            volume: currentVolume,
            avg_volume_10d: avgVolume, // FMP provides avgVolume as 10-day
            relative_volume: relativeVolume,
            dollar_volume: dollarVolume,
            day_range_percent: dayRangePercent,
            last_updated: new Date().toISOString(),
            data_freshness: "live",
          });
        } catch (tickerError) {
          errors.push(`Error processing ${quote.symbol}: ${tickerError}`);
        }
      }

      // Rate limit delay between batches
      if (i + batchSize < tickers.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Upsert all updates to database
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("stocks")
        .upsert(
          { 
            ...update,
            publicly_traded: true,
            composite_score: 50,
          }, 
          { onConflict: "ticker" }
        );

      if (error) {
        errors.push(`DB upsert failed for ${update.ticker}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    // Update success status
    await updateProviderStatus(supabase, "fmp", true);

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: tickers.length,
        apiCalls: apiCallCount,
        durationMs: duration,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
        diagnostics: {
          ...diagnostics,
          statusCode: 200,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-stock-prices:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        errorType: "server_error",
        diagnostics,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
