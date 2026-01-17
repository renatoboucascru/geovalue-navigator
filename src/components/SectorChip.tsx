import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sector } from '@/types/stock';
import { 
  Cpu, Rocket, Bitcoin, Flame, Plane, Atom, Shield, Bot, 
  Battery, Zap, Heart, Mountain, Factory, Gem, Car, Brain
} from 'lucide-react';

interface SectorChipProps {
  sector: Sector;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const sectorIcons: Record<Sector, React.ElementType> = {
  'AI': Brain,
  'Chips': Cpu,
  'Space': Rocket,
  'Crypto': Bitcoin,
  'Energy': Flame,
  'Drones': Plane,
  'Nuclear': Atom,
  'Defense': Shield,
  'Robotics': Bot,
  'Batteries': Battery,
  'Quantum': Zap,
  'Healthcare': Heart,
  'Rare Earths': Mountain,
  'Manufacturing': Factory,
  'Critical Minerals': Gem,
  'Self-Driving Cars': Car
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2'
};

export const SectorChip: React.FC<SectorChipProps> = ({
  sector,
  selected = false,
  onClick,
  disabled = false,
  size = 'md'
}) => {
  const Icon = sectorIcons[sector];
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        'border focus:outline-none focus:ring-2 focus:ring-primary/20',
        sizeClasses[size],
        selected 
          ? 'bg-primary text-primary-foreground border-primary shadow-ios' 
          : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className={cn(
        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
      )} />
      <span>{sector}</span>
    </motion.button>
  );
};
