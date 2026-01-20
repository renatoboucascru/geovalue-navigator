import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Stock, PortfolioAllocation } from '@/types/stock';
import { ValuationBadge } from './ValuationBadge';
import { ScoreRing } from './ScoreRing';
import { Lock, Unlock, ChevronRight, TrendingUp, TrendingDown, Building2, Truck, Briefcase } from 'lucide-react';
import { generateWhyIncluded } from '@/lib/scoring';
import { useScreenerStore } from '@/store/screenerStore';

interface StockCardProps {
  allocation: PortfolioAllocation;
  index: number;
  onClick?: () => void;
}

function formatMarketCap(value: number | null): string {
  if (value === null) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | null, suffix = ''): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(2)}${suffix}`;
}

const stockTypeConfig = {
  leader: { label: 'Leader', icon: Building2, className: 'bg-primary/10 text-primary border-primary/20' },
  supplier: { label: 'Supplier', icon: Truck, className: 'bg-signal-yellow-bg text-signal-yellow border-signal-yellow/20' },
  standalone: { label: 'Standalone', icon: Briefcase, className: 'bg-accent text-accent-foreground border-accent' }
};

export const StockCard: React.FC<StockCardProps> = ({ allocation, index, onClick }) => {
  const { stock, dollarAmount, percentWeight, locked } = allocation;
  const { toggleLock, riskProfile } = useScreenerStore();
  
  const isPositive = stock.priceChangePercent !== null && stock.priceChangePercent >= 0;
  const whyIncluded = generateWhyIncluded(stock, riskProfile);
  
  const typeConfig = stockTypeConfig[stock.stockType || 'leader'];
  const TypeIcon = typeConfig.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        'bg-card rounded-2xl shadow-ios border border-border',
        'p-4 cursor-pointer hover:shadow-ios-lg transition-shadow'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-foreground">{stock.ticker}</span>
            <ValuationBadge flag={stock.valuationFlag} size="sm" />
            {/* Stock Type Badge */}
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
              typeConfig.className
            )}>
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <ScoreRing score={stock.compositeScore} size={44} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLock(stock.id);
            }}
            className={cn(
              'p-2 rounded-full transition-colors',
              locked ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Value Chain Layer Badge */}
      {stock.valueChainLayer && (
        <div className="mb-3">
          <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
            {stock.valueChainLayer}
          </span>
        </div>
      )}
      
      {/* Price Row */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <div>
          <span className="text-lg font-semibold text-foreground">
            ${stock.price?.toFixed(2) ?? 'N/A'}
          </span>
          <div className={cn(
            'flex items-center text-xs font-medium',
            isPositive ? 'text-signal-green' : 'text-signal-red'
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {formatNumber(stock.priceChangePercent, '%')}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-primary">
            ${dollarAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">
            {(percentWeight * 100).toFixed(1)}% of portfolio
          </div>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div>
          <span className="text-muted-foreground block">P/E</span>
          <span className="font-medium text-foreground">{formatNumber(stock.peRatio)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Fwd P/E</span>
          <span className="font-medium text-foreground">{formatNumber(stock.forwardPE)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Mkt Cap</span>
          <span className="font-medium text-foreground">{formatMarketCap(stock.marketCap)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Beta</span>
          <span className="font-medium text-foreground">{formatNumber(stock.beta)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div>
          <span className="text-muted-foreground block">D/E</span>
          <span className="font-medium text-foreground">{formatNumber(stock.debtEquity)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">EV/EBITDA</span>
          <span className="font-medium text-foreground">{formatNumber(stock.evEbitda)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">P/FCF</span>
          <span className="font-medium text-foreground">{formatNumber(stock.priceFCF)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Div Yield</span>
          <span className="font-medium text-foreground">{formatNumber(stock.dividendYield, '%')}</span>
        </div>
      </div>
      
      {/* Sectors */}
      <div className="flex flex-wrap gap-1 mb-3">
        {stock.sectors.slice(0, 3).map(sector => (
          <span 
            key={sector}
            className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs"
          >
            {sector}
          </span>
        ))}
        {stock.sectors.length > 3 && (
          <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
            +{stock.sectors.length - 3}
          </span>
        )}
      </div>
      
      {/* Why Included */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground italic flex-1 mr-2">
          {whyIncluded}
        </p>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
};
