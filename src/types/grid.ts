export type FuelType = 
  | 'solar'
  | 'wind'
  | 'nuclear'
  | 'hydro'
  | 'gas'
  | 'coal'
  | 'biomass'
  | 'storage'
  | 'imports'
  | 'other';

export interface FuelGeneration {
  fuel: FuelType;
  label: string;
  mw: number;
  percentage: number;
  isClean: boolean;
  color: string;
}

export interface InterconnectorFlow {
  id: string;
  name: string;
  fromRegion: string;
  toRegion: string;
  flowMw: number; // positive = importing, negative = exporting
  capacityMw: number;
}

export interface HourlyForecastPoint {
  hour: number; // 0 to 23 (relative to current hour or clock)
  timeLabel: string;
  pricePerMwh: number;
  carbonIntensity: number; // gCO2/kWh
  renewablePercentage: number;
  demandMw: number;
}

export interface GridAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

export interface GridRegion {
  id: string;
  name: string;
  country: string;
  flag: string;
  continent: 'Europe' | 'North America' | 'Asia-Pacific' | 'Latin America' | 'Asia';
  coordinates: { x: number; y: number; lat: number; lng: number }; // SVG map coordinates + real geo
  gridOperator: string;
  currency: string;
  currencySymbol: string;
  
  // Real-time live metrics
  currentDemandMw: number;
  peakCapacityMw: number;
  systemFrequencyHz: number; // e.g. 50.02 or 60.01
  nominalFrequencyHz: 50 | 60;
  frequencyStatus: 'optimal' | 'low' | 'high';
  
  carbonIntensity: number; // gCO2eq/kWh
  carbonRating: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  
  wholesalePricePerMwh: number; // In local currency
  priceInUsdPerMwh: number; // USD normalized for arbitrage comparison
  
  renewablePercentage: number;
  cleanEnergyPercentage: number; // Renewables + Nuclear
  
  generationMix: FuelGeneration[];
  interconnectors: InterconnectorFlow[];
  forecast24h: HourlyForecastPoint[];
  alerts: GridAlert[];
  
  isLiveApiSupported?: boolean;
  apiSource?: string;
  lastUpdated: string;
}
