import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Building,
  Flame,
  Zap,
  Battery,
  Atom,
  Filter,
  ExternalLink,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  Info,
  DollarSign,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValuationBadge } from '@/components/ValuationBadge';

// Seed data for private bets
const PRIVATE_BETS = [
  {
    id: '1',
    company: 'Fervo Energy',
    category: 'Geothermal',
    description: 'Next-generation enhanced geothermal systems (EGS) using horizontal drilling',
    thesis: 'Enhanced geothermal can provide 24/7 carbon-free baseload power. Fervo\'s technology applies fracking techniques to unlock vast geothermal resources previously inaccessible.',
    investors: ['Breakthrough Energy Ventures', 'DCVC', 'Capricorn Investment Group'],
    confidence: 'high',
    funding: '$462M Series E',
    fundingDate: 'Dec 2024',
    headquarters: 'Houston, TX',
    website: 'https://fervoenergy.com',
    icon: Flame,
    proxies: [
      { ticker: 'BKR', name: 'Baker Hughes', role: 'Drilling services', exposure: 4, valuation: 'green' as const },
      { ticker: 'HAL', name: 'Halliburton', role: 'Drilling/completions', exposure: 4, valuation: 'yellow' as const },
      { ticker: 'SLB', name: 'Schlumberger', role: 'Oilfield services', exposure: 3, valuation: 'green' as const },
      { ticker: 'NOV', name: 'NOV Inc', role: 'Drilling equipment', exposure: 3, valuation: 'green' as const },
    ],
    suppliers: [
      { ticker: 'CAT', name: 'Caterpillar', role: 'Heavy equipment', exposure: 2, valuation: 'yellow' as const },
      { ticker: 'PCAR', name: 'PACCAR', role: 'Transport/logistics', exposure: 2, valuation: 'green' as const },
    ]
  },
  {
    id: '2',
    company: 'Exowatt',
    category: 'LDES',
    description: 'Thermal battery for long-duration energy storage using molten silicon',
    thesis: 'Data center power demand is exploding. Exowatt\'s thermal batteries could provide cost-effective 24/7 power for AI infrastructure without grid dependency.',
    investors: ['Sam Altman', 'Andreessen Horowitz'],
    confidence: 'medium',
    funding: '$50M+',
    fundingDate: 'Feb 2025',
    headquarters: 'San Francisco, CA',
    website: 'https://exowatt.com',
    icon: Battery,
    proxies: [
      { ticker: 'FSLR', name: 'First Solar', role: 'Solar + storage integration', exposure: 3, valuation: 'yellow' as const },
      { ticker: 'ENPH', name: 'Enphase Energy', role: 'Power electronics', exposure: 3, valuation: 'red' as const },
      { ticker: 'SEDG', name: 'SolarEdge', role: 'Inverters/power', exposure: 3, valuation: 'green' as const },
    ],
    suppliers: [
      { ticker: 'AEHR', name: 'Aehr Test Systems', role: 'Silicon testing', exposure: 2, valuation: 'yellow' as const },
    ]
  },
  {
    id: '3',
    company: 'Commonwealth Fusion Systems',
    category: 'Fusion',
    description: 'High-field superconducting magnets for compact fusion reactors',
    thesis: 'CFS is building SPARC, a compact tokamak using high-temperature superconductors. If successful, fusion could provide unlimited clean baseload power.',
    investors: ['Breakthrough Energy Ventures', 'Tiger Global', 'Google'],
    confidence: 'high',
    funding: '$2B+',
    fundingDate: 'Dec 2021',
    headquarters: 'Devens, MA',
    website: 'https://cfs.energy',
    icon: Atom,
    proxies: [
      { ticker: 'AMSC', name: 'American Superconductor', role: 'HTS wire/magnets', exposure: 5, valuation: 'yellow' as const },
      { ticker: 'BWA', name: 'BorgWarner', role: 'Power electronics', exposure: 2, valuation: 'green' as const },
      { ticker: 'ON', name: 'ON Semiconductor', role: 'Power semiconductors', exposure: 2, valuation: 'green' as const },
    ],
    suppliers: [
      { ticker: 'APD', name: 'Air Products', role: 'Industrial gases (helium)', exposure: 3, valuation: 'yellow' as const },
      { ticker: 'LIN', name: 'Linde', role: 'Industrial gases', exposure: 3, valuation: 'green' as const },
    ]
  },
  {
    id: '4',
    company: 'General Fusion',
    category: 'Fusion',
    description: 'Magnetized target fusion using liquid metal compression',
    thesis: 'General Fusion\'s approach uses pistons to compress plasma, potentially simpler than tokamak designs. Building demonstration plant in UK.',
    investors: ['Breakthrough Energy Ventures', 'Jeff Bezos', 'Temasek'],
    confidence: 'medium',
    funding: '$400M+',
    fundingDate: 'Jan 2022',
    headquarters: 'Vancouver, BC',
    website: 'https://generalfusion.com',
    icon: Atom,
    proxies: [
      { ticker: 'AMSC', name: 'American Superconductor', role: 'Magnets/power systems', exposure: 4, valuation: 'yellow' as const },
      { ticker: 'CRS', name: 'Carpenter Technology', role: 'Specialty alloys', exposure: 3, valuation: 'green' as const },
    ],
    suppliers: [
      { ticker: 'APD', name: 'Air Products', role: 'Industrial gases', exposure: 3, valuation: 'yellow' as const },
    ]
  },
  {
    id: '5',
    company: 'Helion Energy',
    category: 'Fusion',
    description: 'Field-reversed configuration fusion with direct electricity conversion',
    thesis: 'Helion has a unique approach that converts fusion energy directly to electricity. Has a power purchase agreement with Microsoft starting 2028.',
    investors: ['Sam Altman (CEO)', 'SoftBank Vision Fund', 'Dustin Moskovitz'],
    confidence: 'high',
    funding: '$5.4B valuation',
    fundingDate: 'Jan 2025',
    headquarters: 'Everett, WA',
    website: 'https://helionenergy.com',
    icon: Zap,
    proxies: [
      { ticker: 'AMSC', name: 'American Superconductor', role: 'Power electronics', exposure: 4, valuation: 'yellow' as const },
      { ticker: 'VST', name: 'Vistra', role: 'Power offtaker', exposure: 2, valuation: 'green' as const },
      { ticker: 'CEG', name: 'Constellation Energy', role: 'Power offtaker', exposure: 2, valuation: 'yellow' as const },
    ],
    suppliers: [
      { ticker: 'WIRE', name: 'Encore Wire', role: 'High-power cabling', exposure: 2, valuation: 'green' as const },
    ]
  },
];

const CATEGORIES = ['All', 'Geothermal', 'Fusion', 'LDES'];

export default function PrivateBets() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set(['1']));

  const filteredBets = PRIVATE_BETS.filter(
    bet => selectedCategory === 'All' || bet.category === selectedCategory
  );

  const toggleExpand = (id: string) => {
    setExpandedBets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getConfidenceBadge = (confidence: string) => {
    const styles = {
      high: 'bg-signal-green-bg text-[hsl(var(--signal-green))]',
      medium: 'bg-signal-yellow-bg text-[hsl(var(--signal-yellow))]',
      low: 'bg-muted text-muted-foreground'
    };
    return styles[confidence as keyof typeof styles] || styles.low;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/signals" className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Private Bets + Public Proxies</h1>
              <p className="text-sm text-muted-foreground">
                Billionaire-backed private companies & their public exposure paths
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-card rounded-xl p-3 border border-border">
          <span className="flex items-center gap-1">
            <Building className="h-3 w-3" /> Private (not investable directly)
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Public Proxies (publicly traded exposure)
          </span>
        </div>

        {/* Private Bets List */}
        {filteredBets.map((bet, index) => {
          const Icon = bet.icon;
          const isExpanded = expandedBets.has(bet.id);

          return (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpand(bet.id)}
                className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">{bet.company}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        {bet.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Private
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{bet.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {bet.funding}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {bet.investors.length} investors
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-full', getConfidenceBadge(bet.confidence))}>
                        {bet.confidence} confidence
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-4">
                      {/* Thesis */}
                      <div className="bg-accent/30 rounded-xl p-4">
                        <h4 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          Investment Thesis
                        </h4>
                        <p className="text-sm text-muted-foreground">{bet.thesis}</p>
                      </div>

                      {/* Key Investors */}
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-2">Key Investors</h4>
                        <div className="flex flex-wrap gap-2">
                          {bet.investors.map(investor => (
                            <span key={investor} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                              {investor}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs">Last Funding</div>
                          <div className="font-medium text-foreground">{bet.funding}</div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs">Date</div>
                          <div className="font-medium text-foreground">{bet.fundingDate}</div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs">HQ</div>
                          <div className="font-medium text-foreground">{bet.headquarters}</div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs">Website</div>
                          <a 
                            href={bet.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Public Proxies */}
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-signal-green" />
                          Public Proxies (Investable)
                        </h4>
                        <div className="grid gap-2">
                          {bet.proxies.map(proxy => (
                            <div key={proxy.ticker} className="flex items-center justify-between p-3 bg-signal-green-bg/30 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="font-semibold text-foreground">{proxy.ticker}</div>
                                <div className="text-sm text-muted-foreground">{proxy.name}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{proxy.role}</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                      key={i}
                                      className={cn(
                                        'w-2 h-2 rounded-full',
                                        i <= proxy.exposure ? 'bg-primary' : 'bg-secondary'
                                      )}
                                    />
                                  ))}
                                </div>
                                <ValuationBadge flag={proxy.valuation} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suppliers */}
                      {bet.suppliers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            Public Suppliers
                          </h4>
                          <div className="grid gap-2">
                            {bet.suppliers.map(supplier => (
                              <div key={supplier.ticker} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="font-semibold text-foreground">{supplier.ticker}</div>
                                  <div className="text-sm text-muted-foreground">{supplier.name}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">{supplier.role}</span>
                                  <ValuationBadge flag={supplier.valuation} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pt-4">
          Private companies cannot be invested in directly. Proxies and suppliers are suggestions for potential indirect exposure.
          Always do your own research. This is not financial advice.
        </p>
      </div>
    </div>
  );
}
