import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Shield, Newspaper, ChevronDown } from 'lucide-react';
import { Stock } from '@/types/stock';
import { ValuationBadge } from './ValuationBadge';
import { ScoreRing } from './ScoreRing';
import { cn } from '@/lib/utils';
import { supplierMappings } from '@/data/seedStocks';
import { NewsSentimentPanel } from './NewsSentimentPanel';

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
}

function formatMarketCap(value: number | null): string {
  if (value === null) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | null, suffix = ''): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(2)}${suffix}`;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose }) => {
  const [showNewsSentiment, setShowNewsSentiment] = useState(false);
  
  if (!stock) return null;
  
  const isPositive = stock.priceChangePercent !== null && stock.priceChangePercent >= 0;
  
  // Get supplier relationships
  const asCustomer = supplierMappings.filter(m => m.customerTicker === stock.ticker);
  const asSupplier = supplierMappings.filter(m => m.supplierTicker === stock.ticker);
  
  return (
    <AnimatePresence>
      {stock && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[90vh]',
              'bg-card rounded-t-3xl shadow-ios-xl overflow-hidden',
              'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:top-8',
              'md:w-full md:max-w-2xl md:rounded-2xl'
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{stock.ticker}</h2>
                    <ValuationBadge flag={stock.valuationFlag} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[calc(100vh-200px)]">
              <div className="p-6 space-y-6">
                {/* Price & Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      ${stock.price?.toFixed(2) ?? 'N/A'}
                    </div>
                    <div className={cn(
                      'flex items-center text-sm font-medium mt-1',
                      isPositive ? 'text-signal-green' : 'text-signal-red'
                    )}>
                      {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {stock.priceChange !== null && (
                        <span className="mr-2">${Math.abs(stock.priceChange).toFixed(2)}</span>
                      )}
                      ({formatNumber(stock.priceChangePercent, '%')})
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <ScoreRing score={stock.compositeScore} size={64} strokeWidth={5} />
                    <p className="text-xs text-muted-foreground mt-1">Composite Score</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground">Market Cap</span>
                    <p className="font-semibold text-foreground">{formatMarketCap(stock.marketCap)}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground">Exchange</span>
                    <p className="font-semibold text-foreground">{stock.exchange}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground">Country</span>
                    <p className="font-semibold text-foreground">{stock.country}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <p className="font-semibold text-foreground capitalize">{stock.confidence}</p>
                  </div>
                </div>
                
                {/* Valuation Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Valuation Metrics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">P/E (TTM)</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.peRatio)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">Forward P/E</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.forwardPE)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">EV/EBITDA</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.evEbitda)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">P/FCF</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.priceFCF)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">Debt/Equity</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.debtEquity)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3">
                      <span className="text-xs text-muted-foreground">Beta</span>
                      <p className="font-semibold text-foreground">{formatNumber(stock.beta)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Dividend */}
                {stock.dividendYield !== null && stock.dividendYield > 0 && (
                  <div className="bg-accent rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-accent-foreground">Dividend Yield</span>
                      <p className="text-2xl font-bold text-accent-foreground">{formatNumber(stock.dividendYield, '%')}</p>
                    </div>
                    <Shield className="h-8 w-8 text-accent-foreground/50" />
                  </div>
                )}
                
                {/* Risk Indicators */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Risk Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Geo Concentration Risk</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'w-4 h-4 rounded-full',
                              i <= stock.geoConcentrationRisk
                                ? stock.geoConcentrationRisk >= 4 ? 'bg-signal-red' : stock.geoConcentrationRisk >= 3 ? 'bg-signal-yellow' : 'bg-signal-green'
                                : 'bg-secondary'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Scenario Tailwind</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'w-4 h-4 rounded-full',
                              i <= stock.scenarioTailwind ? 'bg-primary' : 'bg-secondary'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sectors & Roles */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sectors & Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {stock.sectors.map(sector => (
                      <span 
                        key={sector}
                        className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stock.roles.map(role => (
                      <span 
                        key={role}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Iran/Gulf Category */}
                {stock.iranGulfCategory && (
                  <div className="bg-signal-yellow-bg rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-signal-yellow flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Iran/Gulf Scenario</p>
                      <p className="text-sm text-muted-foreground">
                        May be sensitive to Gulf tensions: {stock.iranGulfCategory}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Supplier Relationships */}
                {(asCustomer.length > 0 || asSupplier.length > 0) && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Supply Chain</h3>
                    {asCustomer.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Key Suppliers</span>
                        <div className="mt-2 space-y-2">
                          {asCustomer.map(mapping => (
                            <div 
                              key={mapping.id}
                              className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium text-foreground">{mapping.supplierTicker}</span>
                                <span className="text-muted-foreground"> – {mapping.supplierRole}</span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                Dependency: {mapping.dependencyStrength}/5
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {asSupplier.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Supplies To</span>
                        <div className="mt-2 space-y-2">
                          {asSupplier.map(mapping => (
                            <div 
                              key={mapping.id}
                              className="bg-secondary/50 rounded-lg p-3"
                            >
                              <span className="font-medium text-foreground">{mapping.customerTicker}</span>
                              <span className="text-muted-foreground"> – {mapping.supplierRole}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Notes */}
                {stock.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{stock.notes}</p>
                  </div>
                )}
                
                {/* Evidence Link */}
                {stock.evidenceUrl && (
                  <a
                    href={stock.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Evidence
                  </a>
                )}
                
                {/* News & Sentiment Section */}
                <div>
                  <button
                    onClick={() => setShowNewsSentiment(!showNewsSentiment)}
                    className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Newspaper className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <span className="font-medium text-foreground">News & Sentiment</span>
                        <p className="text-xs text-muted-foreground">AI-powered analysis & community discussion</p>
                      </div>
                    </div>
                    <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', showNewsSentiment && 'rotate-180')} />
                  </button>
                  
                  <AnimatePresence>
                    {showNewsSentiment && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <NewsSentimentPanel ticker={stock.ticker} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Last Updated */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Data as of {stock.lastUpdated.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
