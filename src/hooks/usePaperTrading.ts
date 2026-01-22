import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PaperAccount {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  current_cash: number;
  holdings_value?: number;
  total_equity?: number;
  total_pl?: number;
  total_pl_percent?: number;
  created_at: string;
}

interface PaperHolding {
  id: string;
  account_id: string;
  ticker: string;
  shares: number;
  avg_cost_basis: number;
  realized_pl: number;
  current_price?: number;
  price_change_percent?: number;
  market_value?: number;
  cost_basis?: number;
  unrealized_pl?: number;
  unrealized_pl_percent?: number;
}

interface PaperOrder {
  id: string;
  account_id: string;
  ticker: string;
  order_type: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  limit_price: number | null;
  filled_price: number | null;
  filled_quantity: number;
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'expired';
  created_at: string;
  filled_at: string | null;
}

export function usePaperAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paper-accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('paper_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaperAccount[];
    },
    enabled: !!user,
  });
}

export function usePaperPortfolio(accountId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['paper-portfolio', accountId],
    queryFn: async () => {
      if (!accountId || !session) return null;
      
      const response = await supabase.functions.invoke('paper-trade', {
        body: { action: 'get_portfolio', account_id: accountId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        account: response.data.account as PaperAccount,
        holdings: response.data.holdings as PaperHolding[],
      };
    },
    enabled: !!accountId && !!session,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}

export function usePaperOrders(accountId: string | null) {
  return useQuery({
    queryKey: ['paper-orders', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      
      const { data, error } = await supabase
        .from('paper_orders')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PaperOrder[];
    },
    enabled: !!accountId,
  });
}

export function useCreatePaperAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, startingBalance }: { name?: string; startingBalance?: number }) => {
      const response = await supabase.functions.invoke('paper-trade', {
        body: {
          action: 'create_account',
          name: name || 'Paper Portfolio',
          starting_balance: startingBalance || 100000,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.account as PaperAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper-accounts', user?.id] });
      toast({
        title: 'Paper Account Created',
        description: 'Your new paper trading account is ready',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function usePlacePaperOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      ticker,
      side,
      quantity,
      orderType = 'market',
      limitPrice,
    }: {
      accountId: string;
      ticker: string;
      side: 'buy' | 'sell';
      quantity: number;
      orderType?: 'market' | 'limit';
      limitPrice?: number;
    }) => {
      const response = await supabase.functions.invoke('paper-trade', {
        body: {
          action: 'place_order',
          account_id: accountId,
          ticker,
          side,
          quantity,
          order_type: orderType,
          limit_price: limitPrice,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Order failed');
      }

      return response.data;
    },
    onSuccess: (data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['paper-portfolio', accountId] });
      queryClient.invalidateQueries({ queryKey: ['paper-orders', accountId] });
      toast({
        title: 'Order Filled',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCopyFromScreener() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      allocations,
    }: {
      accountId: string;
      allocations: { ticker: string; dollarAmount: number }[];
    }) => {
      const response = await supabase.functions.invoke('paper-trade', {
        body: {
          action: 'copy_from_screener',
          account_id: accountId,
          allocations,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['paper-portfolio', accountId] });
      queryClient.invalidateQueries({ queryKey: ['paper-orders', accountId] });
      toast({
        title: 'Portfolio Copied',
        description: `Placed ${data.ordersPlaced} orders, invested $${data.totalInvested.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Copy Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
