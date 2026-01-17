import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Copy, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenerStore } from '@/store/screenerStore';
import { StockCard } from './StockCard';
import { StockDetailModal } from './StockDetailModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
  
  const [copied, setCopied] = React.useState(false);
  
  const selectedStock = selectedStockId 
    ? filteredStocks.find(s => s.id === selectedStockId) 
    : null;
  
  const pieData = allocations.slice(0, 8).map((a, i) => ({
    name: a.stock.ticker,
    value: a.percentWeight * 100,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));
  
  if (allocations.length > 8) {
    const othersPercent = allocations.slice(8).reduce((sum, a) => sum + a.percentWeight * 100, 0);
    pieData.push({ name: 'Others', value: othersPercent, color: 'hsl(220, 14%, 80%)' });
  }
  
  const handleExportCSV = () => {
    const headers = ['Ticker', 'Name', 'Allocation ($)', 'Weight (%)', 'Price', 'P/E', 'Forward P/E', 'Valuation', 'Score'];
    const rows = allocations.map(a => [
      a.stock.ticker,
      a.stock.name,
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
    const tickers = allocations.map(a => `${a.stock.ticker}: $${a.dollarAmount.toFixed(0)}`).join('\n');
    navigator.clipboard.writeText(tickers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
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
              onClick={handleCopyTickers}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="h-5 w-5 text-signal-green" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Your Portfolio
          </h1>
          <p className="text-muted-foreground">
            ${investmentAmount.toLocaleString()} • {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)} • {allocations.length} stocks
          </p>
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
          {allocations.map((allocation, index) => (
            <StockCard
              key={allocation.stock.id}
              allocation={allocation}
              index={index}
              onClick={() => selectStock(allocation.stock.id)}
            />
          ))}
        </div>
        
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
