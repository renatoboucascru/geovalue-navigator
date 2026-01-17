import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ValuationFlag } from '@/types/stock';

interface ValuationBadgeProps {
  flag: ValuationFlag;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const flagConfig: Record<ValuationFlag, { label: string; className: string }> = {
  green: { label: 'Undervalued', className: 'signal-green' },
  yellow: { label: 'Fair Value', className: 'signal-yellow' },
  red: { label: 'Overvalued', className: 'signal-red' },
  na: { label: 'N/A', className: 'bg-secondary text-secondary-foreground' }
};

const sizeClasses = {
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-2.5 text-xs',
  lg: 'h-7 px-3 text-sm'
};

export const ValuationBadge: React.FC<ValuationBadgeProps> = ({ 
  flag, 
  size = 'md',
  showLabel = true 
}) => {
  const config = flagConfig[flag];
  
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        config.className
      )}
    >
      {showLabel ? config.label : flag.toUpperCase()}
    </motion.span>
  );
};
