import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';

interface TraderModeFiltersProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  filters: TraderFilters;
  onFilterChange: (filters: TraderFilters) => void;
}

export interface TraderFilters {
  minRVOL: number | null;
  minDollarVolume: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minDayChange: number | null;
  preset: 'custom' | 'high-liquidity' | 'breakout' | 'large-cap';
}

const PRESETS: { value: TraderFilters['preset']; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'custom', label: 'Custom', description: 'Set your own filters', icon: Activity },
  { value: 'high-liquidity', label: 'High Liquidity Day Trade', description: 'RVOL > 1.5, Dollar Vol > $50M, Price > $5', icon: DollarSign },
  { value: 'breakout', label: 'Breakout Watch', description: 'RVOL > 2.0, Change > 5%', icon: Zap },
  { value: 'large-cap', label: 'Large-Cap Liquid', description: 'Market Cap > $10B, High Dollar Volume', icon: BarChart3 },
];

export const TraderModeFilters: React.FC<TraderModeFiltersProps> = ({
  enabled,
  onToggle,
  filters,
  onFilterChange,
}) => {
  const applyPreset = (preset: TraderFilters['preset']) => {
    switch (preset) {
      case 'high-liquidity':
        onFilterChange({
          preset,
          minRVOL: 1.5,
          minDollarVolume: 50000000,
          minPrice: 5,
          maxPrice: null,
          minDayChange: null,
        });
        break;
      case 'breakout':
        onFilterChange({
          preset,
          minRVOL: 2.0,
          minDollarVolume: 10000000,
          minPrice: 1,
          maxPrice: null,
          minDayChange: 5,
        });
        break;
      case 'large-cap':
        onFilterChange({
          preset,
          minRVOL: 1.0,
          minDollarVolume: 100000000,
          minPrice: 20,
          maxPrice: null,
          minDayChange: null,
        });
        break;
      default:
        onFilterChange({ ...filters, preset: 'custom' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
            enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <Label className="font-medium">Trader Mode</Label>
            <p className="text-xs text-muted-foreground">Volume & liquidity filters for active trading</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-4 bg-card rounded-2xl border border-border">
              {/* Presets */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = filters.preset === preset.value;
                    
                    return (
                      <button
                        key={preset.value}
                        onClick={() => applyPreset(preset.value)}
                        className={cn(
                          'flex items-start gap-2 p-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground'
                            : 'bg-background border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <div>
                          <span className="text-sm font-medium block">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Min Relative Volume</Label>
                  <Select
                    value={filters.minRVOL?.toString() || ''}
                    onValueChange={(v) => onFilterChange({ ...filters, preset: 'custom', minRVOL: v ? parseFloat(v) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">1.0x+</SelectItem>
                      <SelectItem value="1.5">1.5x+</SelectItem>
                      <SelectItem value="2">2.0x+</SelectItem>
                      <SelectItem value="3">3.0x+</SelectItem>
                      <SelectItem value="5">5.0x+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Min Dollar Volume</Label>
                  <Select
                    value={filters.minDollarVolume?.toString() || ''}
                    onValueChange={(v) => onFilterChange({ ...filters, preset: 'custom', minDollarVolume: v ? parseFloat(v) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1000000">$1M+</SelectItem>
                      <SelectItem value="10000000">$10M+</SelectItem>
                      <SelectItem value="50000000">$50M+</SelectItem>
                      <SelectItem value="100000000">$100M+</SelectItem>
                      <SelectItem value="500000000">$500M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={filters.minPrice || ''}
                    onChange={(e) => onFilterChange({ ...filters, preset: 'custom', minPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="h-10"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ''}
                    onChange={(e) => onFilterChange({ ...filters, preset: 'custom', maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="h-10"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Min Day Change %</Label>
                  <Select
                    value={filters.minDayChange?.toString() || ''}
                    onValueChange={(v) => onFilterChange({ ...filters, preset: 'custom', minDayChange: v ? parseFloat(v) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">+1%+</SelectItem>
                      <SelectItem value="3">+3%+</SelectItem>
                      <SelectItem value="5">+5%+</SelectItem>
                      <SelectItem value="10">+10%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const defaultTraderFilters: TraderFilters = {
  minRVOL: null,
  minDollarVolume: null,
  minPrice: null,
  maxPrice: null,
  minDayChange: null,
  preset: 'custom',
};
