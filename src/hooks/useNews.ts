import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  ticker: string;
  headline: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  image_url: string | null;
  published_at: string;
  category: string | null;
}

interface SentimentScore {
  id: string;
  ticker: string;
  source_type: 'news' | 'comments';
  sentiment: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  summary: string | null;
  key_drivers: string[] | null;
  risks: string[] | null;
  analyzed_items_count: number | null;
  created_at: string;
}

export function useTickerNews(ticker: string | null) {
  return useQuery({
    queryKey: ['ticker-news', ticker],
    queryFn: async () => {
      if (!ticker) return [];
      
      const response = await supabase.functions.invoke('fetch-news', {
        body: { ticker: ticker.toUpperCase() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.news as NewsItem[];
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSentiment(ticker: string | null, sourceType: 'news' | 'comments' = 'news') {
  return useQuery({
    queryKey: ['sentiment', ticker, sourceType],
    queryFn: async () => {
      if (!ticker) return null;
      
      const response = await supabase.functions.invoke('analyze-sentiment', {
        body: { ticker: ticker.toUpperCase(), sourceType },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.sentiment as SentimentScore | null;
    },
    enabled: !!ticker,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useRefreshSentiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticker, sourceType }: { ticker: string; sourceType: 'news' | 'comments' }) => {
      const response = await supabase.functions.invoke('analyze-sentiment', {
        body: { ticker: ticker.toUpperCase(), sourceType },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.sentiment;
    },
    onSuccess: (data, { ticker, sourceType }) => {
      queryClient.invalidateQueries({ queryKey: ['sentiment', ticker, sourceType] });
      toast({
        title: 'Sentiment Updated',
        description: `${data?.sentiment || 'Analysis'} sentiment for ${ticker}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTickerComments(ticker: string | null) {
  return useQuery({
    queryKey: ['ticker-comments', ticker],
    queryFn: async () => {
      if (!ticker) return [];
      
      const { data, error } = await supabase
        .from('ticker_comments')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('ticker', ticker.toUpperCase())
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!ticker,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticker, content }: { ticker: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to comment');

      const { data, error } = await supabase
        .from('ticker_comments')
        .insert({
          user_id: user.id,
          ticker: ticker.toUpperCase(),
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticker }) => {
      queryClient.invalidateQueries({ queryKey: ['ticker-comments', ticker] });
      toast({
        title: 'Comment Posted',
        description: 'Your comment has been added',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useVoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, voteType }: { commentId: string; voteType: 'up' | 'down'; ticker: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to vote');

      // Check existing vote
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase.from('comment_votes').delete().eq('id', existingVote.id);
        } else {
          // Change vote
          await supabase.from('comment_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
        }
      } else {
        // New vote
        await supabase.from('comment_votes').insert({
          comment_id: commentId,
          user_id: user.id,
          vote_type: voteType,
        });
      }

      return { commentId, voteType };
    },
    onSuccess: (_, { ticker }) => {
      queryClient.invalidateQueries({ queryKey: ['ticker-comments', ticker] });
    },
  });
}
