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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create_account": {
        const { name = "Paper Portfolio", starting_balance = 100000 } = body;
        
        const { data: account, error } = await supabase
          .from("paper_accounts")
          .insert({
            user_id: user.id,
            name,
            starting_balance,
            current_cash: starting_balance,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, account }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "place_order": {
        const { account_id, ticker, side, quantity, order_type = "market", limit_price } = body;

        // Validate inputs
        if (!account_id || !ticker || !side || !quantity) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: account_id, ticker, side, quantity" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account
        const { data: account, error: accountError } = await supabase
          .from("paper_accounts")
          .select("*")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get current stock price
        const { data: stock } = await supabase
          .from("stocks")
          .select("price, ticker, name")
          .eq("ticker", ticker.toUpperCase())
          .single();

        const currentPrice = stock?.price || limit_price;
        if (!currentPrice) {
          return new Response(
            JSON.stringify({ error: `Cannot determine price for ${ticker}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const fillPrice = order_type === "limit" ? limit_price : currentPrice;
        const totalCost = fillPrice * quantity;

        // For buy orders, check cash
        if (side === "buy" && totalCost > account.current_cash) {
          return new Response(
            JSON.stringify({ 
              error: "Insufficient funds",
              available: account.current_cash,
              required: totalCost,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // For sell orders, check holdings
        if (side === "sell") {
          const { data: holding } = await supabase
            .from("paper_holdings")
            .select("shares")
            .eq("account_id", account_id)
            .eq("ticker", ticker.toUpperCase())
            .single();

          if (!holding || holding.shares < quantity) {
            return new Response(
              JSON.stringify({ 
                error: "Insufficient shares",
                available: holding?.shares || 0,
                required: quantity,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("paper_orders")
          .insert({
            account_id,
            ticker: ticker.toUpperCase(),
            order_type,
            side,
            quantity,
            limit_price: order_type === "limit" ? limit_price : null,
            filled_price: fillPrice,
            filled_quantity: quantity,
            status: "filled",
            filled_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Update cash
        const newCash = side === "buy" 
          ? account.current_cash - totalCost
          : account.current_cash + totalCost;

        await supabase
          .from("paper_accounts")
          .update({ current_cash: newCash })
          .eq("id", account_id);

        // Update holdings
        if (side === "buy") {
          // Get existing holding
          const { data: existingHolding } = await supabase
            .from("paper_holdings")
            .select("*")
            .eq("account_id", account_id)
            .eq("ticker", ticker.toUpperCase())
            .single();

          if (existingHolding) {
            // Update with new average cost
            const totalShares = existingHolding.shares + quantity;
            const totalCostBasis = (existingHolding.avg_cost_basis * existingHolding.shares) + totalCost;
            const newAvgCost = totalCostBasis / totalShares;

            await supabase
              .from("paper_holdings")
              .update({
                shares: totalShares,
                avg_cost_basis: newAvgCost,
              })
              .eq("id", existingHolding.id);
          } else {
            // Create new holding
            await supabase.from("paper_holdings").insert({
              account_id,
              ticker: ticker.toUpperCase(),
              shares: quantity,
              avg_cost_basis: fillPrice,
            });
          }
        } else {
          // Sell - reduce shares
          const { data: holding } = await supabase
            .from("paper_holdings")
            .select("*")
            .eq("account_id", account_id)
            .eq("ticker", ticker.toUpperCase())
            .single();

          if (holding) {
            const newShares = holding.shares - quantity;
            const realizedPL = (fillPrice - holding.avg_cost_basis) * quantity;

            if (newShares <= 0) {
              await supabase
                .from("paper_holdings")
                .delete()
                .eq("id", holding.id);
            } else {
              await supabase
                .from("paper_holdings")
                .update({
                  shares: newShares,
                  realized_pl: holding.realized_pl + realizedPL,
                })
                .eq("id", holding.id);
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            order,
            newCash,
            message: `${side.toUpperCase()} ${quantity} ${ticker} at $${fillPrice.toFixed(2)}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_portfolio": {
        const { account_id } = body;

        // Get account
        const { data: account } = await supabase
          .from("paper_accounts")
          .select("*")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (!account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get holdings with current prices
        const { data: holdings } = await supabase
          .from("paper_holdings")
          .select("*")
          .eq("account_id", account_id);

        // Get current prices for all holdings
        const tickers = holdings?.map(h => h.ticker) || [];
        const { data: stocks } = await supabase
          .from("stocks")
          .select("ticker, price, price_change_percent")
          .in("ticker", tickers);

        const priceMap = new Map(stocks?.map(s => [s.ticker, s]) || []);

        // Calculate P/L for each holding
        const enrichedHoldings = holdings?.map(h => {
          const stockData = priceMap.get(h.ticker);
          const currentPrice = stockData?.price || h.avg_cost_basis;
          const marketValue = h.shares * currentPrice;
          const costBasis = h.shares * h.avg_cost_basis;
          const unrealizedPL = marketValue - costBasis;
          const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

          return {
            ...h,
            current_price: currentPrice,
            price_change_percent: stockData?.price_change_percent || 0,
            market_value: marketValue,
            cost_basis: costBasis,
            unrealized_pl: unrealizedPL,
            unrealized_pl_percent: unrealizedPLPercent,
          };
        }) || [];

        // Calculate totals
        const holdingsValue = enrichedHoldings.reduce((sum, h) => sum + h.market_value, 0);
        const totalEquity = account.current_cash + holdingsValue;
        const totalPL = totalEquity - account.starting_balance;
        const totalPLPercent = (totalPL / account.starting_balance) * 100;

        return new Response(
          JSON.stringify({
            success: true,
            account: {
              ...account,
              holdings_value: holdingsValue,
              total_equity: totalEquity,
              total_pl: totalPL,
              total_pl_percent: totalPLPercent,
            },
            holdings: enrichedHoldings,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "copy_from_screener": {
        const { account_id, allocations } = body;

        if (!account_id || !allocations || !Array.isArray(allocations)) {
          return new Response(
            JSON.stringify({ error: "Missing account_id or allocations array" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account
        const { data: account } = await supabase
          .from("paper_accounts")
          .select("*")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (!account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Process each allocation
        const orders = [];
        let totalInvested = 0;

        for (const alloc of allocations) {
          const { ticker, dollarAmount } = alloc;
          
          // Get current price
          const { data: stock } = await supabase
            .from("stocks")
            .select("price")
            .eq("ticker", ticker)
            .single();

          if (!stock?.price) continue;

          const shares = Math.floor(dollarAmount / stock.price);
          if (shares <= 0) continue;

          const actualCost = shares * stock.price;
          if (totalInvested + actualCost > account.current_cash) continue;

          totalInvested += actualCost;

          // Create buy order
          orders.push({
            account_id,
            ticker,
            order_type: "market",
            side: "buy",
            quantity: shares,
            filled_price: stock.price,
            filled_quantity: shares,
            status: "filled",
            filled_at: new Date().toISOString(),
          });

          // Update or create holding
          const { data: existingHolding } = await supabase
            .from("paper_holdings")
            .select("*")
            .eq("account_id", account_id)
            .eq("ticker", ticker)
            .single();

          if (existingHolding) {
            const totalShares = existingHolding.shares + shares;
            const totalCostBasis = (existingHolding.avg_cost_basis * existingHolding.shares) + actualCost;
            await supabase
              .from("paper_holdings")
              .update({
                shares: totalShares,
                avg_cost_basis: totalCostBasis / totalShares,
              })
              .eq("id", existingHolding.id);
          } else {
            await supabase.from("paper_holdings").insert({
              account_id,
              ticker,
              shares,
              avg_cost_basis: stock.price,
            });
          }
        }

        // Insert orders
        if (orders.length > 0) {
          await supabase.from("paper_orders").insert(orders);
        }

        // Update cash
        const newCash = account.current_cash - totalInvested;
        await supabase
          .from("paper_accounts")
          .update({ current_cash: newCash })
          .eq("id", account_id);

        return new Response(
          JSON.stringify({
            success: true,
            ordersPlaced: orders.length,
            totalInvested,
            newCash,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in paper-trade:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
