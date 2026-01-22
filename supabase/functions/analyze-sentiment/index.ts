import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ticker, sourceType = "news" } = await req.json();

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: "Ticker is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for recent sentiment (cache for 30 minutes)
    const cacheThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: cachedSentiment } = await supabase
      .from("sentiment_scores")
      .select("*")
      .eq("ticker", ticker)
      .eq("source_type", sourceType)
      .gte("created_at", cacheThreshold)
      .order("created_at", { ascending: false })
      .limit(1);

    if (cachedSentiment && cachedSentiment.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sentiment: cachedSentiment[0],
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get content to analyze based on source type
    let contentToAnalyze: string[] = [];
    let itemCount = 0;

    if (sourceType === "news") {
      const { data: news } = await supabase
        .from("news_items")
        .select("headline, summary")
        .eq("ticker", ticker)
        .order("published_at", { ascending: false })
        .limit(15);

      if (news && news.length > 0) {
        contentToAnalyze = news.map((n) => `${n.headline}. ${n.summary || ""}`);
        itemCount = news.length;
      }
    } else {
      // Comments
      const { data: comments } = await supabase
        .from("ticker_comments")
        .select("content")
        .eq("ticker", ticker)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(30);

      if (comments && comments.length > 0) {
        contentToAnalyze = comments.map((c) => c.content);
        itemCount = comments.length;
      }
    }

    if (contentToAnalyze.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sentiment: null,
          message: `No ${sourceType} found for ${ticker}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI for sentiment analysis
    const systemPrompt = `You are a financial sentiment analyst. Analyze the provided ${sourceType} about ${ticker} stock and determine the overall sentiment.

Return your analysis using the suggest_sentiment function.`;

    const userPrompt = `Analyze the following ${sourceType} items for ${ticker}:

${contentToAnalyze.map((item, i) => `${i + 1}. ${item}`).join("\n\n")}

Determine the overall sentiment and provide key insights.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_sentiment",
              description: "Return sentiment analysis results",
              parameters: {
                type: "object",
                properties: {
                  sentiment: {
                    type: "string",
                    enum: ["bullish", "neutral", "bearish"],
                    description: "Overall sentiment",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence percentage 0-100",
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the analysis (1-2 sentences)",
                  },
                  key_drivers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key positive factors (2-4 items)",
                  },
                  risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key risks or negative factors (2-4 items)",
                  },
                },
                required: ["sentiment", "confidence", "summary", "key_drivers", "risks"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_sentiment" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", errorText);
      
      // Check for rate limit or payment errors
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add credits to continue" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const sentimentData = JSON.parse(toolCall.function.arguments);

    // Store sentiment in database
    const sentimentRecord = {
      ticker,
      source_type: sourceType,
      sentiment: sentimentData.sentiment,
      confidence: Math.min(100, Math.max(0, sentimentData.confidence)),
      summary: sentimentData.summary,
      key_drivers: sentimentData.key_drivers || [],
      risks: sentimentData.risks || [],
      analyzed_items_count: itemCount,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const { data: insertedSentiment, error: insertError } = await supabase
      .from("sentiment_scores")
      .insert(sentimentRecord)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store sentiment:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentiment: insertedSentiment || sentimentRecord,
        cached: false,
        analyzedItems: itemCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
