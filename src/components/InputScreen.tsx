import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Shield, Zap, TrendingUp, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenerStore } from '@/store/screenerStore';
import { SectorChip } from './SectorChip';
import { SECTORS } from '@/data/seedStocks';
import { RiskProfile, StockType, ValueChainLayer } from '@/types/stock';

const riskProfiles: { value: RiskProfile; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'conservative', label: 'Conservative', icon: Shield, description: 'Lower risk, stable returns' },
  { value: 'moderate', label: 'Moderate', icon: TrendingUp, description: 'Balanced approach' },
  { value: 'aggressive', label: 'Aggressive', icon: Zap, description: 'Higher risk, growth focus' }
];

const stockTypeOptions: { value: StockType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'leader', label: 'Leaders/Customers' },
  { value: 'supplier', label: 'Suppliers/Enablers' },
  { value: 'standalone', label: 'Standalone' }
];

const valueChainLayerOptions: { value: ValueChainLayer | 'all'; label: string }[] = [
  { value: 'all', label: 'All Layers' },
  { value: 'Foundry', label: 'Foundry' },
  { value: 'Lithography', label: 'Lithography' },
  { value: 'Semi Equipment', label: 'Semi Equipment' },
  { value: 'Materials', label: 'Materials' },
  { value: 'Packaging/OSAT', label: 'Packaging/OSAT' },
  { value: 'Memory', label: 'Memory' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Power/Cooling', label: 'Power/Cooling' },
  { value: 'Defense Electronics', label: 'Defense Electronics' },
  { value: 'Uranium/Fuel Cycle', label: 'Uranium/Fuel Cycle' },
  { value: 'Pharma/Biotech', label: 'Pharma/Biotech' },
  { value: 'MedTech', label: 'MedTech' },
  { value: 'Healthcare Services', label: 'Healthcare Services' },
  { value: 'Energy Infrastructure', label: 'Energy Infrastructure' }
];

export const InputScreen: React.FC = () => {
  const { 
    investmentAmount, 
    setInvestmentAmount, 
    riskProfile, 
    setRiskProfile,
    filters,
    toggleSector,
    setIncludeIranGulf,
    setFilter,
    runScreener
  } = useScreenerStore();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const isValid = investmentAmount >= 100 && (filters.sectors.length > 0 || filters.includeIranGulf);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">GeoValue Screener</h1>
          <p className="text-sm text-muted-foreground">Find opportunities based on valuation & geopolitics</p>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4 space-y-8 pb-40 md:pb-32">
        {/* Investment Amount */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            How much do you want to invest?
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Math.max(0, Number(e.target.value)))}
              placeholder="10,000"
              className={cn(
                'w-full h-14 pl-12 pr-4 text-lg font-semibold',
                'bg-card border border-border rounded-2xl',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'placeholder:text-muted-foreground/50'
              )}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[1000, 5000, 10000, 25000, 50000].map(amount => (
              <button
                key={amount}
                onClick={() => setInvestmentAmount(amount)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  investmentAmount === amount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                ${(amount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </motion.section>
        
        {/* Risk Profile */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-foreground mb-3">
            What's your risk tolerance?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {riskProfiles.map(profile => {
              const Icon = profile.icon;
              const isSelected = riskProfile === profile.value;
              
              return (
                <motion.button
                  key={profile.value}
                  onClick={() => setRiskProfile(profile.value)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex flex-col items-center p-4 rounded-2xl border transition-all',
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary shadow-ios'
                      : 'bg-card border-border hover:border-primary/50'
                  )}
                >
                  <Icon className={cn('h-6 w-6 mb-2', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')} />
                  <span className="font-medium text-sm">{profile.label}</span>
                  <span className={cn('text-xs mt-1', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {profile.description}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
        
        {/* Sectors */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-foreground mb-3">
            Select sectors & themes
          </label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map(sector => (
              <SectorChip
                key={sector}
                sector={sector}
                selected={filters.sectors.includes(sector)}
                onClick={() => toggleSector(sector)}
                size="sm"
              />
            ))}
          </div>
        </motion.section>
        
        {/* Iran/Gulf Scenario Toggle */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setIncludeIranGulf(!filters.includeIranGulf)}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-2xl border transition-all',
              filters.includeIranGulf
                ? 'bg-signal-yellow-bg border-signal-yellow text-foreground'
                : 'bg-card border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <Globe className={cn('h-5 w-5', filters.includeIranGulf ? 'text-signal-yellow' : 'text-muted-foreground')} />
              <div className="text-left">
                <span className="font-medium">Include Iran/Gulf Escalation</span>
                <p className="text-xs text-muted-foreground">Stocks that may benefit from regional tensions</p>
              </div>
            </div>
            <div className={cn(
              'w-12 h-7 rounded-full transition-colors flex items-center px-1',
              filters.includeIranGulf ? 'bg-signal-yellow' : 'bg-secondary'
            )}>
              <motion.div
                animate={{ x: filters.includeIranGulf ? 20 : 0 }}
                className="w-5 h-5 bg-card rounded-full shadow"
              />
            </div>
          </button>
        </motion.section>
        
        {/* Advanced Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-90')} />
            Advanced Filters
          </button>
          
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Stock Type & Value Chain Layer - New Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Stock Type</label>
                  <select
                    value={filters.stockTypes.length === 0 ? 'all' : filters.stockTypes[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setFilter('stockTypes', []);
                      } else {
                        setFilter('stockTypes', [val as StockType]);
                      }
                    }}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {stockTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Value Chain Layer</label>
                  <select
                    value={filters.valueChainLayers.length === 0 ? 'all' : filters.valueChainLayers[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setFilter('valueChainLayers', []);
                      } else {
                        setFilter('valueChainLayers', [val as ValueChainLayer]);
                      }
                    }}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {valueChainLayerOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Valuation Toggles */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.excludeRed}
                    onChange={(e) => setFilter('excludeRed', e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Exclude overvalued (RED)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeNAValuation}
                    onChange={(e) => setFilter('includeNAValuation', e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Include N/A valuation</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Min Market Cap</label>
                  <select
                    value={filters.minMarketCap ?? ''}
                    onChange={(e) => setFilter('minMarketCap', e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="1000000000">$1B+</option>
                    <option value="10000000000">$10B+</option>
                    <option value="50000000000">$50B+</option>
                    <option value="100000000000">$100B+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max Debt/Equity</label>
                  <select
                    value={filters.maxDebtEquity ?? ''}
                    onChange={(e) => setFilter('maxDebtEquity', e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="0.5">≤ 0.5</option>
                    <option value="1">≤ 1.0</option>
                    <option value="2">≤ 2.0</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max Beta</label>
                  <select
                    value={filters.maxBeta ?? ''}
                    onChange={(e) => setFilter('maxBeta', e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="1">≤ 1.0</option>
                    <option value="1.5">≤ 1.5</option>
                    <option value="2">≤ 2.0</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Min Confidence</label>
                  <select
                    value={filters.minConfidence ?? ''}
                    onChange={(e) => setFilter('minConfidence', e.target.value as any || null)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Any</option>
                    <option value="low">Low+</option>
                    <option value="medium">Medium+</option>
                    <option value="high">High only</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.section>
      </div>
      
      {/* Fixed Bottom Button - positioned above mobile nav */}
      <div className="fixed left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent fixed-bottom-cta md:bottom-0">
        <div className="max-w-2xl mx-auto">
          <motion.button
            onClick={runScreener}
            disabled={!isValid}
            whileHover={{ scale: isValid ? 1.01 : 1 }}
            whileTap={{ scale: isValid ? 0.99 : 1 }}
            className={cn(
              'w-full h-14 rounded-2xl font-semibold text-lg transition-all shadow-ios-lg',
              isValid
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            Screen {filters.sectors.length > 0 && `${filters.sectors.length} Sector${filters.sectors.length > 1 ? 's' : ''}`}
            {filters.includeIranGulf && filters.sectors.length > 0 && ' + Gulf Scenario'}
            {filters.includeIranGulf && filters.sectors.length === 0 && 'Gulf Scenario'}
          </motion.button>
          
          {!isValid && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Select at least one sector or enable the Gulf scenario
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
