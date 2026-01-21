import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Copy, Check, AlertTriangle, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenerStore } from '@/store/screenerStore';
import { StockCard } from './StockCard';
import { StockDetailModal } from './StockDetailModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SortOption } from '@/types/stock';
import { useRefreshPrices, useLastPriceUpdate } from '@/hooks/useStockPrices';
const CHART_COLORS = [
  'hsl(211, 100%, 50%)',  // primary blue
  'hsl(142, 71%, 45%)',   // green
  'hsl(45, 93%, 47%)',    // yellow
  'hsl(280, 65%, 60%)',   // purple
  'hsl(340, 75%, 55%)',   // pink
  'hsl(200, 80%, 50%)',   // light blue
  'hsl(160, 60%, 45%)',   // teal
  'hsl(30, 80%, 55%)',    // orange
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'composite', label: 'Best Score' },
  { value: 'cheapest', label: 'Cheapest (P/E)' },
  { value: 'lowestBeta', label: 'Lowest Beta' },
  { value: 'highestDividend', label: 'Highest Dividend' },
  { value: 'lowestDebt', label: 'Lowest Debt' }
];

export const ResultsScreen: React.FC = () => {
  const { 
    allocations, 
    investmentAmount, 
    riskProfile, 
    filters,
    setStep,
    selectStock,
    selectedStockId,
    filteredStocks
  } = useScreenerStore();
  
  const { mutate: refreshPrices, isPending: isRefreshing } = useRefreshPrices();
  const { data: lastUpdate } = useLastPriceUpdate();
  
  const [copied, setCopied] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('composite');
  
  const selectedStock = selectedStockId 
    ? filteredStocks.find(s => s.id === selectedStockId) 
    : null;
  
  // Sort allocations based on selected sort option
  const sortedAllocations = useMemo(() => {
    const sorted = [...allocations];
    switch (sortBy) {
      case 'cheapest':
        return sorted.sort((a, b) => (a.stock.peRatio ?? 999) - (b.stock.peRatio ?? 999));
      case 'lowestBeta':
        return sorted.sort((a, b) => (a.stock.beta ?? 999) - (b.stock.beta ?? 999));
      case 'highestDividend':
        return sorted.sort((a, b) => (b.stock.dividendYield ?? 0) - (a.stock.dividendYield ?? 0));
      case 'lowestDebt':
        return sorted.sort((a, b) => (a.stock.debtEquity ?? 999) - (b.stock.debtEquity ?? 999));
      case 'composite':
      default:
        return sorted.sort((a, b) => b.stock.compositeScore - a.stock.compositeScore);
    }
  }, [allocations, sortBy]);
  
  // Pagination
  const totalCount = sortedAllocations.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedAllocations = sortedAllocations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const pieData = sortedAllocations.slice(0, 8).map((a, i) => ({
    name: a.stock.ticker,
    value: a.percentWeight * 100,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));
  
  if (sortedAllocations.length > 8) {
    const othersPercent = sortedAllocations.slice(8).reduce((sum, a) => sum + a.percentWeight * 100, 0);
    pieData.push({ name: 'Others', value: othersPercent, color: 'hsl(220, 14%, 80%)' });
  }
  
  const handleExportCSV = () => {
    const headers = ['Ticker', 'Name', 'Type', 'Layer', 'Allocation ($)', 'Weight (%)', 'Price', 'P/E', 'Forward P/E', 'Valuation', 'Score'];
    const rows = sortedAllocations.map(a => [
      a.stock.ticker,
      a.stock.name,
      a.stock.stockType || 'leader',
      a.stock.valueChainLayer || '',
      a.dollarAmount.toFixed(2),
      (a.percentWeight * 100).toFixed(2),
      a.stock.price?.toFixed(2) ?? 'N/A',
      a.stock.peRatio?.toFixed(2) ?? 'N/A',
      a.stock.forwardPE?.toFixed(2) ?? 'N/A',
      a.stock.valuationFlag.toUpperCase(),
      a.stock.compositeScore
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geovalue-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleCopyTickers = () => {
    const tickers = sortedAllocations.map(a => `${a.stock.ticker}: $${a.dollarAmount.toFixed(0)}`).join('\n');
    navigator.clipboard.writeText(tickers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Reset to page 1 when sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, pageSize]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-8"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setStep('input')}
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Edit Criteria</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshPrices(undefined)}
              disabled={isRefreshing}
              className={cn(
                'p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors',
                isRefreshing && 'animate-spin'
              )}
              title="Refresh stock prices"
            >
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleCopyTickers}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="h-5 w-5 text-signal-green" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              title="Export all results to CSV"
            >
              <Download className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Summary with count and filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Your Portfolio
          </h1>
          <p className="text-muted-foreground mb-2">
            ${investmentAmount.toLocaleString()} • {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)} • {totalCount} stocks
          </p>
          
          {/* Results Header */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Showing {paginatedAllocations.length} of {totalCount} matches
            </span>
            <span>•</span>
            <span>{filters.sectors.length > 0 ? filters.sectors.join(', ') : 'All sectors'}</span>
            {filters.includeIranGulf && <span className="text-signal-yellow">+ Gulf Scenario</span>}
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastUpdate ? `Updated: ${new Date(lastUpdate).toLocaleString()}` : 'Prices from seed data'}
            </span>
            {isRefreshing && <span className="text-primary animate-pulse">Refreshing...</span>}
          </div>
        </motion.div>
        
        {/* Sort & Page Size Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Sort by:</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Per page:</label>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </motion.div>
        
        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-ios border border-border p-6 mb-6"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Allocation Breakdown</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-foreground truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-signal-yellow-bg rounded-xl p-4 flex items-start gap-3 mb-6"
        >
          <AlertTriangle className="h-5 w-5 text-signal-yellow flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <strong>Disclaimer:</strong> This is not financial advice. For informational purposes only. 
            Always conduct your own research and consult a qualified financial advisor.
          </p>
        </motion.div>
        
        {/* Stock Cards */}
        <div className="space-y-4">
          {paginatedAllocations.map((allocation, index) => (
            <StockCard
              key={allocation.stock.id}
              allocation={allocation}
              index={index}
              onClick={() => selectStock(allocation.stock.id)}
            />
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-8"
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              )}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPage === totalPages
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              )}
            >
              Next
            </button>
          </motion.div>
        )}
        
        {/* Load All Option */}
        {totalCount > pageSize && (
          <div className="text-center mt-4">
            <button
              onClick={() => setPageSize(totalCount)}
              className="text-sm text-primary hover:underline"
            >
              Show all {totalCount} results (may be slower)
            </button>
          </div>
        )}
        
        {allocations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground">No stocks match your criteria.</p>
            <button
              onClick={() => setStep('input')}
              className="mt-4 text-primary hover:underline"
            >
              Adjust your filters
            </button>
          </motion.div>
        )}
      </div>
      
      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => selectStock(null)}
      />
    </motion.div>
  );
};
