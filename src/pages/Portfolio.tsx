import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  Edit2,
  Trash2,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DbPortfolio, DbPortfolioHolding, DbStock } from '@/types/database';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioWithHoldings extends DbPortfolio {
  holdings: (DbPortfolioHolding & { stocks: DbStock | null })[];
}

const CHART_COLORS = [
  'hsl(211, 100%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 80%, 50%)',
];

export default function Portfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioWithHoldings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioRisk, setNewPortfolioRisk] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchPortfolios = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        holdings:portfolio_holdings(
          *,
          stocks(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load portfolios');
      console.error(error);
    } else {
      setPortfolios(data as PortfolioWithHoldings[] || []);
      if (data && data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0] as PortfolioWithHoldings);
      }
    }
    setIsLoading(false);
  };

  const createPortfolio = async () => {
    if (!user || !newPortfolioName.trim()) return;

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: newPortfolioName.trim(),
        risk_profile: newPortfolioRisk
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create portfolio');
    } else {
      toast.success('Portfolio created!');
      setNewPortfolioName('');
      setIsCreating(false);
      fetchPortfolios();
    }
  };

  const deletePortfolio = async (portfolioId: string) => {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) {
      toast.error('Failed to delete portfolio');
    } else {
      toast.success('Portfolio deleted');
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(null);
      }
      fetchPortfolios();
    }
  };

  const calculatePortfolioValue = (holdings: PortfolioWithHoldings['holdings']) => {
    return holdings.reduce((sum, h) => {
      if (h.stocks?.price && h.shares) {
        return sum + (Number(h.stocks.price) * Number(h.shares));
      }
      return sum;
    }, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Track Your Portfolios</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to create and manage multiple portfolios, track performance, and get rebalancing suggestions.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Sign In to Get Started
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = selectedPortfolio?.holdings.map((h, i) => ({
    name: h.stocks?.ticker || 'Unknown',
    value: h.stocks?.price && h.shares ? Number(h.stocks.price) * Number(h.shares) : 0,
    color: CHART_COLORS[i % CHART_COLORS.length]
  })).filter(d => d.value > 0) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolios</h1>
            <p className="text-sm text-muted-foreground">
              {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium">
                <Plus className="h-4 w-4" />
                New Portfolio
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Portfolio Name</label>
                  <input
                    type="text"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder="e.g., Conservative Growth"
                    className="w-full h-12 px-4 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Risk Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['conservative', 'moderate', 'aggressive'] as const).map(risk => (
                      <button
                        key={risk}
                        onClick={() => setNewPortfolioRisk(risk)}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium capitalize transition-colors',
                          newPortfolioRisk === risk
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={createPortfolio}
                  disabled={!newPortfolioName.trim()}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  Create Portfolio
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {portfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No portfolios yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first portfolio to start tracking your investments.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Portfolio
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Portfolio List */}
            <div className="space-y-3">
              {portfolios.map(portfolio => (
                <motion.button
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedPortfolio(portfolio)}
                  className={cn(
                    'w-full p-4 rounded-2xl border text-left transition-all',
                    selectedPortfolio?.id === portfolio.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{portfolio.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-secondary"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePortfolio(portfolio.id);
                          }}
                          className="text-signal-red"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{portfolio.risk_profile}</span>
                    <span className="font-medium text-foreground">
                      ${calculatePortfolioValue(portfolio.holdings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {portfolio.holdings.length} holding{portfolio.holdings.length !== 1 ? 's' : ''}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Portfolio Details */}
            {selectedPortfolio && (
              <div className="md:col-span-2 space-y-6">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Allocation</h3>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-secondary">
                        <PieChart className="h-4 w-4 text-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-secondary">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {pieData.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `$${value.toLocaleString()}`}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No holdings yet. Add stocks from the screener.
                    </div>
                  )}
                </motion.div>

                {/* Holdings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Holdings</h3>
                    <button
                      onClick={() => navigate('/screener')}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add from Screener
                    </button>
                  </div>

                  {selectedPortfolio.holdings.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPortfolio.holdings.map(holding => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                        >
                          <div>
                            <span className="font-medium text-foreground">
                              {holding.stocks?.ticker || 'Unknown'}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {Number(holding.shares).toFixed(2)} shares
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              ${holding.stocks?.price && holding.shares
                                ? (Number(holding.stocks.price) * Number(holding.shares)).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                : 'N/A'
                              }
                            </p>
                            <div className={cn(
                              'flex items-center text-xs',
                              (holding.stocks?.price_change_percent ?? 0) >= 0 
                                ? 'text-signal-green' 
                                : 'text-signal-red'
                            )}>
                              {(holding.stocks?.price_change_percent ?? 0) >= 0 
                                ? <TrendingUp className="h-3 w-3 mr-0.5" />
                                : <TrendingDown className="h-3 w-3 mr-0.5" />
                              }
                              {Number(holding.stocks?.price_change_percent ?? 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No holdings in this portfolio.</p>
                      <button
                        onClick={() => navigate('/screener')}
                        className="mt-2 text-primary hover:underline"
                      >
                        Find stocks to add →
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Rebalance Card */}
                {selectedPortfolio.holdings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-accent rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-6 w-6 text-accent-foreground" />
                      <div>
                        <h3 className="font-semibold text-accent-foreground">Rebalancing</h3>
                        <p className="text-sm text-accent-foreground/70">
                          Check if your portfolio needs rebalancing based on your target allocations.
                        </p>
                      </div>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-card text-foreground rounded-lg font-medium text-sm">
                      Analyze Drift
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
