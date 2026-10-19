import type { GridRegion, HourlyForecastPoint } from '../types/grid.ts';
import type { 
  WorkloadProfile, 
  OptimizationResult, 
  RegionSpatialOpportunity, 
  TemporalOpportunityWindow 
} from '../types/optimization.ts';

/**
 * Calculates energy consumed in MWh.
 */
export function calculateEnergyMwh(powerMw: number, durationHours: number): number {
  return Math.max(0, powerMw * durationHours);
}

/**
 * Calculates financial cost in USD for a given power demand, duration, and price/MWh.
 */
export function calculateJobCost(powerMw: number, durationHours: number, pricePerMwh: number): number {
  const energyMwh = calculateEnergyMwh(powerMw, durationHours);
  return Number((energyMwh * pricePerMwh).toFixed(2));
}

/**
 * Calculates carbon emissions in kg CO2eq for a given power demand, duration, and carbon intensity (gCO2/kWh).
 * 1 MWh = 1000 kWh.
 * gCO2 / kWh * 1000 kWh = kg CO2.
 * So: powerMw * durationHours * 1000 kWh * (gCO2/1000) = powerMw * durationHours * carbonIntensityGPerKwh kg CO2eq.
 */
export function calculateJobCarbonKg(powerMw: number, durationHours: number, carbonIntensityGPerKwh: number): number {
  const energyMwh = calculateEnergyMwh(powerMw, durationHours);
  const carbonKg = energyMwh * carbonIntensityGPerKwh;
  return Number(carbonKg.toFixed(1));
}

/**
 * Filter regions by compliance constraint.
 */
export function filterRegionsByCompliance(
  regions: GridRegion[], 
  constraint?: 'any' | 'eu_gdpr' | 'us_only' | 'local_only',
  allowedRegionIds?: string[]
): GridRegion[] {
  let list = regions;
  
  if (allowedRegionIds && allowedRegionIds.length > 0) {
    list = list.filter(r => allowedRegionIds.includes(r.id));
  }
  
  if (!constraint || constraint === 'any') {
    return list;
  }
  
  if (constraint === 'eu_gdpr') {
    return list.filter(r => r.continent === 'Europe');
  }
  
  if (constraint === 'us_only') {
    return list.filter(r => r.continent === 'North America' && r.country === 'United States');
  }
  
  return list;
}

/**
 * Evaluates immediate spatial arbitrage across eligible regions.
 */
export function evaluateImmediateSpatial(
  workload: WorkloadProfile,
  regions: GridRegion[]
): RegionSpatialOpportunity[] {
  const eligible = filterRegionsByCompliance(regions, workload.complianceConstraint, workload.allowedRegions);
  if (eligible.length === 0) return [];

  // Determine min and max for normalization
  const maxPrice = Math.max(...eligible.map(r => Math.max(1, r.priceInUsdPerMwh)));
  const minPrice = Math.min(...eligible.map(r => r.priceInUsdPerMwh));
  const maxCarbon = Math.max(...eligible.map(r => Math.max(1, r.carbonIntensity)));
  const minCarbon = Math.min(...eligible.map(r => r.carbonIntensity));

  const opportunities: RegionSpatialOpportunity[] = eligible.map(r => {
    const totalCostImmediate = calculateJobCost(workload.powerDemandMw, workload.durationHours, r.priceInUsdPerMwh);
    const totalCarbonKgImmediate = calculateJobCarbonKg(workload.powerDemandMw, workload.durationHours, r.carbonIntensity);
    
    // Normalized cost score (0 = worst, 1 = best)
    const costScore = maxPrice === minPrice ? 1 : 1 - ((r.priceInUsdPerMwh - minPrice) / (maxPrice - minPrice));
    // Normalized carbon score (0 = worst, 1 = best)
    const carbonScore = maxCarbon === minCarbon ? 1 : 1 - ((r.carbonIntensity - minCarbon) / (maxCarbon - minCarbon));
    // Clean energy factor (0 to 1)
    const cleanScore = r.cleanEnergyPercentage / 100;
    
    // Composite weighted rank score (0 to 100)
    const rankScore = Number(((costScore * 0.45 + carbonScore * 0.40 + cleanScore * 0.15) * 100).toFixed(1));

    return {
      regionId: r.id,
      regionName: r.name,
      country: r.country,
      currentPriceUsd: r.priceInUsdPerMwh,
      currentCarbonIntensity: r.carbonIntensity,
      currentCleanPct: r.cleanEnergyPercentage,
      totalCostImmediate,
      totalCarbonKgImmediate,
      rankScore,
    };
  });

  return opportunities.sort((a, b) => b.rankScore - a.rankScore);
}

/**
 * Evaluates the temporal "Wait & Save" windows for a specific region over its 24h forecast.
 */
export function evaluateTemporalWindows(
  workload: WorkloadProfile,
  forecast: HourlyForecastPoint[]
): TemporalOpportunityWindow[] {
  const maxDelay = Math.min(workload.maxDelayHours, 24 - Math.min(24, workload.durationHours));
  const windows: TemporalOpportunityWindow[] = [];
  
  if (!forecast || forecast.length === 0) return windows;

  const immediateWindowForecast = forecast.slice(0, Math.min(forecast.length, Math.ceil(workload.durationHours)));
  const immediateAvgPrice = immediateWindowForecast.reduce((acc, p) => acc + p.pricePerMwh, 0) / (immediateWindowForecast.length || 1);
  const immediateAvgCarbon = immediateWindowForecast.reduce((acc, p) => acc + p.carbonIntensity, 0) / (immediateWindowForecast.length || 1);
  
  const immediateTotalCost = calculateJobCost(workload.powerDemandMw, workload.durationHours, immediateAvgPrice);
  const immediateTotalCarbon = calculateJobCarbonKg(workload.powerDemandMw, workload.durationHours, immediateAvgCarbon);

  const duration = Math.min(24, Math.max(1, Math.round(workload.durationHours)));

  for (let offset = 0; offset <= maxDelay; offset++) {
    // Window slices circularly or within the 24h forecast
    const slice: HourlyForecastPoint[] = [];
    for (let h = 0; h < duration; h++) {
      const idx = (offset + h) % forecast.length;
      slice.push(forecast[idx]);
    }

    const avgPrice = slice.reduce((acc, p) => acc + p.pricePerMwh, 0) / slice.length;
    const avgCarbon = slice.reduce((acc, p) => acc + p.carbonIntensity, 0) / slice.length;
    const avgClean = slice.reduce((acc, p) => acc + p.renewablePercentage, 0) / slice.length;

    const totalCostUsd = calculateJobCost(workload.powerDemandMw, workload.durationHours, avgPrice);
    const totalCarbonKg = calculateJobCarbonKg(workload.powerDemandMw, workload.durationHours, avgCarbon);

    const savingsVsImmediateUsd = Number((immediateTotalCost - totalCostUsd).toFixed(2));
    const savingsPercentage = immediateTotalCost > 0 
      ? Number(((savingsVsImmediateUsd / immediateTotalCost) * 100).toFixed(1))
      : 0;

    const carbonReductionKg = Number((immediateTotalCarbon - totalCarbonKg).toFixed(1));
    const carbonReductionPercentage = immediateTotalCarbon > 0
      ? Number(((carbonReductionKg / immediateTotalCarbon) * 100).toFixed(1))
      : 0;

    const hasCurtailment = slice.some(p => p.pricePerMwh <= 5);

    const startHour = (new Date().getHours() + offset) % 24;
    const endHour = (startHour + duration) % 24;
    const pad = (n: number) => n.toString().padStart(2, '0');

    windows.push({
      startHourOffset: offset,
      targetStartTime: `T+${offset}h (${pad(startHour)}:00)`,
      targetEndTime: `T+${offset + duration}h (${pad(endHour)}:00)`,
      averagePriceUsd: Number(avgPrice.toFixed(2)),
      averageCarbonIntensity: Math.round(avgCarbon),
      averageCleanPct: Math.round(avgClean),
      totalCostUsd,
      totalCarbonKg,
      savingsVsImmediateUsd,
      savingsPercentage,
      carbonReductionKg,
      carbonReductionPercentage,
      curtailmentBonus: hasCurtailment,
    });
  }

  return windows;
}

/**
 * Runs end-to-end optimization combining spatial and temporal analysis.
 */
export function runWorkloadOptimization(
  workload: WorkloadProfile,
  regions: GridRegion[]
): OptimizationResult {
  const spatialRanked = evaluateImmediateSpatial(workload, regions);
  const bestImmediate = spatialRanked[0] || {
    regionId: 'default',
    regionName: 'Default Grid',
    country: 'Global',
    currentPriceUsd: 85,
    currentCarbonIntensity: 220,
    currentCleanPct: 50,
    totalCostImmediate: calculateJobCost(workload.powerDemandMw, workload.durationHours, 85),
    totalCarbonKgImmediate: calculateJobCarbonKg(workload.powerDemandMw, workload.durationHours, 220),
    rankScore: 50,
  };

  // Evaluate temporal windows across all eligible regions to find the ultimate global spatial-temporal sweet spot
  const eligibleRegions = filterRegionsByCompliance(regions, workload.complianceConstraint, workload.allowedRegions);
  
  let bestRegionId = bestImmediate.regionId;
  let bestRegionName = bestImmediate.regionName;
  let bestCountry = bestImmediate.country;
  let bestWindow: TemporalOpportunityWindow | null = null;
  let maxScoreBenefit = -Infinity;

  for (const reg of eligibleRegions) {
    const windows = evaluateTemporalWindows(workload, reg.forecast24h);
    for (const win of windows) {
      // Benefit metric combining cost savings and carbon reduction
      const scoreBenefit = (win.savingsPercentage * 0.6) + (win.carbonReductionPercentage * 0.4) + (win.curtailmentBonus ? 15 : 0);
      if (scoreBenefit > maxScoreBenefit) {
        maxScoreBenefit = scoreBenefit;
        bestRegionId = reg.id;
        bestRegionName = reg.name;
        bestCountry = reg.country;
        bestWindow = win;
      }
    }
  }

  // Fallback if no window found
  if (!bestWindow) {
    bestWindow = {
      startHourOffset: 0,
      targetStartTime: 'Immediate (Now)',
      targetEndTime: `In ${workload.durationHours}h`,
      averagePriceUsd: bestImmediate.currentPriceUsd,
      averageCarbonIntensity: bestImmediate.currentCarbonIntensity,
      averageCleanPct: bestImmediate.currentCleanPct,
      totalCostUsd: bestImmediate.totalCostImmediate,
      totalCarbonKg: bestImmediate.totalCarbonKgImmediate,
      savingsVsImmediateUsd: 0,
      savingsPercentage: 0,
      carbonReductionKg: 0,
      carbonReductionPercentage: 0,
      curtailmentBonus: false,
    };
  }

  // Formulate action recommendation
  let actionRecommendation: 'RUN_NOW' | 'WAIT_RECOMMENDED' | 'HIGH_VALUE_WAIT' = 'RUN_NOW';
  let recommendationReason = 'Current conditions in optimal region are already favorable.';

  if (bestWindow.startHourOffset > 0) {
    if (bestWindow.savingsPercentage >= 25 || bestWindow.curtailmentBonus) {
      actionRecommendation = 'HIGH_VALUE_WAIT';
      recommendationReason = `Waiting ${bestWindow.startHourOffset}h in ${bestRegionName} unlocks massive ~${bestWindow.savingsPercentage}% cost reduction and avoids ${bestWindow.carbonReductionKg} kg CO2 due to offshore wind/solar surge.`;
    } else if (bestWindow.savingsPercentage >= 10 || bestWindow.carbonReductionPercentage >= 20) {
      actionRecommendation = 'WAIT_RECOMMENDED';
      recommendationReason = `Holding start until ${bestWindow.targetStartTime} saves $${bestWindow.savingsVsImmediateUsd} with cleaner energy mix.`;
    } else {
      actionRecommendation = 'RUN_NOW';
      recommendationReason = `Savings from waiting are minimal (<10%). Running immediately in ${bestImmediate.regionName} is recommended.`;
    }
  }

  // Build 24-hour comparative timeline series
  const timeline24h = Array.from({ length: 24 }).map((_, hourOffset) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const clock = (new Date().getHours() + hourOffset) % 24;
    return {
      hourOffset,
      timeLabel: `T+${hourOffset}h (${pad(clock)}:00)`,
      costRunImmediateVsThisHour: eligibleRegions.slice(0, 4).map(r => {
        const point = r.forecast24h[hourOffset % r.forecast24h.length] || { pricePerMwh: 75, carbonIntensity: 180 };
        return {
          regionId: r.id,
          regionName: r.name,
          projectedCostUsd: calculateJobCost(workload.powerDemandMw, workload.durationHours, point.pricePerMwh),
          projectedCarbonKg: calculateJobCarbonKg(workload.powerDemandMw, workload.durationHours, point.carbonIntensity),
          pricePerMwh: point.pricePerMwh,
          carbonIntensity: point.carbonIntensity,
        };
      }),
    };
  });

  return {
    workload,
    evaluatedAt: new Date().toISOString(),
    bestImmediateRegion: bestImmediate,
    allRegionsRanked: spatialRanked,
    bestWaitAndSave: {
      regionId: bestRegionId,
      regionName: bestRegionName,
      country: bestCountry,
      optimalWindow: bestWindow,
      actionRecommendation,
      recommendationReason,
    },
    timeline24h,
  };
}
