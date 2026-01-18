import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitFork, 
  Search, 
  Filter, 
  ChevronRight,
  ChevronDown,
  Building2,
  Factory,
  AlertTriangle,
  Globe,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupplierNode {
  id: string;
  ticker: string;
  name: string;
  role: string;
  dependencyStrength: number;
  geoRisk: number;
  confidence: string;
  valueChainLayer?: string;
}

interface StockWithSuppliers {
  id: string;
  ticker: string;
  name: string;
  suppliers: SupplierNode[];
  customers: SupplierNode[];
}

// Seed data for supply chain visualization (until DB is seeded)
const mockSupplyChainData: StockWithSuppliers[] = [
  {
    id: '1',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    suppliers: [
      { id: 's1', ticker: 'TSM', name: 'Taiwan Semiconductor', role: 'Foundry (Advanced Nodes)', dependencyStrength: 5, geoRisk: 5, confidence: 'high', valueChainLayer: 'Foundry' },
      { id: 's2', ticker: 'ASML', name: 'ASML Holding', role: 'EUV Lithography', dependencyStrength: 5, geoRisk: 2, confidence: 'high', valueChainLayer: 'Lithography' },
      { id: 's3', ticker: 'LRCX', name: 'Lam Research', role: 'Etch Equipment', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Deposition/Etch' },
      { id: 's4', ticker: 'AMAT', name: 'Applied Materials', role: 'Deposition Equipment', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Deposition/Etch' },
      { id: 's5', ticker: 'KLAC', name: 'KLA Corporation', role: 'Metrology/Inspection', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Metrology/Inspection' },
      { id: 's6', ticker: 'MU', name: 'Micron Technology', role: 'HBM Memory', dependencyStrength: 5, geoRisk: 2, confidence: 'high', valueChainLayer: 'Memory (HBM/DRAM)' },
      { id: 's7', ticker: 'SNPS', name: 'Synopsys', role: 'EDA Software', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'EDA' },
      { id: 's8', ticker: 'CDNS', name: 'Cadence Design', role: 'EDA Software', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'EDA' },
    ],
    customers: [
      { id: 'c1', ticker: 'MSFT', name: 'Microsoft', role: 'Cloud/AI', dependencyStrength: 4, geoRisk: 1, confidence: 'high' },
      { id: 'c2', ticker: 'GOOGL', name: 'Alphabet', role: 'Cloud/AI', dependencyStrength: 4, geoRisk: 1, confidence: 'high' },
      { id: 'c3', ticker: 'AMZN', name: 'Amazon', role: 'AWS', dependencyStrength: 4, geoRisk: 1, confidence: 'high' },
      { id: 'c4', ticker: 'META', name: 'Meta Platforms', role: 'AI Infrastructure', dependencyStrength: 4, geoRisk: 1, confidence: 'high' },
      { id: 'c5', ticker: 'TSLA', name: 'Tesla', role: 'FSD Compute', dependencyStrength: 3, geoRisk: 1, confidence: 'medium' },
    ]
  },
  {
    id: '2',
    ticker: 'TSM',
    name: 'Taiwan Semiconductor',
    suppliers: [
      { id: 's9', ticker: 'ASML', name: 'ASML Holding', role: 'EUV Lithography', dependencyStrength: 5, geoRisk: 2, confidence: 'high', valueChainLayer: 'Lithography' },
      { id: 's10', ticker: 'LRCX', name: 'Lam Research', role: 'Etch Equipment', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Deposition/Etch' },
      { id: 's11', ticker: 'AMAT', name: 'Applied Materials', role: 'Deposition', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Deposition/Etch' },
      { id: 's12', ticker: 'TOELY', name: 'Tokyo Electron', role: 'Coater/Developer', dependencyStrength: 4, geoRisk: 2, confidence: 'high', valueChainLayer: 'Semi Equipment' },
      { id: 's13', ticker: 'ENTG', name: 'Entegris', role: 'Specialty Chemicals', dependencyStrength: 3, geoRisk: 1, confidence: 'high', valueChainLayer: 'Specialty Chemicals' },
    ],
    customers: [
      { id: 'c6', ticker: 'NVDA', name: 'NVIDIA', role: 'GPUs', dependencyStrength: 5, geoRisk: 1, confidence: 'high' },
      { id: 'c7', ticker: 'AMD', name: 'AMD', role: 'CPUs/GPUs', dependencyStrength: 5, geoRisk: 1, confidence: 'high' },
      { id: 'c8', ticker: 'AAPL', name: 'Apple', role: 'iPhone/Mac Chips', dependencyStrength: 5, geoRisk: 1, confidence: 'high' },
      { id: 'c9', ticker: 'QCOM', name: 'Qualcomm', role: 'Mobile SoCs', dependencyStrength: 4, geoRisk: 1, confidence: 'high' },
    ]
  },
  {
    id: '3',
    ticker: 'LMT',
    name: 'Lockheed Martin',
    suppliers: [
      { id: 's14', ticker: 'RTX', name: 'RTX Corporation', role: 'Missiles/Electronics', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Missile Defense' },
      { id: 's15', ticker: 'NOC', name: 'Northrop Grumman', role: 'Avionics/Sensors', dependencyStrength: 4, geoRisk: 1, confidence: 'high', valueChainLayer: 'Sensors/Avionics' },
      { id: 's16', ticker: 'LHX', name: 'L3Harris', role: 'Communications', dependencyStrength: 3, geoRisk: 1, confidence: 'high', valueChainLayer: 'Communications' },
      { id: 's17', ticker: 'GD', name: 'General Dynamics', role: 'IT/Comms', dependencyStrength: 3, geoRisk: 1, confidence: 'high', valueChainLayer: 'Communications' },
    ],
    customers: [
      { id: 'c10', ticker: 'DOD', name: 'U.S. Department of Defense', role: 'F-35, Missiles', dependencyStrength: 5, geoRisk: 1, confidence: 'high' },
    ]
  }
];

export default function SupplyChain() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockWithSuppliers | null>(mockSupplyChainData[0]);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['Foundry', 'Lithography', 'Memory (HBM/DRAM)']));

  const filteredStocks = mockSupplyChainData.filter(s => 
    s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSuppliers = selectedStock?.suppliers.reduce((acc, supplier) => {
    const layer = supplier.valueChainLayer || 'Other';
    if (!acc[layer]) acc[layer] = [];
    acc[layer].push(supplier);
    return acc;
  }, {} as Record<string, SupplierNode[]>) || {};

  const toggleLayer = (layer: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Supply Chain</h1>
          <p className="text-sm text-muted-foreground">
            Explore customer → supplier relationships by value chain layer
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Left Panel - Stock Picker */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks..."
                className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Stock List */}
            <div className="space-y-2">
              {filteredStocks.map(stock => (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className={cn(
                    'w-full p-3 rounded-xl border text-left transition-all',
                    selectedStock?.id === stock.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  )}
                >
                  <div className="font-semibold text-foreground">{stock.ticker}</div>
                  <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stock.suppliers.length} suppliers • {stock.customers.length} customers
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Graph View */}
          <div className="md:col-span-3">
            {selectedStock ? (
              <motion.div
                key={selectedStock.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Selected Stock Header */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground">{selectedStock.ticker}</h2>
                      <p className="text-muted-foreground">{selectedStock.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Supply Chain Coverage</div>
                      <div className="text-2xl font-bold text-foreground">
                        {selectedStock.suppliers.length + selectedStock.customers.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hierarchical Tree View */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Suppliers (Upstream) */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Factory className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Suppliers (Upstream)</h3>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(groupedSuppliers).map(([layer, suppliers]) => (
                        <div key={layer} className="border border-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleLayer(layer)}
                            className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <span className="font-medium text-foreground text-sm">{layer}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {suppliers.length}
                              </span>
                              {expandedLayers.has(layer) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          
                          {expandedLayers.has(layer) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="p-2 space-y-2"
                            >
                              {suppliers.map(supplier => (
                                <div
                                  key={supplier.id}
                                  className="flex items-center justify-between p-2 bg-background rounded-lg"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {supplier.ticker}
                                      </span>
                                      {supplier.geoRisk >= 4 && (
                                        <AlertTriangle className="h-3 w-3 text-signal-yellow" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {supplier.role}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                      <div
                                        key={i}
                                        className={cn(
                                          'w-2 h-2 rounded-full',
                                          i <= supplier.dependencyStrength
                                            ? 'bg-primary'
                                            : 'bg-secondary'
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customers (Downstream) */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5 text-accent-foreground" />
                      <h3 className="font-semibold text-foreground">Customers (Downstream)</h3>
                    </div>

                    <div className="space-y-2">
                      {selectedStock.customers.map(customer => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground">{customer.ticker}</div>
                            <p className="text-sm text-muted-foreground truncate">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.role}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                              Dep: {customer.dependencyStrength}/5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Concentration Insights */}
                <div className="bg-signal-yellow-bg rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <Globe className="h-6 w-6 text-signal-yellow flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Concentration Insights</h3>
                      <ul className="space-y-2 text-sm text-foreground">
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-signal-yellow" />
                          <span>Critical dependency on Taiwan for advanced foundry (TSM: 5/5)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-signal-yellow" />
                          <span>Single source for EUV lithography (ASML: Netherlands)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span>US-based equipment suppliers reduce geo risk for etch/deposition</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Select a stock to view its supply chain
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
