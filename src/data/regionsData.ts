import { GridRegion } from '../types/grid.ts';

export const FUEL_COLORS = {
  solar: '#F59E0B',      // Amber
  wind: '#06B6D4',       // Laser Cyan
  nuclear: '#8B5CF6',    // Purple/Violet
  hydro: '#3B82F6',      // Cobalt Blue
  gas: '#EF4444',        // Red/Orange (Fossil)
  coal: '#475569',       // Dark Slate (Fossil)
  biomass: '#10B981',    // Emerald Green
  storage: '#EC4899',    // Pink/Magenta
  imports: '#6366F1',    // Indigo
  other: '#94A3B8',      // Slate
};

// Generates smooth realistic 24-hour forecast curve
function generateForecast(
  basePrice: number,
  baseCarbon: number,
  baseCleanPct: number,
  baseDemand: number,
  pattern: 'solar_surge' | 'wind_surge' | 'nuclear_flat' | 'coal_heavy'
) {
  const points = [];
  const now = new Date();
  const currentHour = now.getHours();

  for (let i = 0; i < 24; i++) {
    const clockHour = (currentHour + i) % 24;
    let priceMult = 1.0;
    let carbonMult = 1.0;
    let cleanMult = 1.0;
    let demandMult = 1.0;

    // Diurnal demand cycle: low at 03:00, peaks at 18:00
    if (clockHour >= 1 && clockHour <= 5) demandMult = 0.72;
    else if (clockHour >= 8 && clockHour <= 11) demandMult = 1.15;
    else if (clockHour >= 17 && clockHour <= 20) demandMult = 1.25;
    else demandMult = 0.95;

    if (pattern === 'solar_surge') {
      // Solar peaks between 11:00 and 15:00
      if (clockHour >= 11 && clockHour <= 15) {
        priceMult = 0.25; // Massive solar suppression
        carbonMult = 0.45;
        cleanMult = 1.6;
      } else if (clockHour >= 18 && clockHour <= 21) {
        priceMult = 1.6; // Evening ramp peak
        carbonMult = 1.4;
        cleanMult = 0.6;
      }
    } else if (pattern === 'wind_surge') {
      // Wind surges at night and early morning
      if (clockHour >= 0 && clockHour <= 6) {
        priceMult = 0.45; // Cheap night wind
        carbonMult = 0.55;
        cleanMult = 1.45;
      } else if (clockHour >= 17 && clockHour <= 21) {
        priceMult = 1.35;
        carbonMult = 1.25;
        cleanMult = 0.8;
      }
    } else if (pattern === 'nuclear_flat') {
      // Consistent low carbon, stable price
      priceMult = clockHour >= 17 && clockHour <= 20 ? 1.2 : 0.9;
      carbonMult = 1.0;
      cleanMult = 1.0;
    } else {
      // Mixed/fossil
      priceMult = clockHour >= 17 && clockHour <= 20 ? 1.4 : 0.85;
      carbonMult = clockHour >= 17 && clockHour <= 20 ? 1.3 : 0.9;
    }

    const price = Math.max(2, Math.round(basePrice * priceMult * 10) / 10);
    const carbon = Math.max(15, Math.round(baseCarbon * carbonMult));
    const cleanPct = Math.min(99, Math.max(10, Math.round(baseCleanPct * cleanMult)));
    const demand = Math.round(baseDemand * demandMult);

    const pad = (n: number) => n.toString().padStart(2, '0');
    points.push({
      hour: i,
      timeLabel: `${pad(clockHour)}:00`,
      pricePerMwh: price,
      carbonIntensity: carbon,
      renewablePercentage: cleanPct,
      demandMw: demand,
    });
  }
  return points;
}

export const INITIAL_REGIONS: GridRegion[] = [
  {
    id: 'gb-uk',
    name: 'Great Britain (NESO)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    continent: 'Europe',
    coordinates: { x: 485, y: 195, lat: 54.5, lng: -2.5 },
    gridOperator: 'National Energy System Operator (NESO)',
    currency: 'GBP',
    currencySymbol: '£',
    currentDemandMw: 29420,
    peakCapacityMw: 64000,
    systemFrequencyHz: 50.018,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 128,
    carbonRating: 'low',
    wholesalePricePerMwh: 68.40,
    priceInUsdPerMwh: 86.80,
    renewablePercentage: 52.4,
    cleanEnergyPercentage: 68.2,
    isLiveApiSupported: true,
    apiSource: 'api.carbonintensity.org.uk',
    generationMix: [
      { fuel: 'wind', label: 'Offshore & Onshore Wind', mw: 11250, percentage: 38.2, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'gas', label: 'CCGT Natural Gas', mw: 8200, percentage: 27.9, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'nuclear', label: 'Nuclear (Sizewell B, Torness)', mw: 4650, percentage: 15.8, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'solar', label: 'Solar PV', mw: 2100, percentage: 7.1, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'biomass', label: 'Biomass (Drax Sustainable)', mw: 1420, percentage: 4.8, isClean: true, color: FUEL_COLORS.biomass },
      { fuel: 'imports', label: 'Net Interconnectors (Europe)', mw: 1150, percentage: 3.9, isClean: true, color: FUEL_COLORS.imports },
      { fuel: 'hydro', label: 'Hydro & Pumped Storage', mw: 550, percentage: 1.9, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'coal', label: 'Coal (Phase-out Complete)', mw: 0, percentage: 0.0, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'other', label: 'Battery BESS & Other', mw: 100, percentage: 0.5, isClean: true, color: FUEL_COLORS.other },
    ],
    interconnectors: [
      { id: 'ifa1', name: 'IFA1 (France)', fromRegion: 'France', toRegion: 'UK', flowMw: 1850, capacityMw: 2000 },
      { id: 'ifa2', name: 'IFA2 (France)', fromRegion: 'France', toRegion: 'UK', flowMw: 950, capacityMw: 1000 },
      { id: 'nsl', name: 'North Sea Link (Norway)', fromRegion: 'Norway', toRegion: 'UK', flowMw: 1380, capacityMw: 1400 },
      { id: 'britned', name: 'BritNed (Netherlands)', fromRegion: 'Netherlands', toRegion: 'UK', flowMw: -200, capacityMw: 1000 },
      { id: 'eleclink', name: 'ElecLink (Channel Tunnel)', fromRegion: 'France', toRegion: 'UK', flowMw: 920, capacityMw: 1000 },
      { id: 'viking', name: 'Viking Link (Denmark)', fromRegion: 'Denmark', toRegion: 'UK', flowMw: 1100, capacityMw: 1400 },
    ],
    forecast24h: generateForecast(86.8, 128, 52, 29420, 'wind_surge'),
    alerts: [
      { id: 'a1', severity: 'info', title: 'Offshore Wind Generation High', message: 'Dogger Bank & Hornsea producing >11GW; wholesale day-ahead discount active.', timestamp: '10m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'nordic-pool',
    name: 'Nordic Grid (Norway / Sweden)',
    country: 'Norway',
    flag: '🇳🇴',
    continent: 'Europe',
    coordinates: { x: 535, y: 145, lat: 60.5, lng: 9.5 },
    gridOperator: 'Statnett & Svenska Kraftnät',
    currency: 'EUR',
    currencySymbol: '€',
    currentDemandMw: 22400,
    peakCapacityMw: 49000,
    systemFrequencyHz: 50.002,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 26,
    carbonRating: 'very-low',
    wholesalePricePerMwh: 38.20,
    priceInUsdPerMwh: 41.50,
    renewablePercentage: 91.5,
    cleanEnergyPercentage: 98.2,
    generationMix: [
      { fuel: 'hydro', label: 'Hydro Reservoir & Run-of-River', mw: 13800, percentage: 61.6, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'nuclear', label: 'Nuclear (Forsmark, Ringhals)', mw: 5200, percentage: 23.2, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'wind', label: 'Wind Farms', mw: 2600, percentage: 11.6, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'biomass', label: 'Biofuel & Thermal', mw: 650, percentage: 2.9, isClean: true, color: FUEL_COLORS.biomass },
      { fuel: 'gas', label: 'Peaker Gas', mw: 150, percentage: 0.7, isClean: false, color: FUEL_COLORS.gas },
    ],
    interconnectors: [
      { id: 'nsl-nor', name: 'North Sea Link to UK', fromRegion: 'Norway', toRegion: 'UK', flowMw: -1380, capacityMw: 1400 },
      { id: 'nordlink', name: 'NordLink to Germany', fromRegion: 'Norway', toRegion: 'Germany', flowMw: -1250, capacityMw: 1400 },
    ],
    forecast24h: generateForecast(41.5, 26, 92, 22400, 'nuclear_flat'),
    alerts: [
      { id: 'a2', severity: 'info', title: 'Lowest European Carbon Index', message: 'Hydro reservoir levels at 88% capacity. Continuous low-carbon export.', timestamp: '25m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'fr-rte',
    name: 'France (RTE)',
    country: 'France',
    flag: '🇫🇷',
    continent: 'Europe',
    coordinates: { x: 490, y: 245, lat: 46.6, lng: 2.2 },
    gridOperator: 'Réseau de Transport d’Électricité (RTE)',
    currency: 'EUR',
    currencySymbol: '€',
    currentDemandMw: 48500,
    peakCapacityMw: 88000,
    systemFrequencyHz: 50.009,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 42,
    carbonRating: 'very-low',
    wholesalePricePerMwh: 54.10,
    priceInUsdPerMwh: 58.80,
    renewablePercentage: 24.2,
    cleanEnergyPercentage: 92.4,
    generationMix: [
      { fuel: 'nuclear', label: 'Nuclear Fleet (56 Reactors)', mw: 33100, percentage: 68.2, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'hydro', label: 'Hydroelectric', mw: 6200, percentage: 12.8, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'wind', label: 'Wind Power', mw: 4100, percentage: 8.5, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'solar', label: 'Solar Photovoltaic', mw: 2300, percentage: 4.7, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'gas', label: 'Thermal Gas', mw: 2100, percentage: 4.3, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'biomass', label: 'Bioenergy', mw: 700, percentage: 1.5, isClean: true, color: FUEL_COLORS.biomass },
    ],
    interconnectors: [
      { id: 'ifa1-fr', name: 'Interconnexion France-Angleterre', fromRegion: 'France', toRegion: 'UK', flowMw: -2800, capacityMw: 3000 },
      { id: 'fr-es', name: 'Santa Llogaia (Spain)', fromRegion: 'France', toRegion: 'Spain', flowMw: -1400, capacityMw: 2800 },
      { id: 'fr-it', name: 'Grand-Île (Italy)', fromRegion: 'France', toRegion: 'Italy', flowMw: -2100, capacityMw: 3100 },
    ],
    forecast24h: generateForecast(58.8, 42, 25, 48500, 'nuclear_flat'),
    alerts: [],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'de-smard',
    name: 'Germany (BNetzA / SMARD)',
    country: 'Germany',
    flag: '🇩🇪',
    continent: 'Europe',
    coordinates: { x: 520, y: 220, lat: 51.1, lng: 10.4 },
    gridOperator: 'TenneT / 50Hertz / Amprion / TransnetBW',
    currency: 'EUR',
    currencySymbol: '€',
    currentDemandMw: 56200,
    peakCapacityMw: 95000,
    systemFrequencyHz: 49.994,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 285,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 64.80,
    priceInUsdPerMwh: 70.40,
    renewablePercentage: 58.6,
    cleanEnergyPercentage: 59.1,
    generationMix: [
      { fuel: 'wind', label: 'Wind (North Sea & Inland)', mw: 18500, percentage: 32.9, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'solar', label: 'Solar Photovoltaic', mw: 11200, percentage: 19.9, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'coal', label: 'Lignite & Hard Coal', mw: 12400, percentage: 22.1, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'gas', label: 'Natural Gas', mw: 8200, percentage: 14.6, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'biomass', label: 'Biomass & Biogas', mw: 4100, percentage: 7.3, isClean: true, color: FUEL_COLORS.biomass },
      { fuel: 'hydro', label: 'Hydro & Pumped Storage', mw: 1800, percentage: 3.2, isClean: true, color: FUEL_COLORS.hydro },
    ],
    interconnectors: [
      { id: 'de-no', name: 'NordLink (Norway)', fromRegion: 'Norway', toRegion: 'Germany', flowMw: 1250, capacityMw: 1400 },
      { id: 'de-at', name: 'Austria Intertie', fromRegion: 'Germany', toRegion: 'Austria', flowMw: -1900, capacityMw: 5000 },
    ],
    forecast24h: generateForecast(70.4, 285, 58, 56200, 'solar_surge'),
    alerts: [
      { id: 'a3', severity: 'warning', title: 'Midday Negative Pricing Forecast', message: 'Combined wind + solar projected at 38 GW around 13:00. Day-ahead spot price dropping to €4.50/MWh.', timestamp: '40m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'us-caiso',
    name: 'California (CAISO)',
    country: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    coordinates: { x: 195, y: 260, lat: 36.7, lng: -119.4 },
    gridOperator: 'California Independent System Operator (CAISO)',
    currency: 'USD',
    currencySymbol: '$',
    currentDemandMw: 25100,
    peakCapacityMw: 54000,
    systemFrequencyHz: 60.012,
    nominalFrequencyHz: 60,
    frequencyStatus: 'optimal',
    carbonIntensity: 145,
    carbonRating: 'low',
    wholesalePricePerMwh: 48.20,
    priceInUsdPerMwh: 48.20,
    renewablePercentage: 64.2,
    cleanEnergyPercentage: 74.8,
    generationMix: [
      { fuel: 'solar', label: 'Utility & Distributed Solar', mw: 11400, percentage: 45.4, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'gas', label: 'Natural Gas Generation', mw: 5400, percentage: 21.5, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'nuclear', label: 'Diablo Canyon Nuclear', mw: 2250, percentage: 9.0, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'hydro', label: 'Sierra Nevada Hydro', mw: 2500, percentage: 10.0, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'wind', label: 'Tehachapi & Altamont Wind', mw: 2150, percentage: 8.6, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'storage', label: '4-Hour BESS Battery Discharge', mw: 1100, percentage: 4.4, isClean: true, color: FUEL_COLORS.storage },
      { fuel: 'other', label: 'Geothermal (The Geysers)', mw: 300, percentage: 1.1, isClean: true, color: FUEL_COLORS.other },
    ],
    interconnectors: [
      { id: 'path66', name: 'Pacific AC Intertie (BPA)', fromRegion: 'Pacific Northwest', toRegion: 'California', flowMw: 2400, capacityMw: 4800 },
      { id: 'path26', name: 'Path 26 (North-South)', fromRegion: 'NorCal', toRegion: 'SoCal', flowMw: 1800, capacityMw: 3000 },
    ],
    forecast24h: generateForecast(48.2, 145, 64, 25100, 'solar_surge'),
    alerts: [
      { id: 'a4', severity: 'info', title: 'Solar Curtailment Window Active', message: 'Solar generation exceeding regional load by 1.8 GW. Batteries actively charging at near $0/MWh.', timestamp: '15m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'us-ercot',
    name: 'Texas Grid (ERCOT)',
    country: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    coordinates: { x: 260, y: 300, lat: 31.9, lng: -99.9 },
    gridOperator: 'Electric Reliability Council of Texas (ERCOT)',
    currency: 'USD',
    currencySymbol: '$',
    currentDemandMw: 58200,
    peakCapacityMw: 85000,
    systemFrequencyHz: 59.998,
    nominalFrequencyHz: 60,
    frequencyStatus: 'optimal',
    carbonIntensity: 310,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 32.50,
    priceInUsdPerMwh: 32.50,
    renewablePercentage: 42.1,
    cleanEnergyPercentage: 51.8,
    generationMix: [
      { fuel: 'gas', label: 'Combined Cycle Gas', mw: 24200, percentage: 41.6, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'wind', label: 'West Texas & Gulf Wind', mw: 16100, percentage: 27.7, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'solar', label: 'Utility Solar PV', mw: 7800, percentage: 13.4, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'nuclear', label: 'South Texas & Comanche Peak', mw: 5100, percentage: 8.8, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'coal', label: 'Lignite Coal', mw: 3800, percentage: 6.5, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'storage', label: 'Utility Scale Batteries', mw: 1200, percentage: 2.0, isClean: true, color: FUEL_COLORS.storage },
    ],
    interconnectors: [
      { id: 'dc-east', name: 'DC Tie East', fromRegion: 'SPP', toRegion: 'ERCOT', flowMw: 200, capacityMw: 600 },
      { id: 'dc-mexico', name: 'Eagle Pass DC Tie (CFE)', fromRegion: 'Mexico', toRegion: 'ERCOT', flowMw: -150, capacityMw: 300 },
    ],
    forecast24h: generateForecast(32.5, 310, 42, 58200, 'wind_surge'),
    alerts: [
      { id: 'a5', severity: 'info', title: 'High Wind Generation in Panhandle', message: 'West Texas wind exceeding 16GW; spot nodal LMP dropping below $15/MWh in Sweetwater.', timestamp: '5m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'us-pjm',
    name: 'Mid-Atlantic (PJM)',
    country: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    coordinates: { x: 305, y: 265, lat: 39.8, lng: -77.5 },
    gridOperator: 'PJM Interconnection (Data Center Corridor)',
    currency: 'USD',
    currencySymbol: '$',
    currentDemandMw: 92400,
    peakCapacityMw: 148000,
    systemFrequencyHz: 60.003,
    nominalFrequencyHz: 60,
    frequencyStatus: 'optimal',
    carbonIntensity: 345,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 58.70,
    priceInUsdPerMwh: 58.70,
    renewablePercentage: 14.8,
    cleanEnergyPercentage: 48.2,
    generationMix: [
      { fuel: 'gas', label: 'Natural Gas (Marcellus Shale)', mw: 41200, percentage: 44.6, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'nuclear', label: 'Nuclear Fleet (Peach Bottom, etc.)', mw: 30800, percentage: 33.3, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'coal', label: 'Bituminous Coal', mw: 8900, percentage: 9.6, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'wind', label: 'Appalachian & Lake Wind', mw: 5400, percentage: 5.8, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'solar', label: 'Solar Arrays', mw: 4100, percentage: 4.4, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'hydro', label: 'Pumped Storage (Bath County)', mw: 2000, percentage: 2.3, isClean: true, color: FUEL_COLORS.hydro },
    ],
    interconnectors: [
      { id: 'pjm-miso', name: 'MISO Intertie', fromRegion: 'MISO', toRegion: 'PJM', flowMw: -1500, capacityMw: 4500 },
      { id: 'pjm-nyiso', name: 'NYISO Intertie', fromRegion: 'PJM', toRegion: 'NYISO', flowMw: 800, capacityMw: 2000 },
    ],
    forecast24h: generateForecast(58.7, 345, 15, 92400, 'coal_heavy'),
    alerts: [
      { id: 'a6', severity: 'info', title: 'Ashburn Data Center Load Constant', message: 'Data center corridor in Northern Virginia drawing sustained 3.8 GW baseload.', timestamp: '30m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'au-nem',
    name: 'Australia NEM (NSW & Vic)',
    country: 'Australia',
    flag: '🇦🇺',
    continent: 'Asia-Pacific',
    coordinates: { x: 825, y: 520, lat: -33.8, lng: 151.2 },
    gridOperator: 'Australian Energy Market Operator (AEMO)',
    currency: 'AUD',
    currencySymbol: 'A$',
    currentDemandMw: 24800,
    peakCapacityMw: 42000,
    systemFrequencyHz: 50.005,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 420,
    carbonRating: 'high',
    wholesalePricePerMwh: 76.50,
    priceInUsdPerMwh: 49.80,
    renewablePercentage: 44.5,
    cleanEnergyPercentage: 44.5,
    generationMix: [
      { fuel: 'coal', label: 'Black & Brown Coal (Bayswater/Loy Yang)', mw: 11800, percentage: 47.6, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'solar', label: 'Rooftop & Utility Solar', mw: 6400, percentage: 25.8, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'wind', label: 'South Australia & Victoria Wind', mw: 3900, percentage: 15.7, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'hydro', label: 'Snowy Hydro Scheme', mw: 1600, percentage: 6.5, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'gas', label: 'Open Cycle Gas Turbines', mw: 800, percentage: 3.2, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'storage', label: 'Hornsdale & Big Batteries', mw: 300, percentage: 1.2, isClean: true, color: FUEL_COLORS.storage },
    ],
    interconnectors: [
      { id: 'basslink', name: 'Basslink (Tasmania Hydro)', fromRegion: 'Tasmania', toRegion: 'Victoria', flowMw: 450, capacityMw: 500 },
      { id: 'qni', name: 'Queensland-NSW Interconnector', fromRegion: 'Queensland', toRegion: 'NSW', flowMw: 600, capacityMw: 1000 },
    ],
    forecast24h: generateForecast(49.8, 420, 45, 24800, 'solar_surge'),
    alerts: [
      { id: 'a7', severity: 'info', title: 'World Record Rooftop Solar', message: 'Rooftop solar supplying over 35% of total Eastern seaboard midday energy.', timestamp: '18m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'jp-tepco',
    name: 'Japan (TEPCO / Tokyo)',
    country: 'Japan',
    flag: '🇯🇵',
    continent: 'Asia-Pacific',
    coordinates: { x: 795, y: 280, lat: 35.6, lng: 139.7 },
    gridOperator: 'Tokyo Electric Power Company (TEPCO)',
    currency: 'JPY',
    currencySymbol: '¥',
    currentDemandMw: 38900,
    peakCapacityMw: 58000,
    systemFrequencyHz: 50.002,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 430,
    carbonRating: 'high',
    wholesalePricePerMwh: 14800,
    priceInUsdPerMwh: 96.20,
    renewablePercentage: 22.8,
    cleanEnergyPercentage: 31.4,
    generationMix: [
      { fuel: 'gas', label: 'LNG Thermal Generation', mw: 23200, percentage: 59.6, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'solar', label: 'Solar PV Arrays', mw: 6100, percentage: 15.7, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'nuclear', label: 'Nuclear Restarts', mw: 3300, percentage: 8.5, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'hydro', label: 'Pumped Hydro Plants', mw: 3400, percentage: 8.7, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'coal', label: 'Ultra-Supercritical Coal', mw: 2400, percentage: 6.2, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'wind', label: 'Coastal Wind', mw: 500, percentage: 1.3, isClean: true, color: FUEL_COLORS.wind },
    ],
    interconnectors: [
      { id: 'fc-shin', name: 'Shin-Shinano 50/60Hz Frequency Converter', fromRegion: 'Chubu (60Hz)', toRegion: 'Tokyo (50Hz)', flowMw: 600, capacityMw: 1200 }
    ],
    forecast24h: generateForecast(96.2, 430, 23, 38900, 'coal_heavy'),
    alerts: [],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'br-sin',
    name: 'Brazil (ONS / National System)',
    country: 'Brazil',
    flag: '🇧🇷',
    continent: 'Latin America',
    coordinates: { x: 380, y: 460, lat: -14.2, lng: -51.9 },
    gridOperator: 'Operador Nacional do Sistema Elétrico (ONS)',
    currency: 'BRL',
    currencySymbol: 'R$',
    currentDemandMw: 71200,
    peakCapacityMw: 110000,
    systemFrequencyHz: 60.001,
    nominalFrequencyHz: 60,
    frequencyStatus: 'optimal',
    carbonIntensity: 68,
    carbonRating: 'very-low',
    wholesalePricePerMwh: 125.0,
    priceInUsdPerMwh: 22.80,
    renewablePercentage: 86.4,
    cleanEnergyPercentage: 89.2,
    generationMix: [
      { fuel: 'hydro', label: 'Hydroelectric (Itaipu, Belo Monte)', mw: 48500, percentage: 68.1, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'wind', label: 'Northeast Onshore Wind', mw: 9800, percentage: 13.8, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'biomass', label: 'Sugarcane Bagasse Biomass', mw: 4200, percentage: 5.9, isClean: true, color: FUEL_COLORS.biomass },
      { fuel: 'solar', label: 'Northeast Solar Parks', mw: 3200, percentage: 4.5, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'gas', label: 'Thermal Gas Peakers', mw: 3500, percentage: 4.9, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'nuclear', label: 'Angra 1 & 2', mw: 2000, percentage: 2.8, isClean: true, color: FUEL_COLORS.nuclear },
    ],
    interconnectors: [
      { id: 'itaipu-hvdc', name: 'Itaipu 600kV HVDC Bipole', fromRegion: 'Itaipu Hydro', toRegion: 'Southeast Demand', flowMw: 5800, capacityMw: 6300 }
    ],
    forecast24h: generateForecast(22.8, 68, 86, 71200, 'wind_surge'),
    alerts: [
      { id: 'a8', severity: 'info', title: 'Abundant Hydro & Low Spot Price', message: 'Reservoir storage index at 74% capacity. Spot energy prices near historic floor.', timestamp: '1h ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pk-ntdc',
    name: 'Pakistan National Grid (NTDC)',
    country: 'Pakistan',
    flag: '🇵🇰',
    continent: 'Asia',
    coordinates: { x: 655, y: 295, lat: 30.3753, lng: 69.3451 },
    gridOperator: 'National Transmission & Despatch Company (NTDC) / CPPA-G',
    currency: 'PKR',
    currencySymbol: 'Rs. ',
    currentDemandMw: 22800,
    peakCapacityMw: 43700,
    systemFrequencyHz: 50.012,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 335,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 28400,
    priceInUsdPerMwh: 102.00,
    renewablePercentage: 34.8,
    cleanEnergyPercentage: 51.2,
    generationMix: [
      { fuel: 'hydro', label: 'Hydro (Tarbela, Mangla, Ghazi-Barotha)', mw: 7100, percentage: 31.1, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'gas', label: 'RLNG & Natural Gas CCGTs (Bhikki, Haveli)', mw: 5400, percentage: 23.7, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'coal', label: 'Coal (Thar Lignite Block-I/II, Sahiwal)', mw: 4200, percentage: 18.4, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'nuclear', label: 'Nuclear (Chashma C1-C4, Karachi K2/K3)', mw: 3750, percentage: 16.4, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'wind', label: 'Wind Corridor (Jhimpir & Gharo)', mw: 1150, percentage: 5.0, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'solar', label: 'Solar PV (Quaid-e-Azam Park & Rooftop)', mw: 800, percentage: 3.5, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'biomass', label: 'Bagasse Sugar Mill Co-Gen', mw: 400, percentage: 1.9, isClean: true, color: FUEL_COLORS.biomass },
    ],
    interconnectors: [
      { id: 'iran-pak', name: 'Iran-Makran Intertie (Polan-Gabd 132kV)', fromRegion: 'Iran', toRegion: 'Pakistan', flowMw: 85, capacityMw: 100 },
      { id: 'casa-1000', name: 'CASA-1000 500kV HVDC (Central Asia)', fromRegion: 'Tajikistan/Kyrgyzstan', toRegion: 'Pakistan', flowMw: 0, capacityMw: 1300 },
    ],
    forecast24h: generateForecast(102.0, 335, 35, 22800, 'solar_surge'),
    alerts: [
      { id: 'pk-1', severity: 'info', title: 'Tarbela & Mangla Hydro Dispatch High', message: 'Indus Basin snowmelt and reservoir releases supplying over 7 GW clean electricity across northern 500kV circuits.', timestamp: '12m ago' },
      { id: 'pk-2', severity: 'info', title: 'Karachi K-2 & K-3 Nuclear Baseload', message: 'Hualong One reactors delivering 2,200 MW steady clean electricity into southern NTDC and K-Electric grids.', timestamp: '45m ago' },
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'in-posoco',
    name: 'India National Grid (Grid-India)',
    country: 'India',
    flag: '🇮🇳',
    continent: 'Asia',
    coordinates: { x: 695, y: 330, lat: 20.59, lng: 78.96 },
    gridOperator: 'Grid Controller of India (Grid-India / POSOCO)',
    currency: 'INR',
    currencySymbol: '₹',
    currentDemandMw: 215000,
    peakCapacityMw: 442000,
    systemFrequencyHz: 50.006,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 565,
    carbonRating: 'high',
    wholesalePricePerMwh: 4250,
    priceInUsdPerMwh: 51.20,
    renewablePercentage: 25.2,
    cleanEnergyPercentage: 28.6,
    generationMix: [
      { fuel: 'coal', label: 'Supercritical Pithead Coal', mw: 124270, percentage: 57.8, isClean: false, color: FUEL_COLORS.coal },
      { fuel: 'solar', label: 'Solar Parks (Bhadla, Pavagada)', mw: 30530, percentage: 14.2, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'hydro', label: 'Himalayan Hydroelectric (Tehri, Nathpa)', mw: 23650, percentage: 11.0, isClean: true, color: FUEL_COLORS.hydro },
      { fuel: 'wind', label: 'Tamil Nadu & Gujarat Wind', mw: 17630, percentage: 8.2, isClean: true, color: FUEL_COLORS.wind },
      { fuel: 'nuclear', label: 'Nuclear (Kudankulam, Tarapur, Kakrapar)', mw: 7310, percentage: 3.4, isClean: true, color: FUEL_COLORS.nuclear },
      { fuel: 'gas', label: 'Gas Turbines', mw: 7310, percentage: 3.4, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'biomass', label: 'Biomass & Agricultural Waste', mw: 4300, percentage: 2.0, isClean: true, color: FUEL_COLORS.biomass },
    ],
    interconnectors: [
      { id: 'in-bt', name: 'Tala & Punatsangchhu Hydro (Bhutan)', fromRegion: 'Bhutan', toRegion: 'India', flowMw: 1250, capacityMw: 2000 },
      { id: 'in-np', name: 'Dhalkebar-Muzaffarpur 400kV (Nepal)', fromRegion: 'India', toRegion: 'Nepal', flowMw: -320, capacityMw: 1000 },
      { id: 'in-bd', name: 'Bheramara HVDC Back-to-Back (Bangladesh)', fromRegion: 'India', toRegion: 'Bangladesh', flowMw: -900, capacityMw: 1000 },
    ],
    forecast24h: generateForecast(51.2, 565, 25, 215000, 'solar_surge'),
    alerts: [
      { id: 'in-1', severity: 'info', title: 'Bhadla Solar Corridor Peak Dispatch', message: 'Rajasthan & Gujarat ultra-mega solar parks dispatching over 30 GW into the Green Energy Corridor.', timestamp: '22m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sg-ema',
    name: 'Singapore & ASEAN Grid (EMA)',
    country: 'Singapore',
    flag: '🇸🇬',
    continent: 'Asia',
    coordinates: { x: 745, y: 405, lat: 1.35, lng: 103.82 },
    gridOperator: 'Energy Market Authority (EMA) / SP Group',
    currency: 'SGD',
    currencySymbol: 'S$',
    currentDemandMw: 7650,
    peakCapacityMw: 13200,
    systemFrequencyHz: 50.002,
    nominalFrequencyHz: 50,
    frequencyStatus: 'optimal',
    carbonIntensity: 378,
    carbonRating: 'moderate',
    wholesalePricePerMwh: 142.50,
    priceInUsdPerMwh: 106.30,
    renewablePercentage: 8.2,
    cleanEnergyPercentage: 14.5,
    generationMix: [
      { fuel: 'gas', label: 'High-Efficiency CCGT Gas', mw: 6540, percentage: 85.5, isClean: false, color: FUEL_COLORS.gas },
      { fuel: 'solar', label: 'Floating & Rooftop Solar PV', mw: 630, percentage: 8.2, isClean: true, color: FUEL_COLORS.solar },
      { fuel: 'storage', label: 'Jurong Island BESS & Hydro Imports', mw: 480, percentage: 6.3, isClean: true, color: FUEL_COLORS.storage },
    ],
    interconnectors: [
      { id: 'ltms', name: 'LTMS-PIP (Laos Hydropower Import)', fromRegion: 'Laos/Malaysia', toRegion: 'Singapore', flowMw: 100, capacityMw: 100 },
      { id: 'my-sg', name: 'Plentong-Woodlands 230kV Intertie', fromRegion: 'Malaysia', toRegion: 'Singapore', flowMw: 80, capacityMw: 300 },
    ],
    forecast24h: generateForecast(106.3, 378, 8, 7650, 'solar_surge'),
    alerts: [
      { id: 'sg-1', severity: 'info', title: 'ASEAN Power Grid Hydro Flow Active', message: 'Cross-border clean hydropower from Lao PDR delivering baseload renewable energy into the national grid.', timestamp: '35m ago' }
    ],
    lastUpdated: new Date().toISOString(),
  }
];
