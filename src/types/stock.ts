// Core types for GeoValue Screener

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export type ValuationFlag = 'green' | 'yellow' | 'red' | 'na';

export type Confidence = 'high' | 'medium' | 'low';

export type Sector =
  | 'AI'
  | 'Chips'
  | 'Space'
  | 'Crypto'
  | 'Energy'
  | 'Drones'
  | 'Nuclear'
  | 'Defense'
  | 'Robotics'
  | 'Batteries'
  | 'Quantum'
  | 'Healthcare'
  | 'Rare Earths'
  | 'Manufacturing'
  | 'Critical Minerals'
  | 'Self-Driving Cars';

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  country: string;
  exchange: string;
  sectors: Sector[];
  roles: string[];
  
  // Market data
  price: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  marketCap: number | null;
  
  // Valuation metrics
  peRatio: number | null;
  forwardPE: number | null;
  evEbitda: number | null;
  priceFCF: number | null;
  
  // Fundamentals
  debtEquity: number | null;
  dividendYield: number | null;
  beta: number | null;
  
  // Scoring
  valuationFlag: ValuationFlag;
  compositeScore: number;
  
  // Relationship data
  confidence: Confidence;
  publiclyTraded: boolean;
  geoConcentrationRisk: number; // 1-5
  scenarioTailwind: number; // 0-5
  
  // Iran/Gulf scenario specific
  iranGulfCategory?: string;
  
  // Metadata
  lastUpdated: Date;
  notes?: string;
  evidenceUrl?: string;
}

export interface SupplierMapping {
  id: string;
  customerTicker: string;
  supplierTicker: string;
  supplierRole: string;
  dependencyStrength: number; // 1-5
  geoConcentrationRisk: number; // 1-5
  confidence: Confidence;
  publiclyTraded: boolean;
  notes?: string;
  evidenceUrl?: string;
}

export interface PortfolioAllocation {
  stock: Stock;
  dollarAmount: number;
  percentWeight: number;
  locked: boolean;
}

export interface ScreenerFilters {
  sectors: Sector[];
  includeIranGulf: boolean;
  minMarketCap: number | null;
  maxDebtEquity: number | null;
  maxBeta: number | null;
  minConfidence: Confidence | null;
  excludeRed: boolean;
}

export interface ScreenerInput {
  investmentAmount: number;
  riskProfile: RiskProfile;
  filters: ScreenerFilters;
}

export interface SectorInfo {
  name: Sector;
  icon: string;
  description: string;
  stockCount: number;
}
