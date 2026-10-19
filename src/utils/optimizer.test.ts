import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateEnergyMwh, 
  calculateJobCost, 
  calculateJobCarbonKg, 
  filterRegionsByCompliance,
  evaluateImmediateSpatial,
  evaluateTemporalWindows,
  runWorkloadOptimization
} from './optimizer.ts';
import type { GridRegion } from '../types/grid.ts';
import type { WorkloadProfile } from '../types/optimization.ts';

const mockRegions: GridRegion[] = [
  {
    id: 'gb-uk',
    name: 'Great Britain (NESO)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    continent: 'Europe',
    coordinates: { x: 480, y: 190, lat: 54.5, lng: -2.5 },
    gridOperator: 'National Energy System Operator',
    currency: 'GBP',
    currencySymbol: '£',
    currentDemandMw: 29500,
    peakCapacityMw: 62000,
    systemFrequencyHz: 50.01,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 135,
    carbonRating: 'low',
    wholesalePricePerMwh: 68.5,
    priceInUsdPerMwh: 86.3,
    renewablePercentage: 54,
    cleanEnergyPercentage: 69,
    generationMix: [],
    interconnectors: [],
    forecast24h: [
      { hour: 0, timeLabel: '12:00', pricePerMwh: 86.3, carbonIntensity: 135, renewablePercentage: 54, demandMw: 29500 },
      { hour: 1, timeLabel: '13:00', pricePerMwh: 70.0, carbonIntensity: 110, renewablePercentage: 60, demandMw: 28000 },
      { hour: 2, timeLabel: '14:00', pricePerMwh: 45.0, carbonIntensity: 85, renewablePercentage: 72, demandMw: 27000 },
      { hour: 3, timeLabel: '15:00', pricePerMwh: 28.0, carbonIntensity: 60, renewablePercentage: 80, demandMw: 26000 },
      { hour: 4, timeLabel: '16:00', pricePerMwh: 92.0, carbonIntensity: 170, renewablePercentage: 45, demandMw: 34000 }
    ],
    alerts: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'nordic-no',
    name: 'Nordic Pool (Norway / Sweden)',
    country: 'Norway',
    flag: '🇳🇴',
    continent: 'Europe',
    coordinates: { x: 510, y: 140, lat: 60.5, lng: 8.5 },
    gridOperator: 'Statnett / Svenska Kraftnät',
    currency: 'EUR',
    currencySymbol: '€',
    currentDemandMw: 21000,
    peakCapacityMw: 48000,
    systemFrequencyHz: 49.99,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 28,
    carbonRating: 'very-low',
    wholesalePricePerMwh: 36.0,
    priceInUsdPerMwh: 39.2,
    renewablePercentage: 92,
    cleanEnergyPercentage: 98,
    generationMix: [],
    interconnectors: [],
    forecast24h: [
      { hour: 0, timeLabel: '12:00', pricePerMwh: 39.2, carbonIntensity: 28, renewablePercentage: 92, demandMw: 21000 },
      { hour: 1, timeLabel: '13:00', pricePerMwh: 35.0, carbonIntensity: 26, renewablePercentage: 94, demandMw: 20500 },
      { hour: 2, timeLabel: '14:00', pricePerMwh: 32.0, carbonIntensity: 25, renewablePercentage: 95, demandMw: 20000 },
      { hour: 3, timeLabel: '15:00', pricePerMwh: 31.0, carbonIntensity: 25, renewablePercentage: 95, demandMw: 20000 }
    ],
    alerts: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'us-caiso',
    name: 'California ISO (CAISO)',
    country: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    coordinates: { x: 190, y: 250, lat: 36.7, lng: -119.4 },
    gridOperator: 'California Independent System Operator',
    currency: 'USD',
    currencySymbol: '$',
    currentDemandMw: 24500,
    peakCapacityMw: 52000,
    systemFrequencyHz: 60.00,
    nominalFrequencyHz: 60,
    frequencyStatus: 'optimal',
    carbonIntensity: 180,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 52.0,
    priceInUsdPerMwh: 52.0,
    renewablePercentage: 58,
    cleanEnergyPercentage: 66,
    generationMix: [],
    interconnectors: [],
    forecast24h: [
      { hour: 0, timeLabel: '12:00', pricePerMwh: 52.0, carbonIntensity: 180, renewablePercentage: 58, demandMw: 24500 },
      { hour: 1, timeLabel: '13:00', pricePerMwh: 12.0, carbonIntensity: 90, renewablePercentage: 82, demandMw: 23000 },
      { hour: 2, timeLabel: '14:00', pricePerMwh: 2.0, carbonIntensity: 65, renewablePercentage: 90, demandMw: 22000 } // Solar Curtailment
    ],
    alerts: [],
    lastUpdated: new Date().toISOString()
  }
];

const mockWorkload: WorkloadProfile = {
  id: 'workload-ai-1',
  name: 'Llama 3 Fine-tuning Run',
  category: 'ai_training',
  companyName: 'Anthropic / DeepGrid Labs',
  powerDemandMw: 2.5,
  durationHours: 3,
  maxDelayHours: 6,
  urgency: 'flexible',
  complianceConstraint: 'any'
};

test('calculateEnergyMwh computes accurate megawatt-hours', () => {
  const energy = calculateEnergyMwh(2.5, 4);
  assert.equal(energy, 10);
});

test('calculateJobCost computes accurate financial cost', () => {
  // 2.5 MW * 3 hours = 7.5 MWh * $80/MWh = $600
  const cost = calculateJobCost(2.5, 3, 80);
  assert.equal(cost, 600);
});

test('calculateJobCarbonKg computes accurate emissions in kg CO2eq', () => {
  // 2.5 MW * 3 hours = 7.5 MWh = 7500 kWh.
  // 7500 kWh * 200 gCO2/kWh = 1,500,000 g = 1,500 kg
  const carbon = calculateJobCarbonKg(2.5, 3, 200);
  assert.equal(carbon, 1500);
});

test('filterRegionsByCompliance correctly respects EU and US boundaries', () => {
  const euFiltered = filterRegionsByCompliance(mockRegions, 'eu_gdpr');
  assert.equal(euFiltered.length, 2);
  assert.ok(euFiltered.every(r => r.continent === 'Europe'));

  const usFiltered = filterRegionsByCompliance(mockRegions, 'us_only');
  assert.equal(usFiltered.length, 1);
  assert.equal(usFiltered[0].country, 'United States');
});

test('evaluateImmediateSpatial ranks lower-cost, lower-carbon regions highest', () => {
  const ranked = evaluateImmediateSpatial(mockWorkload, mockRegions);
  assert.equal(ranked.length, 3);
  // Nordic has lowest price ($39.2) and lowest carbon (28g), so it should rank #1
  assert.equal(ranked[0].regionId, 'nordic-no');
  assert.ok(ranked[0].rankScore > ranked[2].rankScore);
});

test('evaluateTemporalWindows identifies temporal savings when prices dip', () => {
  const gbRegion = mockRegions.find(r => r.id === 'gb-uk')!;
  const windows = evaluateTemporalWindows(mockWorkload, gbRegion.forecast24h);
  
  assert.ok(windows.length > 0);
  // Immediate cost at hour 0 has high price, but at offset 2 & 3 price drops drastically
  const optimalWindow = windows.reduce((best, w) => w.savingsVsImmediateUsd > best.savingsVsImmediateUsd ? w : best, windows[0]);
  assert.ok(optimalWindow.savingsVsImmediateUsd > 0);
  assert.ok(optimalWindow.savingsPercentage > 0);
});

test('runWorkloadOptimization generates comprehensive recommendation', () => {
  const result = runWorkloadOptimization(mockWorkload, mockRegions);
  assert.ok(result.bestImmediateRegion);
  assert.ok(result.bestWaitAndSave);
  assert.ok(result.timeline24h.length === 24);
  assert.equal(result.bestImmediateRegion.regionId, 'nordic-no');
});
