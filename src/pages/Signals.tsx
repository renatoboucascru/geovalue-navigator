import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Building,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Signals() {
  const location = useLocation();

  const signalCategories = [
    {
      path: '/signals/private-bets',
      icon: Building,
      title: 'Private Bets + Public Proxies',
      description: 'VC-backed private companies and their publicly traded exposure paths',
      badge: 'Curated',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      path: '/signals/whale-tracker',
      icon: Users,
      title: '13F Whale Tracker',
      description: 'Track institutional holdings from major investors like Gates Foundation',
      badge: 'Coming Soon',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Signals</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Billionaire bets, 13F tracking, and alternative data signals
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Signal Categories */}
        <div className="space-y-4">
          {signalCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={category.path}
                  className="block bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', category.bgColor)}>
                      <Icon className={cn('h-7 w-7', category.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-foreground">{category.title}</h2>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          category.badge === 'Coming Soon' 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-primary/10 text-primary'
                        )}>
                          {category.badge}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-accent/50 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Lightbulb className="h-6 w-6 text-accent-foreground flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">How Signals Work</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Private Bets</strong> track where billionaires and top VCs are investing in private companies — and identify publicly-traded proxies to get exposure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>13F Tracker</strong> monitors quarterly SEC filings from major institutional investors to spot new positions and changes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Signal Boost</strong> (optional): Enable in Settings to slightly boost stocks in recommendations when whales are buying + valuation is favorable.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          For informational purposes only. Not financial advice. Always do your own research.
        </p>
      </div>
    </div>
  );
}
