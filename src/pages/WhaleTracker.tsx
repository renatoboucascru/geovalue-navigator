import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock data for 13F holdings (until API is connected)
const MOCK_FILERS = [
  {
    id: '1',
    name: 'Bill & Melinda Gates Foundation Trust',
    cik: '0001166559',
    aum: '$45.2B',
    focusAreas: ['Tech', 'Healthcare', 'Climate'],
    lastFiling: 'Q4 2024',
    filingDate: 'Feb 14, 2025'
  },
  {
    id: '2',
    name: 'Berkshire Hathaway',
    cik: '0001067983',
    aum: '$368.7B',
    focusAreas: ['Financials', 'Energy', 'Consumer'],
    lastFiling: 'Q4 2024',
    filingDate: 'Feb 14, 2025'
  },
  {
    id: '3',
    name: 'Soros Fund Management',
    cik: '0001029160',
    aum: '$8.5B',
    focusAreas: ['Tech', 'Healthcare', 'Financials'],
    lastFiling: 'Q4 2024',
    filingDate: 'Feb 14, 2025'
  }
];

const MOCK_HOLDINGS = {
  '1': [ // Gates Foundation
    { ticker: 'MSFT', name: 'Microsoft', shares: 34_649_985, value: 14_570_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 32.2 },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', shares: 20_000_000, value: 9_200_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 20.4 },
    { ticker: 'WM', name: 'Waste Management', shares: 35_000_000, value: 7_350_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 16.3 },
    { ticker: 'CNI', name: 'Canadian National Railway', shares: 54_800_000, value: 6_100_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 13.5 },
    { ticker: 'CAT', name: 'Caterpillar', shares: 10_000_000, value: 3_800_000_000, change: 500_000, changeType: 'increased', pctPortfolio: 8.4 },
    { ticker: 'DE', name: 'Deere & Company', shares: 5_500_000, value: 2_500_000_000, change: -200_000, changeType: 'decreased', pctPortfolio: 5.5 },
    { ticker: 'ECL', name: 'Ecolab', shares: 5_000_000, value: 1_150_000_000, change: 5_000_000, changeType: 'new', pctPortfolio: 2.5 },
  ],
  '2': [ // Berkshire
    { ticker: 'AAPL', name: 'Apple', shares: 400_000_000, value: 75_000_000_000, change: -100_000_000, changeType: 'decreased', pctPortfolio: 20.4 },
    { ticker: 'BAC', name: 'Bank of America', shares: 1_033_000_000, value: 46_500_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 12.6 },
    { ticker: 'AXP', name: 'American Express', shares: 152_000_000, value: 42_300_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 11.5 },
    { ticker: 'KO', name: 'Coca-Cola', shares: 400_000_000, value: 25_200_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 6.8 },
    { ticker: 'CVX', name: 'Chevron', shares: 126_000_000, value: 18_500_000_000, change: 0, changeType: 'unchanged', pctPortfolio: 5.0 },
    { ticker: 'OXY', name: 'Occidental Petroleum', shares: 264_000_000, value: 13_400_000_000, change: 10_000_000, changeType: 'increased', pctPortfolio: 3.6 },
  ],
  '3': [ // Soros
    { ticker: 'GOOG', name: 'Alphabet', shares: 1_000_000, value: 190_000_000, change: 500_000, changeType: 'increased', pctPortfolio: 2.2 },
    { ticker: 'AMZN', name: 'Amazon', shares: 800_000, value: 180_000_000, change: 800_000, changeType: 'new', pctPortfolio: 2.1 },
    { ticker: 'NVDA', name: 'NVIDIA', shares: 1_200_000, value: 175_000_000, change: -300_000, changeType: 'decreased', pctPortfolio: 2.1 },
  ]
};

export default function WhaleTracker() {
  const [selectedFiler, setSelectedFiler] = useState(MOCK_FILERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'new' | 'increased' | 'decreased'>('all');

  const holdings = MOCK_HOLDINGS[selectedFiler.id as keyof typeof MOCK_HOLDINGS] || [];
  
  const filteredHoldings = holdings.filter(h => {
    const matchesSearch = h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || h.changeType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'new': return <PlusCircle className="h-4 w-4 text-signal-green" />;
      case 'increased': return <TrendingUp className="h-4 w-4 text-signal-green" />;
      case 'decreased': return <TrendingDown className="h-4 w-4 text-signal-red" />;
      case 'sold': return <MinusCircle className="h-4 w-4 text-signal-red" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeBadge = (changeType: string) => {
    switch (changeType) {
      case 'new': return 'bg-signal-green-bg text-[hsl(var(--signal-green))]';
      case 'increased': return 'bg-signal-green-bg text-[hsl(var(--signal-green))]';
      case 'decreased': return 'bg-signal-red-bg text-[hsl(var(--signal-red))]';
      case 'sold': return 'bg-signal-red-bg text-[hsl(var(--signal-red))]';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatShares = (shares: number) => {
    if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(1)}M`;
    if (shares >= 1_000) return `${(shares / 1_000).toFixed(0)}K`;
    return shares.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/signals" className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">13F Whale Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Track institutional holdings from major investors
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Filer Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Tracked Filers</h3>
            {MOCK_FILERS.map(filer => (
              <button
                key={filer.id}
                onClick={() => setSelectedFiler(filer)}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all',
                  selectedFiler.id === filer.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium text-foreground text-sm mb-1">{filer.name}</div>
                <div className="text-xs text-muted-foreground mb-2">AUM: {filer.aum}</div>
                <div className="flex flex-wrap gap-1">
                  {filer.focusAreas.map(area => (
                    <span key={area} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {area}
                    </span>
                  ))}
                </div>
              </button>
            ))}

            {/* Coming Soon Notice */}
            <div className="p-4 bg-accent/50 rounded-xl text-center">
              <Clock className="h-6 w-6 text-accent-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Real-time 13F data via API coming soon. Currently showing sample data.
              </p>
            </div>
          </div>

          {/* Holdings */}
          <div className="md:col-span-3">
            <motion.div
              key={selectedFiler.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Filer Info */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedFiler.name}</h2>
                    <p className="text-sm text-muted-foreground">CIK: {selectedFiler.cik}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{selectedFiler.aum}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {selectedFiler.lastFiling} • Filed {selectedFiler.filingDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search holdings..."
                    className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'new', 'increased', 'decreased'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                        filterType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Ticker</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Shares</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Value</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">% Port</th>
                        <th className="text-center p-4 font-medium text-muted-foreground">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredHoldings.map((holding, index) => (
                        <motion.tr
                          key={holding.ticker}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-secondary/30 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-semibold text-foreground">{holding.ticker}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">{holding.name}</td>
                          <td className="p-4 text-right font-medium text-foreground">
                            {formatShares(holding.shares)}
                          </td>
                          <td className="p-4 text-right font-medium text-foreground">
                            {formatValue(holding.value)}
                          </td>
                          <td className="p-4 text-right text-muted-foreground">
                            {holding.pctPortfolio.toFixed(1)}%
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {getChangeIcon(holding.changeType)}
                              <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', getChangeBadge(holding.changeType))}>
                                {holding.changeType}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEC Link */}
              <div className="flex justify-center">
                <a
                  href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${selectedFiler.cik}&type=13F&dateb=&owner=include&count=40`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on SEC EDGAR
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          13F filings are reported with a 45-day delay. Holdings may have changed since the reporting date.
          This is for informational purposes only and not financial advice.
        </p>
      </div>
    </div>
  );
}
