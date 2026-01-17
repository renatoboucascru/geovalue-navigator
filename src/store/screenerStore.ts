import { create } from 'zustand';
import { Stock, RiskProfile, Sector, ScreenerFilters, PortfolioAllocation } from '@/types/stock';
import { seedStocks, SECTORS } from '@/data/seedStocks';
import { computeValuationFlag, computeCompositeScore, filterStocks, computeAllocation } from '@/lib/scoring';

interface ScreenerState {
  // Input state
  investmentAmount: number;
  riskProfile: RiskProfile;
  filters: ScreenerFilters;
  
  // Stock data
  allStocks: Stock[];
  filteredStocks: Stock[];
  allocations: PortfolioAllocation[];
  lockedAllocations: Map<string, number>;
  
  // UI state
  isLoading: boolean;
  step: 'input' | 'results' | 'detail';
  selectedStockId: string | null;
  
  // Actions
  setInvestmentAmount: (amount: number) => void;
  setRiskProfile: (profile: RiskProfile) => void;
  toggleSector: (sector: Sector) => void;
  setIncludeIranGulf: (include: boolean) => void;
  setFilter: <K extends keyof ScreenerFilters>(key: K, value: ScreenerFilters[K]) => void;
  runScreener: () => void;
  toggleLock: (stockId: string) => void;
  selectStock: (stockId: string | null) => void;
  setStep: (step: 'input' | 'results' | 'detail') => void;
  reset: () => void;
}

const initialFilters: ScreenerFilters = {
  sectors: [],
  includeIranGulf: false,
  minMarketCap: null,
  maxDebtEquity: null,
  maxBeta: null,
  minConfidence: null,
  excludeRed: false
};

// Initialize stocks with computed scores
function initializeStocks(riskProfile: RiskProfile): Stock[] {
  return seedStocks.map(stock => ({
    ...stock,
    valuationFlag: computeValuationFlag(stock),
    compositeScore: computeCompositeScore(
      { ...stock, valuationFlag: computeValuationFlag(stock) },
      riskProfile
    )
  }));
}

export const useScreenerStore = create<ScreenerState>((set, get) => ({
  investmentAmount: 10000,
  riskProfile: 'moderate',
  filters: initialFilters,
  allStocks: initializeStocks('moderate'),
  filteredStocks: [],
  allocations: [],
  lockedAllocations: new Map(),
  isLoading: false,
  step: 'input',
  selectedStockId: null,

  setInvestmentAmount: (amount) => set({ investmentAmount: amount }),
  
  setRiskProfile: (profile) => {
    const stocks = initializeStocks(profile);
    set({ riskProfile: profile, allStocks: stocks });
  },
  
  toggleSector: (sector) => set((state) => {
    const sectors = state.filters.sectors.includes(sector)
      ? state.filters.sectors.filter(s => s !== sector)
      : [...state.filters.sectors, sector];
    return { filters: { ...state.filters, sectors } };
  }),
  
  setIncludeIranGulf: (include) => set((state) => ({
    filters: { ...state.filters, includeIranGulf: include }
  })),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  runScreener: () => {
    set({ isLoading: true });
    
    setTimeout(() => {
      const { allStocks, filters, investmentAmount, riskProfile, lockedAllocations } = get();
      
      const filtered = filterStocks(allStocks, filters);
      const allocations = computeAllocation(filtered, investmentAmount, riskProfile, lockedAllocations);
      
      set({
        filteredStocks: filtered,
        allocations,
        isLoading: false,
        step: 'results'
      });
    }, 800);
  },
  
  toggleLock: (stockId) => set((state) => {
    const newLocked = new Map(state.lockedAllocations);
    const allocation = state.allocations.find(a => a.stock.id === stockId);
    
    if (newLocked.has(stockId)) {
      newLocked.delete(stockId);
    } else if (allocation) {
      newLocked.set(stockId, allocation.percentWeight);
    }
    
    // Recompute allocations
    const allocations = computeAllocation(
      state.filteredStocks,
      state.investmentAmount,
      state.riskProfile,
      newLocked
    );
    
    return { lockedAllocations: newLocked, allocations };
  }),
  
  selectStock: (stockId) => set({ 
    selectedStockId: stockId,
    step: stockId ? 'detail' : 'results'
  }),
  
  setStep: (step) => set({ step }),
  
  reset: () => set({
    investmentAmount: 10000,
    riskProfile: 'moderate',
    filters: initialFilters,
    filteredStocks: [],
    allocations: [],
    lockedAllocations: new Map(),
    step: 'input',
    selectedStockId: null
  })
}));
