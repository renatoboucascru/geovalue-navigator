import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Send,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTickerNews, useSentiment, useTickerComments, useAddComment, useRefreshSentiment } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

interface NewsSentimentPanelProps {
  ticker: string;
  className?: string;
}

export const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({ ticker, className }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'comments'>('news');
  const [showAllNews, setShowAllNews] = useState(false);
  const [newComment, setNewComment] = useState('');

  const { user } = useAuth();
  const { data: news, isLoading: newsLoading } = useTickerNews(ticker);
  const { data: newsSentiment, isLoading: newsSentimentLoading } = useSentiment(ticker, 'news');
  const { data: commentsSentiment } = useSentiment(ticker, 'comments');
  const { data: comments, isLoading: commentsLoading } = useTickerComments(ticker);
  const addComment = useAddComment();
  const refreshSentiment = useRefreshSentiment();

  const getSentimentIcon = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-signal-green" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-signal-red" />;
      default: return <Minus className="h-4 w-4 text-signal-yellow" />;
    }
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'bullish': return 'text-signal-green bg-signal-green-bg';
      case 'bearish': return 'text-signal-red bg-signal-red-bg';
      default: return 'text-signal-yellow bg-signal-yellow-bg';
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      await addComment.mutateAsync({ ticker, content: newComment.trim() });
      setNewComment('');
    } catch {
      // Error handled in hook
    }
  };

  const displayedNews = showAllNews ? news : news?.slice(0, 5);

  return (
    <div className={cn('bg-card rounded-2xl border border-border overflow-hidden', className)}>
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('news')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            activeTab === 'news'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Newspaper className="h-4 w-4" />
          News
          {news && news.length > 0 && (
            <Badge variant="secondary" className="text-xs">{news.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            activeTab === 'comments'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments && comments.length > 0 && (
            <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
          )}
        </button>
      </div>

      {/* Sentiment Summary */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Sentiment Analysis
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => refreshSentiment.mutate({ ticker, sourceType: activeTab })}
            disabled={refreshSentiment.isPending}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', refreshSentiment.isPending && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {activeTab === 'news' ? (
          newsSentimentLoading ? (
            <div className="h-16 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : newsSentiment ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getSentimentIcon(newsSentiment.sentiment)}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-sm font-medium capitalize',
                  getSentimentColor(newsSentiment.sentiment)
                )}>
                  {newsSentiment.sentiment}
                </span>
                <span className="text-sm text-muted-foreground">
                  {newsSentiment.confidence}% confidence
                </span>
              </div>
              {newsSentiment.summary && (
                <p className="text-sm text-muted-foreground">{newsSentiment.summary}</p>
              )}
              {newsSentiment.key_drivers && newsSentiment.key_drivers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newsSentiment.key_drivers.slice(0, 3).map((driver, i) => (
                    <span key={i} className="text-xs bg-signal-green-bg text-signal-green px-2 py-0.5 rounded-full">
                      {driver}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sentiment analysis available yet</p>
          )
        ) : (
          <>
            {commentsSentiment ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-signal-yellow" />
                  <span className="text-xs text-signal-yellow">Community sentiment is noisy</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(commentsSentiment.sentiment)}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-sm font-medium capitalize',
                    getSentimentColor(commentsSentiment.sentiment)
                  )}>
                    {commentsSentiment.sentiment}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {commentsSentiment.confidence}% confidence
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Post comments to enable AI sentiment analysis</p>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'news' ? (
            <motion.div
              key="news"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-border"
            >
              {newsLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading news...
                </div>
              ) : !news || news.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No recent news for {ticker}
                </div>
              ) : (
                <>
                  {displayedNews?.map((item) => (
                    <a
                      key={item.id}
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 text-foreground">
                            {item.headline}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</span>
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                  {news && news.length > 5 && (
                    <button
                      onClick={() => setShowAllNews(!showAllNews)}
                      className="w-full p-3 text-sm text-primary hover:bg-muted/50 flex items-center justify-center gap-1"
                    >
                      {showAllNews ? 'Show less' : `Show all ${news.length} articles`}
                      <ChevronDown className={cn('h-4 w-4 transition-transform', showAllNews && 'rotate-180')} />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="comments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Comment Input */}
              {user ? (
                <div className="p-4 border-b border-border">
                  <Textarea
                    placeholder={`Share your thoughts on ${ticker}...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || addComment.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-border text-center">
                  <p className="text-sm text-muted-foreground">Sign in to join the discussion</p>
                </div>
              )}

              {/* Comments List */}
              <div className="divide-y divide-border">
                {commentsLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading comments...
                  </div>
                ) : !comments || comments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No comments yet. Be the first!
                  </div>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {comment.profiles?.display_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.profiles?.display_name || 'Anonymous'}
                            </span>
                            {comment.is_verified_holder && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Holder
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1 text-foreground">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {comment.upvotes || 0}
                            </button>
                            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <ThumbsDown className="h-3.5 w-3.5" />
                              {comment.downvotes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
