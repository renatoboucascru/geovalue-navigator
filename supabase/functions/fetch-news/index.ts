import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FINNHUB_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let ticker = "";
    if (req.method === "POST") {
      const body = await req.json();
      ticker = body.ticker?.toUpperCase() || "";
    } else {
      const url = new URL(req.url);
      ticker = url.searchParams.get("ticker")?.toUpperCase() || "";
    }

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: "Ticker is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache - return cached news if fresh (< 15 minutes)
    const cacheThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: cachedNews } = await supabase
      .from("news_items")
      .select("*")
      .eq("ticker", ticker)
      .gte("fetched_at", cacheThreshold)
      .order("published_at", { ascending: false })
      .limit(20);

    if (cachedNews && cachedNews.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          ticker,
          news: cachedNews,
          cached: true,
          cachedAt: cachedNews[0].fetched_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from Finnhub
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];
    
    const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(newsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Update provider status
      await supabase.from("api_provider_status").upsert(
        {
          provider: "finnhub",
          last_error_at: new Date().toISOString(),
          last_error_message: errorText,
        },
        { onConflict: "provider" }
      );
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch news from Finnhub",
          status: response.status,
          details: errorText.slice(0, 200),
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finnhubNews: FinnhubNews[] = await response.json();

    // Store in database
    const newsItems = finnhubNews.slice(0, 30).map((item) => ({
      ticker,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image_url: item.image,
      published_at: new Date(item.datetime * 1000).toISOString(),
      related_tickers: item.related ? item.related.split(",") : [],
      category: item.category,
      fetched_at: new Date().toISOString(),
    }));

    // Delete old news for this ticker, keep fresh
    await supabase
      .from("news_items")
      .delete()
      .eq("ticker", ticker)
      .lt("fetched_at", cacheThreshold);

    // Insert new news
    if (newsItems.length > 0) {
      await supabase.from("news_items").insert(newsItems);
    }

    // Update provider success
    await supabase.from("api_provider_status").upsert(
      {
        provider: "finnhub",
        last_success_at: new Date().toISOString(),
        last_error_message: null,
      },
      { onConflict: "provider" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        ticker,
        news: newsItems,
        cached: false,
        count: newsItems.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-news:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
