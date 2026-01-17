import { Stock, RiskProfile, ValuationFlag, Sector, PortfolioAllocation, ScreenerFilters } from '@/types/stock';

// Sector-specific valuation thresholds for P/E
const SECTOR_PE_THRESHOLDS: Record<string, { green: number; yellow: number }> = {
  'AI': { green: 35, yellow: 60 },
  'Chips': { green: 25, yellow: 45 },
  'Space': { green: 40, yellow: 80 },
  'Crypto': { green: 20, yellow: 50 },
  'Energy': { green: 12, yellow: 20 },
  'Drones': { green: 30, yellow: 55 },
  'Nuclear': { green: 25, yellow: 45 },
  'Defense': { green: 18, yellow: 28 },
  'Robotics': { green: 35, yellow: 60 },
  'Batteries': { green: 25, yellow: 45 },
  'Quantum': { green: 50, yellow: 100 },
  'Healthcare': { green: 25, yellow: 45 },
  'Rare Earths': { green: 20, yellow: 40 },
  'Manufacturing': { green: 15, yellow: 25 },
  'Critical Minerals': { green: 18, yellow: 35 },
  'Self-Driving Cars': { green: 40, yellow: 70 }
};

export function computeValuationFlag(stock: Stock): ValuationFlag {
  const pe = stock.forwardPE ?? stock.peRatio;
  
  if (pe === null || pe <= 0) return 'na';
  
  // Get thresholds for primary sector
  const primarySector = stock.sectors[0];
  const thresholds = SECTOR_PE_THRESHOLDS[primarySector] || { green: 20, yellow: 40 };
  
  if (pe <= thresholds.green) return 'green';
  if (pe <= thresholds.yellow) return 'yellow';
  return 'red';
}

// Weight configurations per risk profile
const WEIGHT_CONFIGS: Record<RiskProfile, {
  valuation: number;
  fundamentals: number;
  volatility: number;
  tailwind: number;
  geoRiskPenalty: number;
  confidence: number;
}> = {
  conservative: {
    valuation: 0.30,
    fundamentals: 0.30,
    volatility: 0.20,
    tailwind: 0.10,
    geoRiskPenalty: 0.10,
    confidence: 0.10
  },
  moderate: {
    valuation: 0.25,
    fundamentals: 0.20,
    volatility: 0.15,
    tailwind: 0.20,
    geoRiskPenalty: 0.10,
    confidence: 0.10
  },
  aggressive: {
    valuation: 0.15,
    fundamentals: 0.15,
    volatility: 0.10,
    tailwind: 0.35,
    geoRiskPenalty: 0.15,
    confidence: 0.10
  }
};

// Allocation constraints per risk profile
const ALLOCATION_CONSTRAINTS: Record<RiskProfile, {
  maxPerStock: number;
  maxPerSector: number;
  minMarketCap: number;
}> = {
  conservative: {
    maxPerStock: 0.08,
    maxPerSector: 0.35,
    minMarketCap: 10000000000 // 10B
  },
  moderate: {
    maxPerStock: 0.12,
    maxPerSector: 0.45,
    minMarketCap: 2000000000 // 2B
  },
  aggressive: {
    maxPerStock: 0.20,
    maxPerSector: 0.60,
    minMarketCap: 500000000 // 500M
  }
};

function valuationFlagToScore(flag: ValuationFlag): number {
  switch (flag) {
    case 'green': return 100;
    case 'yellow': return 60;
    case 'red': return 20;
    case 'na': return 50;
  }
}

function confidenceToScore(confidence: Stock['confidence']): number {
  switch (confidence) {
    case 'high': return 100;
    case 'medium': return 70;
    case 'low': return 40;
  }
}

function computeFundamentalsScore(stock: Stock): number {
  let score = 50;
  
  // Debt/Equity (lower is better, max 2)
  if (stock.debtEquity !== null) {
    if (stock.debtEquity < 0.5) score += 20;
    else if (stock.debtEquity < 1) score += 10;
    else if (stock.debtEquity > 2) score -= 15;
  }
  
  // EV/EBITDA (reasonable range 5-20 is good)
  if (stock.evEbitda !== null) {
    if (stock.evEbitda > 5 && stock.evEbitda < 15) score += 15;
    else if (stock.evEbitda < 25) score += 5;
    else score -= 10;
  }
  
  // P/FCF (lower is better for value)
  if (stock.priceFCF !== null) {
    if (stock.priceFCF < 15) score += 15;
    else if (stock.priceFCF < 30) score += 5;
    else score -= 10;
  }
  
  // Dividend yield bonus
  if (stock.dividendYield && stock.dividendYield > 2) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function computeVolatilityScore(stock: Stock): number {
  if (stock.beta === null) return 50;
  
  // Lower beta = higher score for conservative
  // Invert beta: 0.5 beta -> 90 score, 2.0 beta -> 40 score
  const score = Math.max(20, Math.min(100, 110 - (stock.beta * 35)));
  return score;
}

export function computeCompositeScore(stock: Stock, riskProfile: RiskProfile): number {
  const weights = WEIGHT_CONFIGS[riskProfile];
  
  const valuationScore = valuationFlagToScore(stock.valuationFlag);
  const fundamentalsScore = computeFundamentalsScore(stock);
  const volatilityScore = computeVolatilityScore(stock);
  const tailwindScore = (stock.scenarioTailwind / 5) * 100;
  const geoRiskScore = ((5 - stock.geoConcentrationRisk) / 4) * 100;
  const confScore = confidenceToScore(stock.confidence);
  
  const composite = 
    valuationScore * weights.valuation +
    fundamentalsScore * weights.fundamentals +
    volatilityScore * weights.volatility +
    tailwindScore * weights.tailwind +
    geoRiskScore * weights.geoRiskPenalty +
    confScore * weights.confidence;
  
  return Math.round(composite);
}

export function filterStocks(stocks: Stock[], filters: ScreenerFilters): Stock[] {
  return stocks.filter(stock => {
    // Sector filter
    if (filters.sectors.length > 0) {
      const hasMatchingSector = stock.sectors.some(s => filters.sectors.includes(s));
      const isIranGulf = filters.includeIranGulf && stock.iranGulfCategory;
      if (!hasMatchingSector && !isIranGulf) return false;
    }
    
    // Iran/Gulf filter
    if (filters.includeIranGulf && filters.sectors.length === 0) {
      if (!stock.iranGulfCategory) return false;
    }
    
    // Valuation flag filter
    if (filters.excludeRed && stock.valuationFlag === 'red') return false;
    
    // Market cap filter
    if (filters.minMarketCap && stock.marketCap !== null) {
      if (stock.marketCap < filters.minMarketCap) return false;
    }
    
    // Debt/Equity filter
    if (filters.maxDebtEquity && stock.debtEquity !== null) {
      if (stock.debtEquity > filters.maxDebtEquity) return false;
    }
    
    // Beta filter
    if (filters.maxBeta && stock.beta !== null) {
      if (stock.beta > filters.maxBeta) return false;
    }
    
    // Confidence filter
    if (filters.minConfidence) {
      const confOrder = { high: 3, medium: 2, low: 1 };
      if (confOrder[stock.confidence] < confOrder[filters.minConfidence]) return false;
    }
    
    return true;
  });
}

export function computeAllocation(
  stocks: Stock[],
  investmentAmount: number,
  riskProfile: RiskProfile,
  lockedAllocations: Map<string, number> = new Map()
): PortfolioAllocation[] {
  const constraints = ALLOCATION_CONSTRAINTS[riskProfile];
  
  // Filter by min market cap for risk profile
  const eligibleStocks = stocks.filter(s => 
    s.marketCap === null || s.marketCap >= constraints.minMarketCap
  );
  
  if (eligibleStocks.length === 0) return [];
  
  // Calculate total score for proportional allocation
  const totalScore = eligibleStocks.reduce((sum, s) => sum + s.compositeScore, 0);
  
  // Initial proportional allocation
  let allocations: PortfolioAllocation[] = eligibleStocks.map(stock => {
    const locked = lockedAllocations.get(stock.id);
    const percentWeight = locked !== undefined 
      ? locked 
      : (stock.compositeScore / totalScore);
    
    return {
      stock,
      dollarAmount: 0,
      percentWeight,
      locked: locked !== undefined
    };
  });
  
  // Enforce per-stock cap
  let totalUnlocked = 0;
  let excessWeight = 0;
  
  allocations.forEach(a => {
    if (!a.locked && a.percentWeight > constraints.maxPerStock) {
      excessWeight += a.percentWeight - constraints.maxPerStock;
      a.percentWeight = constraints.maxPerStock;
    }
    if (!a.locked) totalUnlocked += a.percentWeight;
  });
  
  // Redistribute excess
  if (excessWeight > 0 && totalUnlocked > 0) {
    allocations.forEach(a => {
      if (!a.locked && a.percentWeight < constraints.maxPerStock) {
        const boost = (a.percentWeight / totalUnlocked) * excessWeight;
        a.percentWeight = Math.min(a.percentWeight + boost, constraints.maxPerStock);
      }
    });
  }
  
  // Normalize to 100%
  const totalWeight = allocations.reduce((sum, a) => sum + a.percentWeight, 0);
  allocations.forEach(a => {
    a.percentWeight = a.percentWeight / totalWeight;
    a.dollarAmount = Math.round(investmentAmount * a.percentWeight * 100) / 100;
  });
  
  // Sort by allocation descending
  allocations.sort((a, b) => b.percentWeight - a.percentWeight);
  
  return allocations;
}

export function generateWhyIncluded(stock: Stock, riskProfile: RiskProfile): string {
  const reasons: string[] = [];
  
  // Valuation
  if (stock.valuationFlag === 'green') {
    reasons.push('attractively valued for its sector');
  } else if (stock.valuationFlag === 'yellow') {
    reasons.push('fairly valued with growth potential');
  }
  
  // Fundamentals
  if (stock.debtEquity !== null && stock.debtEquity < 0.5) {
    reasons.push('strong balance sheet');
  }
  if (stock.dividendYield && stock.dividendYield > 2) {
    reasons.push(`${stock.dividendYield.toFixed(1)}% dividend yield`);
  }
  
  // Risk profile specific
  if (riskProfile === 'conservative' && stock.beta !== null && stock.beta < 1) {
    reasons.push('lower volatility');
  }
  if (riskProfile === 'aggressive' && stock.scenarioTailwind >= 4) {
    reasons.push('strong scenario tailwinds');
  }
  
  // Sector exposure
  if (stock.sectors.length > 1) {
    reasons.push(`multi-theme exposure (${stock.sectors.slice(0, 2).join(', ')})`);
  }
  
  // Iran/Gulf specific
  if (stock.iranGulfCategory) {
    reasons.push(`may benefit from Gulf tensions (${stock.iranGulfCategory})`);
  }
  
  if (reasons.length === 0) {
    reasons.push('diversified portfolio exposure');
  }
  
  return reasons.slice(0, 3).join('; ');
}
