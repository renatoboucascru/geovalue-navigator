// Database types aligned with Supabase schema
import { Database } from '@/integrations/supabase/types';

// Type aliases for convenience
export type DbStock = Database['public']['Tables']['stocks']['Row'];
export type DbStockInsert = Database['public']['Tables']['stocks']['Insert'];
export type DbSector = Database['public']['Tables']['sectors']['Row'];
export type DbTheme = Database['public']['Tables']['themes']['Row'];
export type DbSupplierMapping = Database['public']['Tables']['supplier_mappings']['Row'];
export type DbPortfolio = Database['public']['Tables']['portfolios']['Row'];
export type DbPortfolioHolding = Database['public']['Tables']['portfolio_holdings']['Row'];
export type DbWatchlist = Database['public']['Tables']['watchlists']['Row'];
export type DbWatchlistItem = Database['public']['Tables']['watchlist_items']['Row'];
export type DbUserAlert = Database['public']['Tables']['user_alerts']['Row'];
export type DbSavedFilter = Database['public']['Tables']['saved_filters']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbValuationThreshold = Database['public']['Tables']['valuation_thresholds']['Row'];

// Risk profile type
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

// Valuation flag type
export type ValuationFlag = 'green' | 'yellow' | 'red' | 'na';

// Confidence type
export type Confidence = 'high' | 'medium' | 'low';

// Sector names
export type SectorName =
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

// Extended stock with joined data
export interface StockWithSectors extends DbStock {
  sectors: SectorName[];
  stock_sectors?: { sector_id: string; sectors: DbSector }[];
}

// Portfolio with holdings
export interface PortfolioWithHoldings extends DbPortfolio {
  holdings: (DbPortfolioHolding & { stock: DbStock })[];
}

// Watchlist with items
export interface WatchlistWithItems extends DbWatchlist {
  items: (DbWatchlistItem & { stock: DbStock })[];
}

// Supplier mapping with stock details
export interface SupplierMappingWithStocks extends DbSupplierMapping {
  customer: DbStock;
  supplier: DbStock;
}

// Portfolio allocation for screener
export interface PortfolioAllocation {
  stock: StockWithSectors;
  dollarAmount: number;
  percentWeight: number;
  locked: boolean;
}

// Screener filters
export interface ScreenerFilters {
  sectors: SectorName[];
  includeIranGulf: boolean;
  minMarketCap: number | null;
  maxDebtEquity: number | null;
  maxBeta: number | null;
  minConfidence: Confidence | null;
  excludeRed: boolean;
}

// Value chain layers for supplier categorization
export type ValueChainLayer =
  | 'GPUs/Accelerators'
  | 'CPUs'
  | 'Memory (HBM/DRAM)'
  | 'Networking'
  | 'Storage'
  | 'Servers/ODM/OEM'
  | 'Power (PDUs/Switchgear)'
  | 'Cooling'
  | 'Connectors/Cables'
  | 'EDA'
  | 'OSAT/Packaging'
  | 'Foundry'
  | 'Semi Equipment'
  | 'Semiconductor Materials'
  | 'Lithography'
  | 'Deposition/Etch'
  | 'Metrology/Inspection'
  | 'Test'
  | 'Substrates/ABF'
  | 'Specialty Chemicals'
  | 'Wafers'
  | 'Industrial Gases'
  | 'Prime Defense'
  | 'Missile Defense'
  | 'Sensors/Avionics'
  | 'Radars'
  | 'Propulsion'
  | 'Communications'
  | 'Satellite Payloads'
  | 'Airframes/Composites'
  | 'Specialty Metals'
  | 'Uranium Mining'
  | 'Conversion/Enrichment'
  | 'Fuel Fabrication'
  | 'Reactor Components'
  | 'SMR Developers'
  | 'Cell Makers'
  | 'Cathode/Anode Materials'
  | 'Lithium/Nickel/Cobalt'
  | 'Separators/Electrolytes'
  | 'Pack Integrators'
  | 'Charging Infrastructure'
  | 'Power Semis'
  | 'Mining'
  | 'Refining/Processing'
  | 'Magnet Makers'
  | 'Launch'
  | 'Satellite Buses'
  | 'Ground Stations'
  | 'Optical Comms'
  | 'Space Electronics'
  | 'Cyber Vendors'
  | 'Exchanges/Custody'
  | 'ADAS Compute'
  | 'Sensor Stack'
  | 'Mapping'
  | 'Auto Suppliers'
  | 'OEMs';

// Scenario types
export type ScenarioType =
  | 'Iran/Gulf Escalation'
  | 'US-China Export Controls'
  | 'Taiwan Risk'
  | 'Energy Shock'
  | 'Defense Spending Surge'
  | 'Rate Cuts / Liquidity Rebound';
