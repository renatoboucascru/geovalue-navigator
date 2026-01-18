import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  GitFork, 
  Briefcase, 
  TrendingUp,
  Shield,
  Globe,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Search,
    title: 'Smart Screener',
    description: 'Find stocks by sector, valuation, and risk profile with AI-powered scoring.',
    path: '/screener',
    color: 'bg-primary'
  },
  {
    icon: GitFork,
    title: 'Supply Chain Map',
    description: 'Explore customer-supplier relationships and identify concentration risks.',
    path: '/supply-chain',
    color: 'bg-accent'
  },
  {
    icon: Briefcase,
    title: 'Portfolio Tracker',
    description: 'Build and track multiple portfolios with rebalancing suggestions.',
    path: '/portfolio',
    color: 'bg-signal-green'
  },
  {
    icon: Globe,
    title: 'Scenario Analysis',
    description: 'Model geopolitical scenarios like Iran/Gulf escalation.',
    path: '/screener',
    color: 'bg-signal-yellow'
  }
];

const stats = [
  { label: 'Stocks Covered', value: '200+' },
  { label: 'Sectors', value: '16' },
  { label: 'Supplier Mappings', value: '500+' },
  { label: 'Scenarios', value: '5' },
];

export default function Home() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              Version 2.0 Now Available
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {user ? `Welcome back, ${profile?.display_name || 'Investor'}` : 'GeoValue Screener'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Find and allocate money across stocks based on valuation signals, fundamentals, and geopolitical tailwinds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/screener"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg shadow-ios-lg hover:opacity-90 transition-opacity"
            >
              Start Screening
              <ChevronRight className="h-5 w-5" />
            </Link>
            {!user && (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl font-semibold text-lg hover:bg-secondary/80 transition-colors"
              >
                Sign In
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-foreground text-center mb-12"
          >
            Everything You Need for Smarter Investing
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={feature.path}
                    className="block p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-ios transition-all group"
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.color)}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Disclaimer
            </h2>
            <p className="text-muted-foreground mb-6">
              This tool is for informational purposes only. It does not constitute financial advice. 
              Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
            </p>
            <Link
              to="/screener"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              I understand, let's begin
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
