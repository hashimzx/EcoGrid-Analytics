export type WorkloadCategory = 
  | 'ai_training'
  | 'batch_compute'
  | 'bess_storage'
  | 'ev_fleet'
  | 'industrial_electrolyzer'
  | 'crypto_mining';

export interface WorkloadProfile {
  id: string;
  name: string;
  category: WorkloadCategory;
  companyName: string;
  powerDemandMw: number; // Constant power draw in MW
  durationHours: number; // Total hours required
  maxDelayHours: number; // Flexibility window: can start up to N hours from now
  urgency: 'immediate' | 'flexible' | 'overnight' | 'opportunistic';
  allowedRegions?: string[]; // null or empty means any region allowed
  complianceConstraint?: 'any' | 'eu_gdpr' | 'us_only' | 'local_only';
  priceCapPerMwh?: number;
  carbonCapGPerKwh?: number;
}

export interface RegionSpatialOpportunity {
  regionId: string;
  regionName: string;
  country: string;
  currentPriceUsd: number;
  currentCarbonIntensity: number;
  currentCleanPct: number;
  totalCostImmediate: number; // USD to run immediately for duration
  totalCarbonKgImmediate: number; // kg of CO2eq
  rankScore: number;
}

export interface TemporalOpportunityWindow {
  startHourOffset: number; // 0 = now, 1 = 1 hr from now, etc.
  targetStartTime: string;
  targetEndTime: string;
  averagePriceUsd: number;
  averageCarbonIntensity: number;
  averageCleanPct: number;
  totalCostUsd: number;
  totalCarbonKg: number;
  savingsVsImmediateUsd: number;
  savingsPercentage: number;
  carbonReductionKg: number;
  carbonReductionPercentage: number;
  curtailmentBonus: boolean; // true if negative/near-zero prices occur
}

export interface OptimizationResult {
  workload: WorkloadProfile;
  evaluatedAt: string;
  
  // Best region to run immediately
  bestImmediateRegion: RegionSpatialOpportunity;
  allRegionsRanked: RegionSpatialOpportunity[];
  
  // Best spatial + temporal window ("Wait & Save")
  bestWaitAndSave: {
    regionId: string;
    regionName: string;
    country: string;
    optimalWindow: TemporalOpportunityWindow;
    actionRecommendation: 'RUN_NOW' | 'WAIT_RECOMMENDED' | 'HIGH_VALUE_WAIT';
    recommendationReason: string;
  };
  
  // Hourly comparison timeline for visual charts
  timeline24h: {
    hourOffset: number;
    timeLabel: string;
    costRunImmediateVsThisHour: {
      regionId: string;
      regionName: string;
      projectedCostUsd: number;
      projectedCarbonKg: number;
      pricePerMwh: number;
      carbonIntensity: number;
    }[];
  }[];
}
